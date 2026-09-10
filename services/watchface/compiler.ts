import { downloadFilename } from "../../src/watchface/download-filename";
import { copyFontAssets } from "./font-assets";
import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { createHash, createPrivateKey, randomUUID } from "node:crypto";
import { generateProject } from "../../src/watchface/generator";
import { validateDesign, type Design } from "../../src/watchface/schema";

export type BuildState = "queued" | "building" | "success" | "failure";
export interface BuildResult {
  filename: string;
  id: string;
  state: BuildState;
  createdAt: number;
  designHash: string;
  name: string;
  error?: string;
  log?: string;
  bytes?: number;
  sha256?: string;
}
interface Job {
  result: BuildResult;
  design: Design;
  artifact?: Buffer;
}
export interface CompilerConfig {
  sdk: string;
  key: string;
  java: string;
  repository: string;
  timeoutMs: number;
}
export const configFromEnvironment = (): CompilerConfig => ({
  sdk: process.env.CIQ_SDK_HOME || "",
  key: process.env.CIQ_SIGNING_KEY || "",
  java: process.env.JAVA_HOME
    ? join(
        process.env.JAVA_HOME,
        "bin",
        process.platform === "win32" ? "java.exe" : "java",
      )
    : "java",
  repository: process.cwd(),
  timeoutMs: 60000,
});
export async function preflight(
  config: CompilerConfig,
  processes = new Set<() => void>(),
): Promise<string[]> {
  const errors: string[] = [];
  if (!config.sdk || !isAbsolute(config.sdk))
    errors.push(
      "Set CIQ_SDK_HOME to the absolute SDK directory installed by Garmin SDK Manager.",
    );
  else
    try {
      await access(join(config.sdk, "bin", "monkeybrains.jar"));
    } catch {
      errors.push(
        "SDK compiler is missing: install Connect IQ SDK using Garmin SDK Manager.",
      );
    }
  if (!config.key || !isAbsolute(config.key))
    errors.push(
      "Set CIQ_SIGNING_KEY to an absolute path outside the repository for your RSA 4096-bit DER key.",
    );
  else
    try {
      const keyPath = await realpath(config.key);
      const repo = await realpath(config.repository);
      const rel = relative(repo, keyPath);
      if (
        rel === "" ||
        (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
      )
        errors.push("Signing keys must be outside the source repository.");
      const key = createPrivateKey({
        key: await readFile(keyPath),
        format: "der",
        type: "pkcs8",
      });
      if (
        key.asymmetricKeyType !== "rsa" ||
        key.asymmetricKeyDetails?.modulusLength !== 4096
      )
        errors.push("Signing key must be RSA 4096-bit PKCS8 DER.");
    } catch {
      errors.push(
        "Signing key is missing or invalid. Follow docs/watchface/README.md to create a local key.",
      );
    }
  try {
    await runProcess(config.java, ["-version"], process.cwd(), 5000, processes);
  } catch {
    errors.push(
      "Java runtime is unavailable. Install JDK 17 or newer and set JAVA_HOME.",
    );
  }
  return errors;
}

export function runProcess(
  command: string,
  args: string[],
  cwd: string,
  timeout: number,
  activeProcesses = new Set<() => void>(),
): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        JAVA_TOOL_OPTIONS: "",
        _JAVA_OPTIONS: "",
        JDK_JAVA_OPTIONS: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let failure: string | undefined;
    const kill = () => {
      if (!child.pid) return;
      try {
        if (process.platform === "win32") child.kill("SIGKILL");
        else process.kill(-child.pid, "SIGKILL");
      } catch {
        /* process already exited */
      }
    };
    activeProcesses.add(kill);
    const timer = setTimeout(() => {
      failure =
        "Compilation exceeded its time limit. Simplify the design or check the SDK installation.";
      kill();
    }, timeout);
    const receive = (chunk: Buffer) => {
      if (output.length + chunk.length > 65536) {
        failure = "Compiler output exceeded the 64 KB limit.";
        kill();
      } else output += chunk.toString();
    };
    child.stdout.on("data", receive);
    child.stderr.on("data", receive);
    child.on("error", (error) => {
      clearTimeout(timer);
      activeProcesses.delete(kill);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      activeProcesses.delete(kill);
      if (failure || code !== 0)
        reject(
          new Error(failure || output || `Compiler exited with code ${code}.`),
        );
      else resolvePromise(output);
    });
  });
}
export class BuildQueue {
  private activeProcesses = new Set<() => void>();
  private jobs = new Map<string, Job>();
  private busy = false;
  private stopping = false;
  async shutdown() {
    this.stopping = true;
    for (const kill of this.activeProcesses) kill();
    while (this.busy) await new Promise((resolve) => setTimeout(resolve, 50));
    this.jobs.clear();
  }
  constructor(private config: CompilerConfig) {}
  prune() {
    for (const [id, job] of this.jobs)
      if (
        ["success", "failure"].includes(job.result.state) &&
        Date.now() - job.result.createdAt > 15 * 60 * 1000
      )
        this.jobs.delete(id);
  }
  get(id: string) {
    this.prune();
    return this.jobs.get(id);
  }
  enqueue(input: unknown): BuildResult {
    if (this.stopping) throw new Error("Compiler is shutting down.");
    const design = validateDesign(input);
    this.prune();
    if (
      this.jobs.size >= 20 ||
      [...this.jobs.values()].filter((j) =>
        ["queued", "building"].includes(j.result.state),
      ).length >= 4
    )
      throw new Error(
        "Build queue is full. Wait for the current builds to finish or old downloads to expire.",
      );
    const result: BuildResult = {
      id: randomUUID(),
      state: "queued",
      createdAt: Date.now(),
      filename: downloadFilename(design),
      designHash: createHash("sha256")
        .update(JSON.stringify(design))
        .digest("hex"),
      name: design.name,
    };
    this.jobs.set(result.id, { design, result });
    setImmediate(() => void this.pump());
    return { ...result };
  }
  private async pump() {
    if (this.busy || this.stopping) return;
    const job = [...this.jobs.values()].find(
      (j) => j.result.state === "queued",
    );
    if (!job) return;
    this.busy = true;
    job.result.state = "building";
    let directory: string | undefined;
    try {
      const errors = await preflight(this.config, this.activeProcesses);
      if (errors.length) throw new Error(errors.join("\n"));
      if (this.stopping) throw new Error("Compiler is shutting down.");
      directory = await mkdtemp(join(tmpdir(), "watchface-build-"));
      for (const [file, source] of Object.entries(
        generateProject(job.design),
      )) {
        const destination = join(directory, file);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, source, { mode: 0o600 });
      }
      if (this.stopping) throw new Error("Compiler is shutting down.");
      await copyFontAssets(job.design, directory, this.config.repository);
      const log = await runProcess(
        this.config.java,
        [
          "-Xmx256m",
          "-XX:MaxMetaspaceSize=128m",
          "-XX:ActiveProcessorCount=2",
          "-Djava.awt.headless=true",
          "-classpath",
          join(this.config.sdk, "bin", "monkeybrains.jar"),
          "com.garmin.monkeybrains.Monkeybrains",
          "-d",
          job.design.device,
          "-f",
          "monkey.jungle",
          "-o",
          "face.prg",
          "-y",
          this.config.key,
          "-r",
        ],
        directory,
        this.config.timeoutMs,
        this.activeProcesses,
      );
      const artifactPath = join(directory, "face.prg");
      const file = await stat(artifactPath);
      if (!file.isFile() || file.size < 16 || file.size > 4 * 1024 * 1024)
        throw new Error("Compiler did not produce a valid-size .prg artifact.");
      job.artifact = await readFile(artifactPath);
      Object.assign(job.result, {
        state: "success",
        bytes: file.size,
        log,
        sha256: createHash("sha256").update(job.artifact).digest("hex"),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected compilation failure.";
      job.result.state = "failure";
      job.result.error = message
        .replaceAll(this.config.key || "\0", "[signing key]")
        .replaceAll(this.config.sdk || "\0", "[SDK]")
        .replaceAll(directory || "\0", "[build]")
        .slice(0, 65536);
    } finally {
      if (directory)
        await rm(directory, { recursive: true, force: true }).catch(() => {
          job.result.state = "failure";
          job.result.error =
            "Temporary build cleanup failed. Restart the service and inspect its temporary directory.";
          job.artifact = undefined;
        });
      this.busy = false;
      void this.pump();
    }
  }
}

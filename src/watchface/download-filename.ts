import { getDeviceById } from "../devices/catalog";
import type { Design } from "./schema";

/** UTC timestamp keeps generated filenames portable and distinct between builds. */
export function downloadFilename(design: Design, date = new Date()) {
  const slug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  return `${slug(design.name)}-${slug(getDeviceById(design.device)!.name)}-${timestamp}.prg`;
}

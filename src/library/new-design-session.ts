/** A tab-local pointer, not a saved design. Project contents stay in the library. */
export const NEW_DESIGN_SESSION_KEY = "watchface.new-design-session";
export const newDesignSource = (device: string, preset?: string) =>
  JSON.stringify([device, preset ?? null]);
interface Session {
  source: string;
  projectId: string;
}
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export class NewDesignSession {
  private value: Session | null = null;
  private loaded = false;
  private listeners = new Set<() => void>();
  constructor(private storage: () => StoragePort) {}
  getSnapshot = () => {
    if (!this.loaded) {
      this.loaded = true;
      try {
        const raw = this.storage().getItem(NEW_DESIGN_SESSION_KEY);
        const value = raw ? JSON.parse(raw) : null;
        if (
          value &&
          typeof value.source === "string" &&
          typeof value.projectId === "string" &&
          /^[a-zA-Z0-9_-]{1,64}$/.test(value.projectId)
        )
          this.value = { source: value.source, projectId: value.projectId };
      } catch {
        /* Session storage may be unavailable; keep working in memory. */
      }
    }
    return this.value;
  };
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  begin(source: string) {
    this.loaded = true;
    this.value = { source, projectId: crypto.randomUUID() };
    try {
      this.storage().setItem(
        NEW_DESIGN_SESSION_KEY,
        JSON.stringify(this.value),
      );
    } catch {
      /* Saving projects remains independent of this tab pointer. */
    }
    for (const listener of this.listeners) listener();
    return this.value;
  }
  resume(source: string) {
    const current = this.getSnapshot();
    return current?.source === source ? current : this.begin(source);
  }
}
export const newDesignSession = new NewDesignSession(
  () => window.sessionStorage,
);

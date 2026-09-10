import { serializeProject, type Design } from "../../../watchface/schema";

/** History contains designs only; a transaction groups a continuous interaction. */
export class DesignHistory {
  private past: Design[] = [];
  private future: Design[] = [];
  private start: Design | null = null;
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  begin(design: Design) {
    this.start ??= structuredClone(design);
  }
  record(before: Design, after: Design) {
    if (this.start || serializeProject(before) === serializeProject(after))
      return;
    this.past.push(structuredClone(before));
    if (this.past.length > 100) this.past.shift();
    this.future = [];
  }
  commit(design: Design) {
    const start = this.start;
    this.start = null;
    if (start) this.record(start, design);
  }
  cancel() {
    const start = this.start;
    this.start = null;
    return start;
  }
  undo(current: Design) {
    this.commit(current);
    const previous = this.past.pop();
    if (!previous) return current;
    this.future.push(structuredClone(current));
    return previous;
  }
  redo(current: Design) {
    this.commit(current);
    const next = this.future.pop();
    if (!next) return current;
    this.past.push(structuredClone(current));
    return next;
  }
}

import { describe, expect, it } from "vitest";
import { editorShortcut } from "../../../src/components/editor/model/shortcuts";

function key(
  value: string,
  options: Partial<{
    code: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  }> = {},
) {
  return editorShortcut({
    key: value,
    code: options.code,
    metaKey: options.metaKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
  });
}

describe("editor keyboard shortcuts", () => {
  it("maps Mac and Windows clipboard commands", () => {
    expect(key("c", { metaKey: true })).toBe("copy");
    expect(key("x", { ctrlKey: true })).toBe("cut");
    expect(key("V", { metaKey: true })).toBe("paste");
    expect(key("d", { ctrlKey: true })).toBe("duplicate");
  });

  it("maps delete keys without a modifier", () => {
    expect(key("Delete")).toBe("delete");
    expect(key("Backspace")).toBe("delete");
  });

  it("maps bracket shortcuts using physical key codes", () => {
    expect(key("]", { code: "BracketRight", metaKey: true })).toBe(
      "bring-forward",
    );
    expect(
      key("}", {
        code: "BracketRight",
        ctrlKey: true,
        shiftKey: true,
      }),
    ).toBe("bring-front");
    expect(key("[", { code: "BracketLeft", ctrlKey: true })).toBe(
      "send-backward",
    );
    expect(
      key("{", {
        code: "BracketLeft",
        metaKey: true,
        shiftKey: true,
      }),
    ).toBe("send-back");
  });

  it("leaves browser and alternate-key gestures alone", () => {
    expect(key("c")).toBeNull();
    expect(key("v", { metaKey: true, altKey: true })).toBeNull();
    expect(key("a", { metaKey: true })).toBeNull();
  });
});

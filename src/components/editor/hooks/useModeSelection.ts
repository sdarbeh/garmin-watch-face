import { useRef, useState } from "react";
import { powerLayout } from "@/watchface/power";
import type { Design, ElementId } from "@/watchface/schema";
import type { DisplayMode } from "../model/simulation";
import type { EditorSelection } from "../types";
import {
  resolveModeSelection,
  type ModeSelectionSnapshot,
} from "../model/selection";

function initialSelection(design: Design): EditorSelection {
  return (
    design.elements.find((element) => element.id === "time")?.id ??
    design.elements.find((element) => element.type === "time")?.id ??
    design.elements.at(-1)?.id ??
    "background"
  );
}

/** Keeps an independent layer selection for each editable display mode. */
export function useModeSelection(design: Design) {
  const firstSelection = initialSelection(design);
  const firstSnapshot: ModeSelectionSnapshot = {
    selected: firstSelection,
    selectedIds: firstSelection === "background" ? [] : [firstSelection],
  };
  const [mode, setMode] = useState<DisplayMode>("normal");
  const [snapshot, setSnapshot] = useState(firstSnapshot);
  const memory = useRef<Partial<Record<DisplayMode, ModeSelectionSnapshot>>>({
    normal: firstSnapshot,
  });

  function applySelection(
    selected: EditorSelection,
    selectedIds: ElementId[],
    targetMode = mode,
  ) {
    const next = { selected, selectedIds };
    memory.current[targetMode] = next;
    setSnapshot(next);
  }

  function selectLayers(ids: ElementId[]) {
    applySelection(ids.at(-1) ?? "background", ids);
  }

  function selectLayer(next: EditorSelection, additive = false) {
    if (next === "background") {
      applySelection(next, []);
      return;
    }
    if (!additive) {
      applySelection(next, [next]);
      return;
    }
    const exists = snapshot.selectedIds.includes(next);
    const selectedIds = exists
      ? snapshot.selectedIds.filter((id) => id !== next)
      : [...snapshot.selectedIds, next];
    applySelection(selectedIds.at(-1) ?? "background", selectedIds);
  }

  function changeMode(nextMode: DisplayMode) {
    if (nextMode === mode) return;
    const nextDesign = powerLayout(design, nextMode);
    const remembered = memory.current[nextMode];
    const current = powerLayout(design, mode).elements.find(
      (element) => element.id === snapshot.selected,
    );
    const next = resolveModeSelection(nextDesign, remembered, current?.type);
    applySelection(next.selected, next.selectedIds, nextMode);
    setMode(nextMode);
  }

  function focusSelection(nextMode: DisplayMode, next: EditorSelection) {
    const layout = powerLayout(design, nextMode);
    const selection =
      next !== "background" &&
      layout.elements.some((element) => element.id === next)
        ? next
        : "background";
    applySelection(
      selection,
      selection === "background" ? [] : [selection],
      nextMode,
    );
    setMode(nextMode);
  }

  return {
    mode,
    selected: snapshot.selected,
    selectedIds: snapshot.selectedIds,
    applySelection,
    selectLayer,
    selectLayers,
    changeMode,
    focusSelection,
  };
}

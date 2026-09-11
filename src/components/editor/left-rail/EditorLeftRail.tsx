"use client";

import { useState } from "react";
import { getDeviceById } from "@/devices/catalog";
import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import type { DispatchEditorCommand } from "@/components/editor/model/commands";
import type { EditorContextRequest } from "@/components/editor/model/context-menu";
import type { EditorSelection } from "@/components/editor/types";
import { AddElementsScreen } from "./AddElementsScreen";
import { LayersScreen } from "./LayersScreen";

type LeftRailScreen = "layers" | "add-elements";

export function EditorLeftRail({
  selected,
  selectedIds,
  onSelect,
  onOpenContextMenu,
  design,
  onCommand,
  ready,
}: {
  selected: EditorSelection;
  selectedIds: string[];
  onSelect: (selection: EditorSelection, additive?: boolean) => void;
  onOpenContextMenu: (request: EditorContextRequest) => void;
  design: Design;
  onCommand: DispatchEditorCommand;
  ready: boolean;
}) {
  const [screen, setScreen] = useState<LeftRailScreen>("layers");
  const device = getDeviceById(design.device)!;
  const addDisabled = !ready || design.elements.length >= MAX_ELEMENTS;

  function addElement(templateId: string) {
    if (addDisabled) return;
    onCommand({ type: "layer.add-template", templateId });
    setScreen("layers");
  }

  return (
    <aside className="watchface-left-rail" aria-label="Editor layers">
      {screen === "layers" && (
        <LayersScreen
          selected={selected}
          selectedIds={selectedIds}
          design={design}
          ready={ready}
          addDisabled={addDisabled}
          onSelect={onSelect}
          onCommand={onCommand}
          onOpenContextMenu={onOpenContextMenu}
          onOpenAdd={() => setScreen("add-elements")}
        />
      )}
      {screen === "add-elements" && (
        <AddElementsScreen
          device={device}
          disabled={addDisabled}
          onAdd={addElement}
          onBack={() => setScreen("layers")}
        />
      )}
    </aside>
  );
}

import { Button } from "@/components/ui";
import { RedoIcon, UndoIcon } from "@/icons";
import type { useDesignHistory } from "@/components/editor/hooks/useDesignHistory";

export function FooterHistoryControls({
  ready,
  history,
}: {
  ready: boolean;
  history: ReturnType<typeof useDesignHistory>;
}) {
  return (
    <div
      className="watchface-footer__history"
      role="group"
      aria-label="Edit history"
    >
      <Button
        size="sm"
        variant="ghost"
        aria-label="Undo"
        disabled={!ready || !history.canUndo}
        onClick={history.undo}
      >
        <UndoIcon size="sm" />
        <span className="watchface-footer__history-label">Undo</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label="Redo"
        disabled={!ready || !history.canRedo}
        onClick={history.redo}
      >
        <RedoIcon size="sm" />
        <span className="watchface-footer__history-label">Redo</span>
      </Button>
    </div>
  );
}

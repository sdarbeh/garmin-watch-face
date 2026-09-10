import { ChevronLeftIcon } from "@/icons";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { Design } from "@/watchface/schema";

export function EditorToolbar({
  design,
  ready,
  saved,
  setDesign,
  preview,
  onPreview,
  onExport,
}: {
  design: Design;
  ready: boolean;
  saved: string;
  setDesign: (design: Design) => void;
  preview: boolean;
  onPreview: () => void;
  onExport: () => void;
}) {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  return (
    <header className="watchface-toolbar">
      <Button variant="ghost" href="/designs" className="watchface-back">
        <ChevronLeftIcon size="sm" strokeWidth="1.5" />
        My designs
      </Button>
      <span className="watchface-toolbar__divider" aria-hidden="true" />
      <label className="watchface-project-name">
        <span className="u-sr-only">Project name</span>
        <input
          disabled={!ready}
          value={nameDraft ?? design.name}
          maxLength={40}
          aria-invalid={nameDraft !== null}
          aria-describedby={
            nameDraft !== null ? "project-name-help" : undefined
          }
          onBlur={() => setNameDraft(null)}
          onChange={(event) => {
            const name = event.target.value;
            if (/^[A-Za-z0-9][A-Za-z0-9 _-]{0,39}$/.test(name)) {
              setNameDraft(null);
              setDesign({ ...design, name });
            } else setNameDraft(name);
          }}
        />
        {nameDraft !== null && (
          <span
            id="project-name-help"
            className="watchface-name-help u-font-xs u-text-warn"
          >
            Start with a letter or number. Use letters, numbers, spaces, hyphens
            or underscores.
          </span>
        )}
      </label>
      <span className="watchface-save-status" role="status">
        {saved}
      </span>
      <div className="watchface-toolbar__actions">
        <Button
          size="sm"
          variant="ghost"
          active={preview}
          aria-pressed={preview}
          onClick={onPreview}
        >
          {preview ? "Back to editor" : "Preview"}
        </Button>
        <Button variant="primary" disabled={!ready} onClick={onExport}>
          Export
        </Button>
      </div>
    </header>
  );
}

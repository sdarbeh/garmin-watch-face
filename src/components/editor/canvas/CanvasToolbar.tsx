import { Button } from "@/components/ui";
import {
  FitIcon,
  GridIcon,
  GuidesIcon,
  MinusIcon,
  PlusIcon,
  SnapIcon,
} from "@/icons";

const MIN_ZOOM = 25;
const MAX_ZOOM = 300;
const ZOOM_STEP = 5;
const ZOOM_OPTIONS = [25, 50, 75, 100, 125, 150, 200, 300];

export function CanvasToolbar({
  zoom,
  preview,
  gridEnabled,
  snapEnabled,
  guidesEnabled,
  onZoomChange,
  onFit,
  onGridChange,
  onSnapChange,
  onGuidesChange,
}: {
  zoom: number;
  preview: boolean;
  gridEnabled: boolean;
  snapEnabled: boolean;
  guidesEnabled: boolean;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  onGridChange: (enabled: boolean) => void;
  onSnapChange: (enabled: boolean) => void;
  onGuidesChange: (enabled: boolean) => void;
}) {
  return (
    <div
      className="watchface-canvas-toolbar u-flex u-items-center u-radius-pill"
      role="toolbar"
      aria-label="Canvas controls"
    >
      <Button
        size="xs"
        variant="ghost"
        aria-label="Fit canvas"
        onClick={onFit}
        title="Fit canvas"
      >
        <FitIcon size="sm" />
        <span className="watchface-canvas-toolbar__label">Fit</span>
      </Button>
      <span className="watchface-canvas-toolbar__divider" aria-hidden="true" />
      <div className="watchface-canvas-toolbar__zoom u-flex u-items-center">
        <span className="u-sr-only" aria-live="polite">
          {zoom}% zoom
        </span>
        <Button
          size="xs"
          variant="ghost"
          iconOnly
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
        >
          <MinusIcon size="sm" />
        </Button>
        <label>
          <span className="u-sr-only">Canvas zoom</span>
          <select
            value={zoom}
            aria-label="Canvas zoom"
            onChange={(event) => onZoomChange(Number(event.target.value))}
          >
            {!ZOOM_OPTIONS.includes(zoom) && (
              <option value={zoom}>{zoom}%</option>
            )}
            {ZOOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}%
              </option>
            ))}
          </select>
        </label>
        <Button
          size="xs"
          variant="ghost"
          iconOnly
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
        >
          <PlusIcon size="sm" />
        </Button>
      </div>
      <span className="watchface-canvas-toolbar__divider" aria-hidden="true" />
      <Button
        size="xs"
        variant="ghost"
        active={gridEnabled}
        aria-pressed={gridEnabled}
        aria-label="Show circular layout grid"
        disabled={preview}
        onClick={() => onGridChange(!gridEnabled)}
        title="Show circular layout grid"
      >
        <span className="watchface-canvas-toolbar__icon">
          <GridIcon size="sm" />
        </span>
        <span className="watchface-canvas-toolbar__label">Grid</span>
      </Button>
      <span className="watchface-canvas-toolbar__divider" aria-hidden="true" />
      <Button
        size="xs"
        variant="ghost"
        active={snapEnabled}
        aria-pressed={snapEnabled}
        aria-label="Snap layers while moving and resizing"
        disabled={preview}
        onClick={() => onSnapChange(!snapEnabled)}
        title="Snap layers while moving and resizing"
      >
        <span className="watchface-canvas-toolbar__icon">
          <SnapIcon size="sm" />
        </span>
        <span className="watchface-canvas-toolbar__label">Snap</span>
      </Button>
      <span className="watchface-canvas-toolbar__divider" aria-hidden="true" />
      <Button
        size="xs"
        variant="ghost"
        active={guidesEnabled}
        aria-pressed={guidesEnabled}
        aria-label="Show alignment guides while editing"
        disabled={preview}
        onClick={() => onGuidesChange(!guidesEnabled)}
        title="Show alignment guides while editing"
      >
        <span className="watchface-canvas-toolbar__icon">
          <GuidesIcon size="sm" />
        </span>
        <span className="watchface-canvas-toolbar__label">Guides</span>
      </Button>
    </div>
  );
}

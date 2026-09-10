import { Button } from "@/components/ui";

export function ZoomControls({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className="u-flex u-items-center u-justify-center gap2"
      role="group"
      aria-label="Canvas zoom"
    >
      <Button
        size="sm"
        variant="ghost"
        disabled={value <= 25}
        aria-label="Zoom out"
        onClick={() => onChange(Math.max(25, value - 25))}
      >
        −
      </Button>
      <span className="u-font-xs u-text-secondary" aria-live="polite">
        {value}%
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={value >= 300}
        aria-label="Zoom in"
        onClick={() => onChange(Math.min(300, value + 25))}
      >
        +
      </Button>
    </div>
  );
}

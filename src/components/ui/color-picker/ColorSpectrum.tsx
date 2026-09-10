import type { PointerEvent } from "react";
import { clamp, hsvToHex, type HSV } from "./color";

export function ColorSpectrum({
  value,
  onChange,
}: {
  value: HSV;
  onChange: (value: HSV) => void;
}) {
  function point(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    onChange({
      ...value,
      h: clamp(((event.clientX - rect.left) / rect.width) * 360, 360),
      s: clamp(((event.clientY - rect.top) / rect.height) * 100),
    });
  }
  return (
    <>
      <div
        className="ui-color-picker__spectrum"
        role="slider"
        tabIndex={0}
        aria-label="Color spectrum"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(value.h)}
        aria-valuetext={`Hue ${Math.round(value.h)} degrees, saturation ${Math.round(value.s)} percent. Left and right change hue; up and down change saturation.`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          point(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            point(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            point(event);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 1;
          const next = { ...value };
          if (event.key === "ArrowLeft") next.h = clamp(value.h - step, 360);
          else if (event.key === "ArrowRight")
            next.h = clamp(value.h + step, 360);
          else if (event.key === "ArrowUp") next.s = clamp(value.s - step);
          else if (event.key === "ArrowDown") next.s = clamp(value.s + step);
          else return;
          event.preventDefault();
          event.stopPropagation();
          onChange(next);
        }}
      >
        <span
          className="ui-color-picker__cursor"
          style={{
            left: `${(value.h / 360) * 100}%`,
            top: `${value.s}%`,
            backgroundColor: hsvToHex(value),
          }}
        />
      </div>
      <input
        className="ui-color-picker__range"
        aria-label="Brightness"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value.v}
        style={{
          background: `linear-gradient(to right, var(--app-color-on-light), ${hsvToHex({ ...value, v: 100 })})`,
        }}
        onChange={(event) =>
          onChange({ ...value, v: Number(event.target.value) })
        }
      />
    </>
  );
}

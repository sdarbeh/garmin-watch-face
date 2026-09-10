import { dialMarks } from "@/watchface/dial";
import { presentation } from "@/watchface/schema";
import { isGraphic } from "@/watchface/layer-catalog";
import { graphicLines } from "@/watchface/graphics";
import type { renderModel } from "@/watchface/render-model";
import { GlyphText } from "./GlyphText";
export function VisualLayer({
  element,
}: {
  element: ReturnType<typeof renderModel>[number];
}) {
  const p = presentation(element);
  if (!isGraphic(element.type, p.variant))
    return <GlyphText element={element} />;
  if (element.type === "shape" && ["dial", "field-dial"].includes(p.variant))
    return (
      <g pointerEvents="none">
        {dialMarks(element).map((mark, index) =>
          mark.kind === "disc" ? (
            <circle
              key={index}
              cx={mark.x}
              cy={mark.y}
              r={mark.radius}
              fill={mark.color}
            />
          ) : (
            <line
              key={index}
              x1={mark.x}
              y1={mark.y}
              x2={mark.x2}
              y2={mark.y2}
              stroke={mark.color}
              strokeWidth={mark.stroke}
            />
          ),
        )}
      </g>
    );
  if (element.type === "image" && p.image)
    return (
      <image
        href={p.image}
        x={element.x - p.width / 2}
        y={element.y - p.height / 2}
        width={p.width}
        height={p.height}
        preserveAspectRatio="none"
        style={{ imageRendering: p.variant === "pixel" ? "pixelated" : "auto" }}
        pointerEvents="none"
      />
    );
  return (
    <g
      fill="none"
      stroke={element.color}
      strokeWidth={p.stroke}
      pointerEvents="none"
    >
      {graphicLines(element, element.ratio).map((line, index) => (
        <polyline
          key={index}
          points={line.map((point) => point.join(",")).join(" ")}
        />
      ))}
    </g>
  );
}

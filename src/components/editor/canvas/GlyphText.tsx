import { useId } from "react";
import { type renderModel } from "@/watchface/render-model";
import { elementBounds } from "../model/geometry";

/** The exact bitmap glyphs packaged for Connect IQ, tinted with the design color. */
export function GlyphText({
  element,
}: {
  element: ReturnType<typeof renderModel>[number];
}) {
  const id = useId();
  const f = element.font;
  const bounds = elementBounds(element);
  let advance = 0;
  return (
    <g pointerEvents="none" aria-hidden="true">
      {[...element.sample].map((char, index) => {
        const [sx, sy, width, height, xoffset, yoffset, xadvance] =
          f.glyphs[String(char.charCodeAt(0))] ?? f.glyphs["63"];
        const x = bounds.left + advance + xoffset;
        advance += xadvance;
        return (
          <svg
            key={index}
            x={x}
            y={element.y - f.height / 2 + yoffset}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
          >
            <defs>
              <mask
                id={`${id}-${index}`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={width}
                height={height}
              >
                <image
                  href={`/fonts/watchface/${f.atlasKey}.png`}
                  x={-sx}
                  y={-sy}
                  width={f.width}
                  height={f.atlasHeight}
                />
              </mask>
            </defs>
            <rect
              width={width}
              height={height}
              fill={element.color}
              mask={`url(#${id}-${index})`}
            />
          </svg>
        );
      })}
    </g>
  );
}

import { useLayoutEffect, useState, type RefObject } from "react";

const CANVAS_INSET_RATIO = 0.96;

export function fittedCanvasWidth({
  presentationWidth,
  frameWidth,
  frameHeight,
  viewportWidth,
  viewportHeight,
}: {
  presentationWidth: number;
  frameWidth: number;
  frameHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}) {
  if (viewportWidth <= 0 || viewportHeight <= 0) return presentationWidth;
  const widthLimit = viewportWidth * CANVAS_INSET_RATIO;
  const heightLimit =
    viewportHeight * (frameWidth / frameHeight) * CANVAS_INSET_RATIO;
  return Math.max(
    1,
    Math.floor(Math.min(presentationWidth, widthLimit, heightLimit)),
  );
}

export function useCanvasFit(
  viewport: RefObject<HTMLElement | null>,
  frame: { presentationWidth: number; width: number; height: number },
) {
  const [width, setWidth] = useState(frame.presentationWidth);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const update = () => {
      setWidth(
        fittedCanvasWidth({
          presentationWidth: frame.presentationWidth,
          frameWidth: frame.width,
          frameHeight: frame.height,
          viewportWidth: element.clientWidth,
          viewportHeight: element.clientHeight,
        }),
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [frame.height, frame.presentationWidth, frame.width, viewport]);

  return width;
}

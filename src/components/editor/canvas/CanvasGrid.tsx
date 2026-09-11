const CENTER = 227;
const RADIAL_MARKERS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6;
  return {
    x1: CENTER + Math.sin(angle) * 194,
    y1: CENTER - Math.cos(angle) * 194,
    x2: CENTER + Math.sin(angle) * 207,
    y2: CENTER - Math.cos(angle) * 207,
  };
});

export function CanvasGrid() {
  return (
    <g className="watchface-canvas-grid" pointerEvents="none">
      <circle cx={CENTER} cy={CENTER} r="204" />
      <circle cx={CENTER} cy={CENTER} r="181" strokeDasharray="4 6" />
      <line x1={CENTER} x2={CENTER} y1="0" y2="454" />
      <line x1="0" x2="454" y1={CENTER} y2={CENTER} />
      {RADIAL_MARKERS.map((marker, index) => (
        <line key={index} {...marker} />
      ))}
    </g>
  );
}

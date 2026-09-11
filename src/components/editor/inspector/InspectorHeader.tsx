export function InspectorHeader({
  title,
  badge,
  description,
}: {
  title: string;
  badge: string;
  description?: string;
}) {
  return (
    <header className="watchface-inspector-header">
      <div className="watchface-inspector-header__title-row">
        <h2>{title}</h2>
        <span className="watchface-inspector-header__badge">{badge}</span>
      </div>
      {description && (
        <p className="watchface-inspector-header__description">{description}</p>
      )}
    </header>
  );
}

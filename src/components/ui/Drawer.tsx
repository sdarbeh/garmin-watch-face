import type { ReactNode } from "react";

export function Drawer({
  open,
  labelledBy,
  children,
}: {
  open: boolean;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <div
      className="ui-drawer"
      role="region"
      aria-labelledby={labelledBy}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="ui-drawer__body">{children}</div>
    </div>
  );
}

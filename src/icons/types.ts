import type { SVGProps } from "react";

export type IconSize = "xs" | "sm" | "md" | "lg";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "size"> & {
  size?: IconSize;
};

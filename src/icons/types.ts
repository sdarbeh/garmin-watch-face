import type { SVGProps } from "react";

export type IconSize = "xxs" | "xs" | "sm" | "md" | "lg";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "size"> & {
  size?: IconSize;
};

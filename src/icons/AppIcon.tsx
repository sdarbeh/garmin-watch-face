import type { ReactNode } from "react";

import { cx } from "@/utils/css";
import type { IconProps, IconSize } from "./types";

const ICON_SIZE_CLASS: Record<IconSize, string> = {
  xxs: "u-icon-xxs",
  xs: "u-icon-xs",
  sm: "u-icon-sm",
  md: "u-icon-md",
  lg: "u-icon-lg",
};

export const AppIcon = ({
  children,
  className,
  fill = "none",
  size = "md",
  stroke = "currentColor",
  strokeLinecap = "round",
  strokeLinejoin = "round",
  strokeWidth = "1.75",
  ...props
}: IconProps & { children: ReactNode }) => (
  <svg
    {...props}
    aria-hidden="true"
    className={cx(ICON_SIZE_CLASS[size], className)}
    focusable="false"
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap={strokeLinecap}
    strokeLinejoin={strokeLinejoin}
  >
    {children}
  </svg>
);

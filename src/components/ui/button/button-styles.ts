import { cx } from "@/utils/css";
import type { UiHapticEvent } from "@/utils/haptics";

export const BUTTON_VARIANT_CLASS = {
  danger: "ui-button--danger",
  ghost: "ui-button--ghost",
  primary: "ui-button--primary",
  secondary: "ui-button--secondary",
} as const;

export const BUTTON_SIZE_CLASS = {
  lg: "ui-button--lg",
  md: "ui-button--md",
  sm: "ui-button--sm",
  xs: "ui-button--xs",
} as const;

export type ButtonHaptic = UiHapticEvent;
export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS;
export type ButtonSize = keyof typeof BUTTON_SIZE_CLASS;

type GetButtonClassNameOptions = {
  className?: string;
  iconOnly?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export const getButtonClassName = ({
  className,
  iconOnly,
  size = "md",
  variant = "secondary",
}: GetButtonClassNameOptions) =>
  cx(
    "ui-button",
    BUTTON_VARIANT_CLASS[variant],
    BUTTON_SIZE_CLASS[size],
    iconOnly && "ui-button--icon-only",
    className,
  );

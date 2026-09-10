import type { MouseEventHandler } from "react";

import { triggerUiHaptic } from "@/utils/haptics";

import type { ButtonHaptic } from "./button-styles";

export const getButtonClickHandler = <Element extends HTMLElement>(
  haptic: ButtonHaptic | undefined,
  onClick: MouseEventHandler<Element> | undefined,
): MouseEventHandler<Element> | undefined => {
  if (!haptic) return onClick;

  return (event) => {
    triggerUiHaptic(haptic);
    onClick?.(event);
  };
};

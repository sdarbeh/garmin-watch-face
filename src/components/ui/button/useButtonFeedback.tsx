"use client";

import { useState, type MouseEventHandler, type ReactNode } from "react";

import { getButtonClickHandler } from "./button-haptics";
import type { ButtonHaptic } from "./button-styles";

type ButtonFeedbackConfig = {
  effectClassName: string | null;
};

const BUTTON_FEEDBACK_CONFIG = {
  press: { effectClassName: null },
  ripple: { effectClassName: "u-ripple" },
} as const satisfies Record<ButtonHaptic, ButtonFeedbackConfig>;

type UseButtonFeedbackOptions<Element extends HTMLElement> = {
  children: ReactNode;
  haptic: ButtonHaptic | undefined;
  onClick: MouseEventHandler<Element> | undefined;
};

export const useButtonFeedback = <Element extends HTMLElement>(
  options: UseButtonFeedbackOptions<Element>,
) => {
  const { children, haptic, onClick } = options;
  const [feedbackSequence, setFeedbackSequence] = useState(0);
  const hapticClickHandler = getButtonClickHandler(haptic, onClick);
  const effectClassName = haptic
    ? BUTTON_FEEDBACK_CONFIG[haptic].effectClassName
    : null;

  const handleFeedbackClick: MouseEventHandler<Element> = (event) => {
    if (effectClassName) setFeedbackSequence((sequence) => sequence + 1);
    hapticClickHandler?.(event);
  };

  return {
    content: (
      <>
        {children}
        {effectClassName && feedbackSequence > 0 && (
          <span
            aria-hidden="true"
            className={`ui-button__feedback ${effectClassName}`}
            key={feedbackSequence}
          />
        )}
      </>
    ),
    interactionProps: {
      "data-haptic": haptic,
      onClick: effectClassName ? handleFeedbackClick : hapticClickHandler,
    },
  };
};

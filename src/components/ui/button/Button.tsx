"use client";

import Link from "next/link";
import type { ComponentPropsWithRef } from "react";

import {
  getButtonClassName,
  type ButtonHaptic,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";
import { useButtonFeedback } from "./useButtonFeedback";

type ButtonAppearance = {
  active?: boolean;
  haptic?: ButtonHaptic;
  iconOnly?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ActionButtonProps = ComponentPropsWithRef<"button"> &
  ButtonAppearance & { href?: never };
type LinkButtonProps = ComponentPropsWithRef<"a"> &
  ButtonAppearance & {
    href: string;
    onNavigate?: ComponentPropsWithRef<typeof Link>["onNavigate"];
  };
export type ButtonProps = ActionButtonProps | LinkButtonProps;

const ActionButton = ({
  active,
  children,
  className,
  haptic,
  iconOnly,
  onClick,
  size,
  type = "button",
  variant,
  ...props
}: ActionButtonProps) => {
  const feedback = useButtonFeedback({ children, haptic, onClick });

  return (
    <button
      {...props}
      {...feedback.interactionProps}
      className={getButtonClassName({ className, iconOnly, size, variant })}
      data-active={active || undefined}
      type={type}
    >
      {feedback.content}
    </button>
  );
};

const LinkButton = ({
  active,
  children,
  className,
  haptic,
  iconOnly,
  onClick,
  size,
  variant,
  href,
  download,
  onNavigate,
  ...props
}: LinkButtonProps) => {
  const feedback = useButtonFeedback({ children, haptic, onClick });
  const shared = {
    ...props,
    ...feedback.interactionProps,
    className: getButtonClassName({ className, iconOnly, size, variant }),
    "data-active": active || undefined,
  };
  return download !== undefined ? (
    <a {...shared} href={href} download={download}>
      {feedback.content}
    </a>
  ) : (
    <Link {...shared} href={href} onNavigate={onNavigate}>
      {feedback.content}
    </Link>
  );
};

/** Actions render native buttons; href renders a link with the same appearance. */
export const Button = (props: ButtonProps) =>
  typeof props.href === "string" ? (
    <LinkButton {...props} />
  ) : (
    <ActionButton {...props} />
  );

import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={["btn", `btn--${variant}`, `btn--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="btn__spinner" aria-hidden /> : leftIcon}
      <span className="btn__label">{children}</span>
      {rightIcon}
    </button>
  );
}

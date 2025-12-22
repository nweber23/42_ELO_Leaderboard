import type { HTMLAttributes, ReactNode } from "react";
import "./card.css";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["card", className].filter(Boolean).join(" ")} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["card__header", className].filter(Boolean).join(" ")} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={["card__title", className].filter(Boolean).join(" ")} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["card__description", className].filter(Boolean).join(" ")} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["card__content", className].filter(Boolean).join(" ")} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["card__footer", className].filter(Boolean).join(" ")} {...props} />;
}

export function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
      {hint ? <div className="metric__hint">{hint}</div> : null}
    </div>
  );
}

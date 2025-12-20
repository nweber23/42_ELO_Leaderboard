import type { ReactNode } from "react";
import "./page.css";

export function Page({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">{title}</h1>
          {subtitle ? <div className="page__subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="page__actions">{actions}</div> : null}
      </div>
      <div className="page__body">{children}</div>
    </div>
  );
}

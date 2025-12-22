import { useEffect } from "react";
import "./toast.css";

export type ToastTone = "info" | "success" | "error";

export function Toast({
  open,
  title,
  message,
  tone = "info",
  onClose,
  autoHideMs = 2600,
}: {
  open: boolean;
  title: string;
  message?: string;
  tone?: ToastTone;
  onClose: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onClose(), autoHideMs);
    return () => window.clearTimeout(t);
  }, [open, onClose, autoHideMs]);

  if (!open) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <div className={["toast__dot", `toast__dot--${tone}`].join(" ")} aria-hidden />
      <div className="toast__body">
        <div className="toast__title">{title}</div>
        {message ? <div className="toast__msg">{message}</div> : null}
      </div>
      <button className="toast__close" onClick={onClose} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
}

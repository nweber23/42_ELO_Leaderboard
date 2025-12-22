import { forwardRef } from "react";
import "./field.css";

export const Field = ({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) => {
  return (
    <div className="field">
      <div className="field__top">
        <label className="field__label">{label}</label>
        {hint ? <span className="field__hint">{hint}</span> : null}
      </div>
      {children}
      {error ? <div className="field__error">{error}</div> : null}
    </div>
  );
};

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={["input", className].filter(Boolean).join(" ")} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref
) {
  return <select ref={ref} className={["select", className].filter(Boolean).join(" ")} {...props} />;
});

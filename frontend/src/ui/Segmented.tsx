import { NavLink } from "react-router-dom";
import "./segmented.css";

export function SegmentedNav({
  items,
  ariaLabel,
}: {
  ariaLabel: string;
  items: Array<{ to: string; label: string }>;
}) {
  return (
    <div className="seg" role="navigation" aria-label={ariaLabel}>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) => (isActive ? "seg__item seg__item--active" : "seg__item")}
        >
          {it.label}
        </NavLink>
      ))}
    </div>
  );
}

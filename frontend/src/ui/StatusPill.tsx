import "./status-pill.css";

export function StatusPill({ tone, children }: { tone: "pending" | "confirmed" | "denied" | "cancelled"; children: string }) {
  return (
    <span className={["pill", `pill--${tone}`].join(" ")}> {children} </span>
  );
}

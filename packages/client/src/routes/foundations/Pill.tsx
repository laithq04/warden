import type { CSSProperties } from "react";
import { severity, type Severity } from "../../design-system/tokens";

export function SeverityPill({ sev, pulse = false }: { sev: Severity; pulse?: boolean }) {
  const s = severity[sev];
  return (
    <span
      className="pill"
      style={{ "--pill-hue": s.base, "--pill-ink": s.bright } as CSSProperties}
    >
      <span
        aria-hidden
        className={`pill-dot ${pulse && sev === "critical" ? "animate-pulse-critical" : ""}`}
      />
      {s.label}
    </span>
  );
}

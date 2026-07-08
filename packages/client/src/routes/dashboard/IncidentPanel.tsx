import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, ease, severity as severityTokens } from "../../design-system/tokens";
import { SeverityPill } from "../foundations/Pill";
import type { Incident } from "../../lib/types";

function IncidentRow({ inc }: { inc: Incident }) {
  const reduced = useReducedMotion();
  const s = severityTokens[inc.severity];
  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={{ duration: duration.base, ease: ease.settle }}
      className="overflow-hidden border-b border-line last:border-b-0"
      style={{ boxShadow: `inset 2px 0 0 ${s.base}` } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <SeverityPill sev={inc.severity} pulse={inc.status === "open"} />
          <span className="font-mono text-data text-ink">{inc.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tag">{inc.stageCount} stage{inc.stageCount === 1 ? "" : "s"}</span>
          <span className="tag">{inc.alertIds.length} alert{inc.alertIds.length === 1 ? "" : "s"}</span>
          <span className={`tag ${inc.status === "open" ? "text-sev-critical" : ""}`}>
            {inc.status}
          </span>
        </div>
      </div>
    </motion.li>
  );
}

export function IncidentPanel({ incidents }: { incidents: Incident[] }) {
  return (
    <ul className="card overflow-hidden">
      {incidents.length === 0 ? (
        <li className="px-4 py-6 text-center font-mono text-caption text-ink-muted">
          No correlated incidents yet.
        </li>
      ) : (
        <AnimatePresence initial={false}>
          {incidents.map((inc) => (
            <IncidentRow key={inc.id} inc={inc} />
          ))}
        </AnimatePresence>
      )}
    </ul>
  );
}

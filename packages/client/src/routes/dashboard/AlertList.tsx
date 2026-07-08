import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, ease, severity as severityTokens } from "../../design-system/tokens";
import { SeverityPill } from "../foundations/Pill";
import type { Alert } from "../../lib/types";

const utcTime = (iso: string) => iso.slice(11, 19);

function AlertCard({ a }: { a: Alert }) {
  const reduced = useReducedMotion();
  const s = severityTokens[a.severity];
  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: duration.base, ease: ease.settle }}
      className="card relative overflow-hidden p-0"
      style={
        {
          "--sev": s.base,
          "--sev-edge": `color-mix(in srgb, ${s.base} 35%, var(--color-line))`,
        } as CSSProperties
      }
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 bg-(--sev)"
      />
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <SeverityPill sev={a.severity} pulse />
        <span className="font-mono text-caption text-ink-muted">{utcTime(a.lastSeen)}</span>
      </div>
      <div className="px-5 pt-3 pb-4">
        <h3 className="text-title font-semibold text-ink">{a.title}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-[auto_auto_auto] sm:justify-start">
          <div>
            <dt className="label-micro">Host</dt>
            <dd className="mt-0.5 font-mono text-data text-ink-secondary">{a.host ?? "—"}</dd>
          </div>
          <div>
            <dt className="label-micro">User</dt>
            <dd className="mt-0.5 font-mono text-data text-ink-secondary">{a.user ?? "—"}</dd>
          </div>
          {a.count > 1 ? (
            <div>
              <dt className="label-micro">Count</dt>
              <dd className="mt-0.5 font-mono text-data text-ink-secondary">{a.count}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-5 py-3">
        <span className="tag">{a.mitre.techniqueId}</span>
        <span className="tag">{a.ruleId}</span>
      </div>
    </motion.li>
  );
}

export function AlertList({ alerts }: { alerts: Alert[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {alerts.length === 0 ? (
        <li className="card px-5 py-6 text-center font-mono text-caption text-ink-muted md:col-span-2">
          No alerts yet.
        </li>
      ) : (
        <AnimatePresence initial={false}>
          {alerts.map((a) => (
            <AlertCard key={a.id} a={a} />
          ))}
        </AnimatePresence>
      )}
    </ul>
  );
}

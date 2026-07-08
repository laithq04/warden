import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Section } from "./Section";
import { SeverityPill } from "./Pill";
import { duration, ease, severity, type Severity } from "../../design-system/tokens";

function AlertCard({
  sev,
  title,
  host,
  user,
  time,
  mitre,
  source,
}: {
  sev: Severity;
  title: string;
  host: string;
  user: string;
  time: string;
  mitre: string;
  source: string;
}) {
  const reduced = useReducedMotion();
  const s = severity[sev];
  return (
    <motion.button
      type="button"
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: duration.fast, ease: ease.snap }}
      className="group card relative w-full overflow-hidden p-0 text-left"
      style={
        {
          "--sev": s.base,
          "--sev-edge": `color-mix(in srgb, ${s.base} 35%, var(--color-line))`,
        } as CSSProperties
      }
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 bg-(--sev) transition-all duration-(--duration-fast) ease-(--ease-snap) group-hover:w-1 group-hover:shadow-[0_0_18px_0_var(--sev)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-card border border-transparent transition-colors duration-(--duration-fast) group-hover:border-(--sev-edge)"
      />
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <SeverityPill sev={sev} pulse />
        <span className="font-mono text-caption text-ink-muted">{time}</span>
      </div>
      <div className="px-5 pt-3 pb-4">
        <h3 className="text-title font-semibold text-ink">{title}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-[auto_auto] sm:justify-start">
          <div>
            <dt className="label-micro">Host</dt>
            <dd className="mt-0.5 font-mono text-data text-ink-secondary">{host}</dd>
          </div>
          <div>
            <dt className="label-micro">User</dt>
            <dd className="mt-0.5 font-mono text-data text-ink-secondary">{user}</dd>
          </div>
        </dl>
      </div>
      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="tag">{mitre}</span>
          <span className="tag">{source}</span>
        </div>
        <span className="font-mono text-micro tracking-[0.08em] text-ink-muted uppercase opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100">
          Open triage →
        </span>
      </div>
    </motion.button>
  );
}

export function AlertSection() {
  return (
    <Section
      id="alert"
      index="06"
      title="Alert card"
      note="The triage unit. Severity lives in the left spine; on hover the card lifts 2px, the spine widens and casts, and the frame warms toward the severity hue. Everything else stays still."
    >
      <div className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        <AlertCard
          sev="critical"
          title="LSASS memory read by unsigned binary"
          host="SRV-DC-01"
          user="svc-backup"
          time="14:32:07 UTC"
          mitre="T1003.001"
          source="edr"
        />
        <AlertCard
          sev="medium"
          title="Encoded PowerShell command executed"
          host="WKS-0142"
          user="r.alvarez"
          time="14:29:51 UTC"
          mitre="T1059.001"
          source="edr"
        />
      </div>
    </Section>
  );
}

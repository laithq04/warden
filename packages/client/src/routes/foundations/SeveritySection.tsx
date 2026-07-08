import type { CSSProperties } from "react";
import { Section } from "./Section";
import { SeverityPill } from "./Pill";
import { color, contrastRatio, severities, severity } from "../../design-system/tokens";

const meaning: Record<string, string> = {
  info: "Context. Recorded, not raised.",
  low: "Worth a look when the queue is quiet.",
  medium: "Triage this shift.",
  high: "Triage now.",
  critical: "Drop everything.",
};

export function SeveritySection() {
  return (
    <Section
      id="severity"
      index="02"
      title="Severity"
      note="The one scale the whole console hangs on. Hue spacing is wide enough to scan peripherally; color intensity is rationed — only critical earns motion and glow."
    >
      <div className="card overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[88px_96px_1fr_140px_120px_100px] items-center gap-4 border-b border-line px-5 py-3">
            {["level", "badge", "meaning", "as text", "as border", "contrast"].map((h) => (
              <span key={h} className="label-micro">
                {h}
              </span>
            ))}
          </div>
          {severities.map((sev) => {
            const s = severity[sev];
            return (
              <div
                key={sev}
                className="grid grid-cols-[88px_96px_1fr_140px_120px_100px] items-center gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-8 w-2 rounded-tick"
                    style={{ backgroundColor: s.base }}
                    aria-hidden
                  />
                  <span className="font-mono text-caption text-ink">{sev}</span>
                </div>
                <div>
                  <SeverityPill sev={sev} pulse />
                </div>
                <p className="text-body text-ink-secondary">{meaning[sev]}</p>
                <span className="font-mono text-data" style={{ color: s.base }}>
                  {s.base}
                </span>
                <span
                  className="rounded-tick border px-2 py-1.5 font-mono text-micro"
                  style={
                    {
                      borderColor: `color-mix(in srgb, ${s.base} 45%, transparent)`,
                      color: s.bright,
                      boxShadow: `0 0 14px -6px ${s.base}`,
                    } as CSSProperties
                  }
                >
                  edge + glow
                </span>
                <span className="font-mono text-micro text-ink-muted">
                  {contrastRatio(s.base, color.void).toFixed(2)}:1 vs void
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-caption text-ink-muted">
        Severity color never appears without its label. Every badge pairs hue with text so the
        scale survives color-vision deficiency; the critical dot pulses twice per period as a
        secondary, non-color signal.
      </p>
    </Section>
  );
}

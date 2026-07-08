import { Section } from "./Section";

const steps = [
  {
    name: "mast",
    spec: "chivo mono · 44/1.05 · 600 · -0.02em",
    className: "font-mono text-mast font-semibold text-ink",
    sample: "WARDEN",
  },
  {
    name: "display",
    spec: "chivo mono · 33/1.15 · 500 · -0.01em",
    className: "font-mono text-display font-medium text-ink",
    sample: "14 open alerts",
  },
  {
    name: "headline",
    spec: "atkinson next · 25/1.25 · 650",
    className: "font-body text-headline font-[650] text-ink",
    sample: "Lateral movement detected on segment 10.4",
  },
  {
    name: "title",
    spec: "atkinson next · 19/1.35 · 600",
    className: "font-body text-title font-semibold text-ink",
    sample: "Credential dumping via LSASS memory access",
  },
  {
    name: "body-lg",
    spec: "atkinson next · 16/1.6 · 400",
    className: "font-body text-body-lg text-ink-secondary",
    sample:
      "The process accessed lsass.exe memory with rights not seen for this host in the last 30 days. Two related detections fired within the same minute.",
  },
  {
    name: "body",
    spec: "atkinson next · 14/1.6 · 400",
    className: "font-body text-body text-ink-secondary",
    sample:
      "Default reading size for triage notes, descriptions, and anything an analyst reads as prose rather than scans as data.",
  },
  {
    name: "data",
    spec: "chivo mono · 13/1.55 · 400",
    className: "font-mono text-data text-ink",
    sample: "proc=rundll32.exe pid=4812 parent=wmiprvse.exe hash=9f2c…b41a",
  },
  {
    name: "caption",
    spec: "chivo mono · 12/1.5 · 400",
    className: "font-mono text-caption text-ink-muted",
    sample: "2026-07-08 14:32:07 UTC · sensor edr-eu-2",
  },
  {
    name: "micro",
    spec: "chivo mono · 11/1.45 · 500 · +0.08em · caps",
    className: "label-micro",
    sample: "Destination host",
  },
];

export function TypeSection() {
  return (
    <Section
      id="type"
      index="00"
      title="Type"
      note="Chivo Mono carries identity and data. Atkinson Hyperlegible Next carries prose — drawn for character disambiguation, chosen for hour eight of a shift."
    >
      <div className="flex flex-col">
        {steps.map((s) => (
          <div
            key={s.name}
            className="grid grid-cols-1 gap-2 border-b border-line py-5 last:border-b-0 md:grid-cols-[220px_1fr] md:gap-8"
          >
            <div className="flex flex-col gap-1 pt-1">
              <span className="font-mono text-caption text-trace-dim">{s.name}</span>
              <span className="font-mono text-micro text-ink-muted">{s.spec}</span>
            </div>
            <p className={s.className}>{s.sample}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

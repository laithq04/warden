import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TypeSection } from "./TypeSection";
import { ColorSection } from "./ColorSection";
import { SeveritySection } from "./SeveritySection";
import { ControlsSection } from "./ControlsSection";
import { SurfacesSection } from "./SurfacesSection";
import { LiveFeedSection } from "./LiveFeedSection";
import { AlertSection } from "./AlertSection";
import { MotionSection } from "./MotionSection";

const sections = [
  { id: "type", label: "00 Type" },
  { id: "color", label: "01 Color" },
  { id: "severity", label: "02 Severity" },
  { id: "controls", label: "03 Controls" },
  { id: "surfaces", label: "04 Cards & badges" },
  { id: "feed", label: "05 Live feed" },
  { id: "alert", label: "06 Alert card" },
  { id: "motion", label: "07 Motion" },
];

const utcNow = () => new Date().toISOString().slice(0, 19).replace("T", " ") + "Z";

function UtcClock() {
  const [now, setNow] = useState(utcNow);
  useEffect(() => {
    const t = setInterval(() => setNow(utcNow()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <time className="font-mono text-caption text-ink-muted tabular-nums" dateTime={now}>
      {now}
    </time>
  );
}

export default function Foundations() {
  return (
    <div className="min-h-screen bg-void">
      <a
        href="#type"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded-ctrl focus:bg-panel focus:px-3 focus:py-2 focus:font-mono focus:text-caption focus:text-ink"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-line bg-void/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-6 py-3">
          <div className="flex items-baseline gap-4">
            <Link
              to="/"
              className="font-mono text-body-lg font-semibold tracking-[0.06em] text-ink transition-colors duration-(--duration-fast) hover:text-trace-dim"
            >
              WARDEN
            </Link>
            <span className="label-micro hidden sm:inline">Design foundations</span>
          </div>
          <UtcClock />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <div className="pt-20 pb-16">
          <p className="label-micro text-trace-dim">Point of view</p>
          <h1 className="mt-4 max-w-3xl font-mono text-mast font-semibold text-ink">
            Nocturnal. Calibrated. Terse. Escalatory.
          </h1>
          <p className="mt-6 max-w-2xl text-body-lg text-ink-secondary">
            Warden is a console someone stares at for eight hours in a dim room. The surface
            stays dark and quiet; light is rationed and always means something. Data is set in a
            mono ledger, labels are stamped in caps, and the only thing allowed to raise its
            voice — in color, in glow, in motion — is severity.
          </p>
          <nav aria-label="Sections" className="mt-10 flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="tag transition-colors duration-(--duration-fast) hover:border-trace-dim hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        <TypeSection />
        <ColorSection />
        <SeveritySection />
        <ControlsSection />
        <SurfacesSection />
        <LiveFeedSection />
        <AlertSection />
        <MotionSection />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto px-6 py-6">
          <span className="font-mono text-micro text-ink-muted">
            warden / foundations · tokens are the contract
          </span>
        </div>
      </footer>
    </div>
  );
}

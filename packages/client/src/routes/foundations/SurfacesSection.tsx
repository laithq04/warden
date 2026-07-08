import { Section, SpecLabel } from "./Section";
import { SeverityPill } from "./Pill";
import { severities } from "../../design-system/tokens";

export function SurfacesSection() {
  return (
    <Section
      id="surfaces"
      index="04"
      title="Cards & badges"
      note="Elevation is layered surface + hairline + a whisper of inner light at the top edge. No drop-shadow theater: on a dark console, depth is told by borders, and glow is reserved for meaning."
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <SpecLabel>Base card</SpecLabel>
          <div className="card mt-3 max-w-md">
            <header className="flex items-center justify-between border-b border-line px-5 py-3">
              <h3 className="label-micro text-ink-secondary">Sensor coverage</h3>
              <span className="font-mono text-micro text-ink-muted">updated 14:32 UTC</span>
            </header>
            <div className="px-5 py-4">
              <p className="text-body text-ink-secondary">
                Panel surface over void, 1px line border, 6px radius. Header carries a micro
                label and a timestamp — every panel in Warden says what it is and how fresh it
                is.
              </p>
            </div>
            <footer className="flex items-center gap-2 border-t border-line px-5 py-3">
              <button type="button" className="btn btn-ghost">
                Details
              </button>
              <button type="button" className="btn btn-secondary">
                Refresh
              </button>
            </footer>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <SpecLabel>Severity pills</SpecLabel>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {severities.map((s) => (
                <SeverityPill key={s} sev={s} pulse />
              ))}
            </div>
            <p className="mt-3 max-w-md text-micro text-ink-muted">
              2px corners, mono caps, tinted field at 15% over panel. Squared on purpose — these
              are stamps in a ledger, not lozenges.
            </p>
          </div>
          <div>
            <SpecLabel>Neutral tags</SpecLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="tag">T1059.001</span>
              <span className="tag">T1003.001</span>
              <span className="tag">edr</span>
              <span className="tag">dns</span>
              <span className="tag">WKS-0142</span>
              <span className="tag">r.alvarez</span>
            </div>
            <p className="mt-3 max-w-md text-micro text-ink-muted">
              MITRE techniques, sources, hosts, and users share one quiet tag shape — severity is
              the only taxonomy that gets color.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

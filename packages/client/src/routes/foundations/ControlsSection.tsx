import { useState } from "react";
import { Select } from "radix-ui";
import { Section, SpecLabel } from "./Section";

function ButtonRow({
  label,
  className,
  note,
}: {
  label: string;
  className: string;
  note: string;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line py-4 last:border-b-0 md:grid-cols-[140px_1fr_auto] md:gap-8">
      <span className="font-mono text-caption text-trace-dim">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={`btn ${className}`}>
          {label === "destructive" ? "Isolate host" : label === "primary" ? "Acknowledge" : label === "secondary" ? "Assign to me" : "View raw event"}
        </button>
        <button
          type="button"
          className={`btn ${className}`}
          style={{ outline: "1px solid var(--color-trace)", outlineOffset: "2px" }}
        >
          focus-visible
        </button>
        <button type="button" className={`btn ${className}`} disabled>
          disabled
        </button>
      </div>
      <span className="max-w-xs text-micro text-ink-muted">{note}</span>
    </div>
  );
}

const sevOptions = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical only" },
  { value: "high-up", label: "High and above" },
  { value: "medium-up", label: "Medium and above" },
];

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function ControlsSection() {
  const [sevFilter, setSevFilter] = useState("all");
  return (
    <Section
      id="controls"
      index="03"
      title="Controls"
      note="Control labels are set in mono caps — commands, not sentences. Tab through this section: focus is a 1px trace outline offset 2px, never the browser default, never removed."
    >
      <div className="flex flex-col gap-12">
        <div>
          <SpecLabel>Buttons</SpecLabel>
          <div className="mt-2 flex flex-col">
            <ButtonRow
              label="primary"
              className="btn-primary"
              note="One per view. The single action the console is asking for."
            />
            <ButtonRow
              label="secondary"
              className="btn-secondary"
              note="Outlined. Routine actions that shouldn't shout."
            />
            <ButtonRow
              label="ghost"
              className="btn-ghost"
              note="Inline and table-row actions. Present, not visible until needed."
            />
            <ButtonRow
              label="destructive"
              className="btn-destructive"
              note="Armed, not fired: critical-tinted outline at rest, fills on hover."
            />
          </div>
        </div>

        <div>
          <SpecLabel>Inputs</SpecLabel>
          <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="label-micro" htmlFor="f-query">
                Hunt query
              </label>
              <input
                id="f-query"
                className="input"
                type="text"
                placeholder="host:WKS-* AND proc:powershell"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-micro" htmlFor="f-error">
                Time range
              </label>
              <input
                id="f-error"
                className="input"
                type="text"
                defaultValue="last 90 dayz"
                aria-invalid="true"
                aria-describedby="f-error-msg"
              />
              <p id="f-error-msg" className="font-mono text-micro text-sev-critical">
                Unrecognized unit — use m, h, or d
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-micro" htmlFor="f-disabled">
                Sensor
              </label>
              <input
                id="f-disabled"
                className="input"
                type="text"
                defaultValue="edr-eu-2 (locked by policy)"
                disabled
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-micro" htmlFor="f-sev">
                Severity filter
              </label>
              <Select.Root value={sevFilter} onValueChange={setSevFilter}>
                <Select.Trigger
                  id="f-sev"
                  className="input flex items-center justify-between gap-2 text-left"
                  aria-label="Severity filter"
                >
                  <Select.Value />
                  <Select.Icon className="text-ink-muted">
                    <ChevronDown />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    position="popper"
                    sideOffset={4}
                    className="z-10 min-w-(--radix-select-trigger-width) rounded-ctrl border border-line-strong bg-shelf py-1 shadow-lift"
                  >
                    <Select.Viewport>
                      {sevOptions.map((o) => (
                        <Select.Item
                          key={o.value}
                          value={o.value}
                          className="flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 font-mono text-data text-ink-secondary outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-trace)_10%,transparent)] data-highlighted:text-ink"
                        >
                          <Select.ItemText>{o.label}</Select.ItemText>
                          <Select.ItemIndicator className="font-mono text-micro text-trace">
                            ●
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

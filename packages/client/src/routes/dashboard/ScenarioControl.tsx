import { useState, type CSSProperties } from "react";
import { Select } from "radix-ui";
import type { ScenarioSummary } from "../../lib/types";

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function ScenarioControl({
  scenarios,
  running,
  onRun,
}: {
  scenarios: ScenarioSummary[];
  running: string | null;
  onRun: (name: string, speed: number) => Promise<void>;
}) {
  const [selected, setSelected] = useState(scenarios[0]?.name ?? "");
  const [speed, setSpeed] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  const activeName = selected || scenarios[0]?.name || "";
  const activeDescription = scenarios.find((s) => s.name === activeName)?.description;

  async function handleRun() {
    if (!activeName) return;
    setError(null);
    setLaunching(true);
    try {
      await onRun(activeName, speed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to start scenario");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="label-micro">Scenario replay</span>
        {running ? (
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span
                className="absolute inset-0 rounded-full animate-pulse-critical bg-trace-dim"
                style={{ "--pulse-color": "var(--color-trace-dim)" } as CSSProperties}
              />
            </span>
            <span className="font-mono text-caption text-trace-dim">running: {running}</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <label className="label-micro" htmlFor="scenario-select">
            Scenario
          </label>
          <Select.Root value={activeName} onValueChange={setSelected}>
            <Select.Trigger
              id="scenario-select"
              className="input flex items-center justify-between gap-2 text-left"
              aria-label="Scenario"
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
                  {scenarios.map((s) => (
                    <Select.Item
                      key={s.name}
                      value={s.name}
                      className="flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 font-mono text-data text-ink-secondary outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-trace)_10%,transparent)] data-highlighted:text-ink"
                    >
                      <Select.ItemText>{s.name}</Select.ItemText>
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

        <div className="flex w-full flex-col gap-2 sm:w-24">
          <label className="label-micro" htmlFor="scenario-speed">
            Speed ×
          </label>
          <input
            id="scenario-speed"
            className="input"
            type="number"
            min={0.1}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Math.max(0.1, Number(e.target.value) || 1))}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!!running || launching || !activeName}
          onClick={handleRun}
        >
          {launching ? "Starting…" : "Run scenario"}
        </button>
      </div>

      {activeDescription ? (
        <p className="mt-3 max-w-xl text-caption text-ink-muted">{activeDescription}</p>
      ) : null}
      {error ? <p className="mt-2 font-mono text-micro text-sev-critical">{error}</p> : null}
    </div>
  );
}

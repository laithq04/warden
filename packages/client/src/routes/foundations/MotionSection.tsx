import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Section, SpecLabel } from "./Section";
import { duration, ease } from "../../design-system/tokens";

const durations = [
  { name: "instant", ms: duration.instant, use: "hover ticks, pressed states" },
  { name: "fast", ms: duration.fast, use: "color, border, focus transitions" },
  { name: "base", ms: duration.base, use: "entrances, layout shifts" },
  { name: "slow", ms: duration.slow, use: "panels, route-level moves" },
  { name: "decay", ms: duration.decay, use: "arrival flash cooling off" },
];

const easings = [
  { name: "snap", curve: ease.snap, css: "cubic-bezier(0.3, 0, 0, 1)", use: "state changes — decisive, no bounce" },
  { name: "settle", curve: ease.settle, css: "cubic-bezier(0.22, 1, 0.36, 1)", use: "entrances — arrives fast, lands soft" },
  { name: "decay", curve: ease.decay, css: "cubic-bezier(0.05, 0.7, 0.1, 1)", use: "glow fade — burns bright, cools long" },
];

export function MotionSection() {
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();
  return (
    <Section
      id="motion"
      index="07"
      title="Motion"
      note="Motion energy is budgeted by severity: routine events barely move, critical ones earn the flash and the pulse. Under prefers-reduced-motion everything lands instantly."
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <SpecLabel>Durations</SpecLabel>
          <div className="mt-3 flex flex-col">
            {durations.map((d) => (
              <div
                key={d.name}
                className="grid grid-cols-[90px_64px_1fr] items-baseline gap-4 border-b border-line py-3 last:border-b-0"
              >
                <span className="font-mono text-caption text-trace-dim">{d.name}</span>
                <span className="font-mono text-data text-ink">{d.ms * 1000}ms</span>
                <span className="text-micro text-ink-muted">{d.use}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <SpecLabel>Easing curves</SpecLabel>
            <button type="button" className="btn btn-secondary" onClick={() => setRun((r) => r + 1)}>
              Replay
            </button>
          </div>
          <div className="mt-3 flex flex-col">
            {easings.map((e) => (
              <div
                key={e.name}
                className="grid grid-cols-[90px_1fr] items-center gap-4 border-b border-line py-3 last:border-b-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-caption text-trace-dim">{e.name}</span>
                  <span className="text-micro text-ink-muted">{e.use}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="relative h-4 rounded-tick border border-line bg-void">
                    <motion.span
                      key={run}
                      className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-trace"
                      initial={{ left: "4px" }}
                      animate={{ left: "calc(100% - 12px)" }}
                      transition={
                        reduced
                          ? { duration: 0.01 }
                          : { duration: 0.9, ease: e.curve, delay: 0.15 }
                      }
                    />
                  </div>
                  <span className="font-mono text-micro text-ink-muted">{e.css}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

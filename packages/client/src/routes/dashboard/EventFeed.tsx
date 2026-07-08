import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, ease } from "../../design-system/tokens";
import type { NormalizedEvent } from "../../lib/types";

const utcTime = (iso: string) => iso.slice(11, 19);

function EventRow({ e }: { e: NormalizedEvent }) {
  const reduced = useReducedMotion();
  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={
        reduced
          ? { duration: 0.01 }
          : {
              height: { duration: duration.base, ease: ease.settle },
              opacity: { duration: duration.base, ease: ease.settle },
              layout: { duration: duration.base, ease: ease.settle },
            }
      }
      className="overflow-hidden border-b border-line last:border-b-0"
    >
      <div className="grid grid-cols-[76px_1fr] items-center gap-x-4 px-4 py-2.5 sm:grid-cols-[76px_1fr_120px_64px]">
        <span className="font-mono text-caption text-ink-muted">{utcTime(e.timestamp)}</span>
        <span className="truncate font-mono text-data text-ink">{e.action}</span>
        <span className="hidden truncate font-mono text-caption text-ink-muted sm:block">
          {e.host ?? "—"}
        </span>
        <span className="tag hidden justify-self-start sm:inline-flex">{e.source}</span>
      </div>
    </motion.li>
  );
}

export function EventFeed({ events }: { events: NormalizedEvent[] }) {
  return (
    <ul className="card max-h-96 overflow-y-auto" aria-live="off">
      {events.length === 0 ? (
        <li className="px-4 py-6 text-center font-mono text-caption text-ink-muted">
          No events yet — run a scenario or send telemetry to /api/ingest.
        </li>
      ) : (
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </AnimatePresence>
      )}
    </ul>
  );
}

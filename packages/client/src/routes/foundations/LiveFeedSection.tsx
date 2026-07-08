import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Section } from "./Section";
import { SeverityPill } from "./Pill";
import { duration, ease, severity, type Severity } from "../../design-system/tokens";

type FeedEvent = {
  id: number;
  time: string;
  sev: Severity;
  msg: string;
  host: string;
  src: string;
};

const pool: Array<Omit<FeedEvent, "id" | "time">> = [
  { sev: "info", msg: "Scheduled task registered by SYSTEM", host: "SRV-DC-01", src: "edr" },
  { sev: "low", msg: "New external IP for known service account", host: "SRV-API-03", src: "auth" },
  { sev: "medium", msg: "Encoded PowerShell command executed", host: "WKS-0142", src: "edr" },
  { sev: "info", msg: "DNS query to newly registered domain", host: "WKS-0077", src: "dns" },
  { sev: "high", msg: "SMB lateral movement to 3 hosts in 40s", host: "WKS-0142", src: "ids" },
  { sev: "low", msg: "MFA fatigue pattern: 4 pushes denied", host: "l.okafor", src: "auth" },
  { sev: "critical", msg: "LSASS memory read by unsigned binary", host: "SRV-DC-01", src: "edr" },
  { sev: "medium", msg: "Archive tool staged in temp directory", host: "WKS-0203", src: "edr" },
  { sev: "info", msg: "Sensor heartbeat resumed after 90s gap", host: "edr-eu-2", src: "sys" },
  { sev: "high", msg: "Outbound transfer 2.1 GB to unseen ASN", host: "SRV-API-03", src: "net" },
];

const utcTime = () => new Date().toISOString().slice(11, 19);

function EventRow({ e }: { e: FeedEvent }) {
  const reduced = useReducedMotion();
  const s = severity[e.sev];
  const hot = e.sev === "high" || e.sev === "critical";
  const flash = `color-mix(in srgb, ${s.base} ${e.sev === "critical" ? 16 : 10}%, transparent)`;
  const clear = "rgba(0, 0, 0, 0)";
  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
      animate={{
        height: "auto",
        opacity: 1,
        backgroundColor: hot && !reduced ? [flash, clear] : clear,
      }}
      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={
        reduced
          ? { duration: 0.01 }
          : {
              height: { duration: duration.base, ease: ease.settle },
              opacity: { duration: duration.base, ease: ease.settle },
              backgroundColor: { duration: duration.decay, ease: ease.decay },
              layout: { duration: duration.base, ease: ease.settle },
            }
      }
      className="overflow-hidden border-b border-line last:border-b-0"
      style={{ boxShadow: `inset 2px 0 0 ${s.base}` }}
    >
      <div className="grid grid-cols-[76px_84px_1fr] items-center gap-x-4 px-4 py-2.5 sm:grid-cols-[76px_84px_1fr_92px_52px]">
        <span className="font-mono text-caption text-ink-muted">{e.time}</span>
        <SeverityPill sev={e.sev} pulse />
        <span className="truncate font-mono text-data text-ink">{e.msg}</span>
        <span className="hidden truncate font-mono text-caption text-ink-muted sm:block">
          {e.host}
        </span>
        <span className="tag hidden justify-self-start sm:inline-flex">{e.src}</span>
      </div>
    </motion.li>
  );
}

export function LiveFeedSection() {
  const [held, setHeld] = useState(false);
  const counter = useRef(0);
  const nextEvent = (): FeedEvent => {
    const i = counter.current++;
    const p = pool[i % pool.length]!;
    return { ...p, id: i, time: utcTime() };
  };
  const [events, setEvents] = useState<FeedEvent[]>(() =>
    Array.from({ length: 4 }, nextEvent).reverse(),
  );

  useEffect(() => {
    if (held) return;
    const t = setInterval(() => {
      setEvents((prev) => [nextEvent(), ...prev].slice(0, 6));
    }, 2400);
    return () => clearInterval(t);
  }, [held]);

  return (
    <Section
      id="feed"
      index="05"
      title="Live feed row"
      note="Arrival choreography: rows unfold from the top in 220ms on the settle curve. Info and low arrive silently; high and critical land with a severity-tinted flash that decays over 1.2s, like a trace cooling on a phosphor screen."
    >
      <div className="max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span
                className={`absolute inset-0 rounded-full ${held ? "bg-ink-disabled" : "animate-pulse-critical bg-trace-dim"}`}
                style={{ "--pulse-color": "var(--color-trace-dim)" } as CSSProperties}
              />
            </span>
            <span className="label-micro text-ink-secondary">
              {held ? "Feed held" : "Event stream · live"}
            </span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setHeld((h) => !h)}>
            {held ? "Resume feed" : "Hold feed"}
          </button>
        </div>
        <ul className="card overflow-hidden" aria-live="off">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </Section>
  );
}

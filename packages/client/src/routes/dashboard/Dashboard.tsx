import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../../lib/api";
import { useSocket, type SocketStatus } from "../../lib/useSocket";
import type { Alert, Incident, NormalizedEvent, ScenarioSummary, WsMessage } from "../../lib/types";
import { EventFeed } from "./EventFeed";
import { AlertList } from "./AlertList";
import { IncidentPanel } from "./IncidentPanel";
import { SeverityChart } from "./SeverityChart";
import { ScenarioControl } from "./ScenarioControl";

const FEED_CAP = 50;

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

function ConnectionDot({ status }: { status: SocketStatus }) {
  const label = status === "open" ? "Live" : status === "connecting" ? "Connecting" : "Offline";
  const color =
    status === "open" ? "bg-trace-dim" : status === "connecting" ? "bg-sev-medium" : "bg-sev-critical";
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden />
      <span className="font-mono text-caption text-ink-muted">{label}</span>
    </span>
  );
}

export default function Dashboard() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [initialEvents, initialAlerts, initialIncidents, scenarioState] = await Promise.all([
        api.getEvents(FEED_CAP),
        api.getAlerts(FEED_CAP),
        api.getIncidents(FEED_CAP),
        api.getScenarios(),
      ]);
      setEvents(initialEvents);
      setAlerts(initialAlerts);
      setIncidents(initialIncidents);
      setScenarios(scenarioState.scenarios);
      setRunning(scenarioState.running);
    })();
  }, []);

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "event") {
      setEvents((prev) => [msg.data, ...prev].slice(0, FEED_CAP));
    } else if (msg.type === "alert") {
      setAlerts((prev) =>
        prev.some((a) => a.id === msg.data.id) ? prev : [msg.data, ...prev].slice(0, FEED_CAP),
      );
    } else {
      setIncidents((prev) => {
        const next = prev.filter((i) => i.id !== msg.data.id);
        next.unshift(msg.data);
        return next.slice(0, FEED_CAP);
      });
    }
  }, []);

  const socketStatus = useSocket(handleMessage);

  async function handleRunScenario(name: string, speed: number) {
    await api.runScenario(name, speed);
    setRunning(name);
    const poll = setInterval(async () => {
      const state = await api.getScenarios();
      setRunning(state.running);
      if (!state.running) clearInterval(poll);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-10 border-b border-line bg-void/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-6 py-3">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-body-lg font-semibold tracking-[0.06em] text-ink">
              WARDEN
            </span>
            <span className="label-micro hidden sm:inline">SOC console</span>
            <Link
              to="/foundations"
              className="label-micro text-trace-dim transition-colors duration-(--duration-fast) hover:text-ink"
            >
              Foundations →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionDot status={socketStatus} />
            <UtcClock />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <ScenarioControl scenarios={scenarios} running={running} onRun={handleRunScenario} />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2" aria-labelledby="alerts-h">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="alerts-h" className="font-mono text-title font-medium text-ink uppercase tracking-[0.04em]">
                Alerts
              </h2>
              <span className="font-mono text-caption text-ink-muted">{alerts.length}</span>
            </div>
            <AlertList alerts={alerts} />
          </section>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="severity-h">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="severity-h" className="font-mono text-title font-medium text-ink uppercase tracking-[0.04em]">
                  Severity
                </h2>
              </div>
              <div className="card p-4">
                <SeverityChart alerts={alerts} />
              </div>
            </section>

            <section aria-labelledby="incidents-h">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="incidents-h" className="font-mono text-title font-medium text-ink uppercase tracking-[0.04em]">
                  Incidents
                </h2>
                <span className="font-mono text-caption text-ink-muted">{incidents.length}</span>
              </div>
              <IncidentPanel incidents={incidents} />
            </section>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="feed-h">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="feed-h" className="font-mono text-title font-medium text-ink uppercase tracking-[0.04em]">
              Live telemetry
            </h2>
            <span className="font-mono text-caption text-ink-muted">{events.length}</span>
          </div>
          <EventFeed events={events} />
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto px-6 py-6">
          <span className="font-mono text-micro text-ink-muted">
            warden / soc console
          </span>
        </div>
      </footer>
    </div>
  );
}

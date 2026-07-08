import { randomUUID } from "node:crypto";
import type { Alert } from "../rules/schema.js";
import { maxSeverity } from "../rules/schema.js";
import type { Incident } from "./schema.js";

export const DEFAULT_CORRELATION_WINDOW_SECONDS = 900;

interface AlertRef {
  id: string;
  ruleId: string;
  title: string;
  severity: Alert["severity"];
  timestamp: string;
  host: string | null;
  user: string | null;
}

interface TrackedIncident {
  incident: Incident;
  alerts: AlertRef[];
}

export interface CorrelationResult {
  incident: Incident;
  created: boolean;
}

function toRef(alert: Alert): AlertRef {
  return {
    id: alert.id,
    ruleId: alert.ruleId,
    title: alert.title,
    severity: alert.severity,
    timestamp: alert.timestamp,
    host: alert.host ?? null,
    user: alert.user ?? null,
  };
}

function sharesEntity(
  a: { host?: string | null; user?: string | null },
  b: { host?: string | null; user?: string | null },
): boolean {
  return (!!a.host && a.host === b.host) || (!!a.user && a.user === b.user);
}

// Groups alerts touching the same host or user within a sliding time window
// into a single Incident whose alertIds form the attack-chain timeline.
// Deliberately heuristic and explainable: same entity + temporal proximity,
// no scoring model.
export class Correlator {
  private standalone: AlertRef[] = [];
  private readonly tracked: TrackedIncident[] = [];

  constructor(
    private readonly windowSeconds = DEFAULT_CORRELATION_WINDOW_SECONDS,
  ) {}

  process(alert: Alert): CorrelationResult | null {
    const ref = toRef(alert);
    const ts = Date.parse(ref.timestamp);
    const windowMs = this.windowSeconds * 1000;

    for (let i = this.tracked.length - 1; i >= 0; i--) {
      const t = this.tracked[i]!;
      if (ts - Date.parse(t.incident.updatedAt) > windowMs) continue;
      if (!sharesEntity(t.incident, ref)) continue;
      this.attach(t, ref);
      return { incident: t.incident, created: false };
    }

    this.standalone = this.standalone.filter(
      (s) => ts - Date.parse(s.timestamp) <= windowMs,
    );
    const matchIdx = this.standalone.findIndex(
      (s) => s.id !== ref.id && sharesEntity(s, ref),
    );
    if (matchIdx !== -1) {
      const [seed] = this.standalone.splice(matchIdx, 1);
      const t = this.create(seed!, ref);
      this.tracked.push(t);
      return { incident: t.incident, created: true };
    }

    this.standalone.push(ref);
    return null;
  }

  private create(a: AlertRef, b: AlertRef): TrackedIncident {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: randomUUID(),
      title: "",
      severity: "info",
      status: "open",
      host: a.host ?? b.host ?? null,
      user: a.user ?? b.user ?? null,
      alertIds: [],
      stageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const t: TrackedIncident = { incident, alerts: [a] };
    this.recompute(t);
    this.attach(t, b);
    return t;
  }

  private attach(t: TrackedIncident, ref: AlertRef): void {
    t.alerts.push(ref);
    if (!t.incident.host && ref.host) t.incident.host = ref.host;
    if (!t.incident.user && ref.user) t.incident.user = ref.user;
    this.recompute(t);
    t.incident.updatedAt = new Date().toISOString();
  }

  private recompute(t: TrackedIncident): void {
    t.alerts.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    t.incident.alertIds = t.alerts.map((a) => a.id);
    t.incident.stageCount = new Set(t.alerts.map((a) => a.ruleId)).size;
    // Incident severity is the max of its alerts: one critical stage makes
    // the whole chain critical regardless of how many low-severity stages
    // surround it, which averaging would wrongly dilute.
    t.incident.severity = t.alerts.reduce(
      (acc, a) => maxSeverity(acc, a.severity),
      "info" as Alert["severity"],
    );
    const first = t.alerts[0]!;
    const last = t.alerts[t.alerts.length - 1]!;
    t.incident.title =
      first.ruleId === last.ruleId ? first.title : `${first.title} → ${last.title}`;
  }
}

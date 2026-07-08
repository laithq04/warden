import type { Alert } from "../rules/schema.js";
import type { Incident } from "../correlation/schema.js";
import type { NormalizedEvent } from "../schema/event.js";
import type { Scenario } from "./types.js";

export interface ReplayOptions {
  baseUrl: string;
  speed?: number;
  log?: (line: string) => void;
}

export interface ReplayResult {
  eventsSent: number;
  alerts: Alert[];
  incidentIds: string[];
}

interface IngestResponse {
  event: NormalizedEvent;
  alerts: Alert[];
  incidents: Incident[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertServerUp(baseUrl: string): Promise<void> {
  let healthy = false;
  try {
    const res = await fetch(`${baseUrl}/health`);
    healthy = res.ok;
  } catch {
    healthy = false;
  }
  if (!healthy) {
    throw new Error(
      `cannot reach the Warden server at ${baseUrl} — start it first with ` +
        `"npm run dev --workspace packages/server"`,
    );
  }
}

export async function replayScenario(
  scenario: Scenario,
  options: ReplayOptions,
): Promise<ReplayResult> {
  const speed = options.speed && options.speed > 0 ? options.speed : 1;
  const log = options.log ?? (() => {});
  await assertServerUp(options.baseUrl);

  const events = scenario.build(new Date());
  const alerts: Alert[] = [];
  const incidentIds = new Set<string>();

  for (const [i, item] of events.entries()) {
    if (i > 0) await sleep(item.delayMs / speed);
    const res = await fetch(`${options.baseUrl}/api/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parser: item.parser, event: item.event }),
    });
    if (!res.ok) {
      throw new Error(
        `ingest failed (${res.status}) on event ${i + 1}/${events.length}: ${await res.text()}`,
      );
    }
    const data = (await res.json()) as IngestResponse;

    const label = `[${String(i + 1).padStart(2, " ")}/${events.length}] ${item.parser} ${data.event.action}`;
    if (data.alerts.length === 0) {
      log(label);
    }
    for (const alert of data.alerts) {
      alerts.push(alert);
      log(`${label} -> ALERT ${alert.ruleId} "${alert.title}" (${alert.severity})`);
    }
    for (const incident of data.incidents) {
      incidentIds.add(incident.id);
      log(
        `        incident ${incident.id.slice(0, 8)} "${incident.title}" ` +
          `stages=${incident.stageCount} severity=${incident.severity}`,
      );
    }
  }

  return { eventsSent: events.length, alerts, incidentIds: [...incidentIds] };
}

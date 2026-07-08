import type { Alert, Incident, NormalizedEvent, RuleSummary, ScenariosResponse } from "./types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getEvents: (limit = 50) => getJson<NormalizedEvent[]>(`/api/events?limit=${limit}`),
  getAlerts: (limit = 50) => getJson<Alert[]>(`/api/alerts?limit=${limit}`),
  getIncidents: (limit = 50) => getJson<Incident[]>(`/api/incidents?limit=${limit}`),
  getRules: () => getJson<RuleSummary[]>("/api/rules"),
  getScenarios: () => getJson<ScenariosResponse>("/api/scenarios"),

  async runScenario(name: string, speed = 1) {
    const res = await fetch(`/api/simulate/${encodeURIComponent(name)}?speed=${speed}`, {
      method: "POST",
    });
    const body = (await res.json()) as { error?: string } & Record<string, unknown>;
    if (!res.ok) throw new Error(body.error ?? `simulate ${name} failed: ${res.status}`);
    return body;
  },
};

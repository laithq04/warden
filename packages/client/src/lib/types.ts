import type { Severity } from "../design-system/tokens";

export type { Severity };

export interface NormalizedEvent {
  id: string;
  timestamp: string;
  source: string;
  host?: string | null;
  user?: string | null;
  action: string;
  src_ip?: string | null;
  dest_ip?: string | null;
  dest_port?: number | null;
  process?: string | null;
  parent_process?: string | null;
  bytes_out?: number | null;
  outcome?: string | null;
  raw: unknown;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  severity: Severity;
  mitre: { tactic: string; techniqueId: string };
  description: string;
  timestamp: string;
  host?: string | null;
  user?: string | null;
  count: number;
  lastSeen: string;
  event: unknown;
}

export type IncidentStatus = "open" | "closed";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  host?: string | null;
  user?: string | null;
  alertIds: string[];
  stageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleSummary {
  id: string;
  title: string;
  severity: Severity;
  mitre: { tactic: string; techniqueId: string };
  description: string;
}

export interface ScenarioSummary {
  name: string;
  description: string;
}

export interface ScenariosResponse {
  running: string | null;
  scenarios: ScenarioSummary[];
}

export type WsMessage =
  | { type: "event"; data: NormalizedEvent }
  | { type: "alert"; data: Alert }
  | { type: "incident"; data: Incident };

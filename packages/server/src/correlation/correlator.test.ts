import { describe, expect, it } from "vitest";
import { Correlator } from "./correlator.js";
import type { Alert, Severity } from "../rules/schema.js";

let seq = 0;

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  const timestamp = overrides.timestamp ?? at(seq++);
  return {
    id: `alert-${seq}-${Math.random().toString(36).slice(2)}`,
    ruleId: "TEST-1",
    title: "Test Rule",
    severity: "medium" as Severity,
    mitre: { tactic: "Execution", techniqueId: "T1059" },
    description: "test",
    timestamp,
    host: "web-01",
    user: "admin",
    count: 1,
    lastSeen: timestamp,
    event: {},
    ...overrides,
  };
}

function at(seconds: number): string {
  return new Date(Date.parse("2026-07-08T12:00:00.000Z") + seconds * 1000).toISOString();
}

describe("Correlator", () => {
  it("leaves the first alert standalone, then creates an incident on the second", () => {
    const correlator = new Correlator(900);
    const a = makeAlert({ ruleId: "R-1", title: "Recon", severity: "low", timestamp: at(0) });
    const b = makeAlert({ ruleId: "R-2", title: "Privesc", severity: "high", timestamp: at(60) });

    expect(correlator.process(a)).toBeNull();
    const result = correlator.process(b);
    expect(result).not.toBeNull();
    expect(result!.created).toBe(true);
    expect(result!.incident.alertIds).toEqual([a.id, b.id]);
    expect(result!.incident.stageCount).toBe(2);
    expect(result!.incident.severity).toBe("high");
    expect(result!.incident.title).toBe("Recon → Privesc");
    expect(result!.incident.status).toBe("open");
    expect(result!.incident.host).toBe("web-01");
  });

  it("attaches later alerts to the existing incident and keeps the timeline ordered", () => {
    const correlator = new Correlator(900);
    const a = makeAlert({ ruleId: "R-1", title: "Bruteforce", severity: "medium", timestamp: at(0) });
    const b = makeAlert({ ruleId: "R-2", title: "Login", severity: "low", timestamp: at(120) });
    const c = makeAlert({ ruleId: "R-3", title: "Exfil", severity: "critical", timestamp: at(300) });

    correlator.process(a);
    const created = correlator.process(b)!;
    const attached = correlator.process(c);
    expect(attached).not.toBeNull();
    expect(attached!.created).toBe(false);
    expect(attached!.incident.id).toBe(created.incident.id);
    expect(attached!.incident.alertIds).toEqual([a.id, b.id, c.id]);
    expect(attached!.incident.stageCount).toBe(3);
    expect(attached!.incident.severity).toBe("critical");
    expect(attached!.incident.title).toBe("Bruteforce → Exfil");
  });

  it("correlates on shared user when hosts differ", () => {
    const correlator = new Correlator(900);
    correlator.process(makeAlert({ host: "web-01", user: "svc-backup", timestamp: at(0) }));
    const result = correlator.process(
      makeAlert({ ruleId: "R-2", host: "db-01", user: "svc-backup", timestamp: at(30) }),
    );
    expect(result).not.toBeNull();
    expect(result!.incident.user).toBe("svc-backup");
  });

  it("does not correlate alerts for unrelated entities", () => {
    const correlator = new Correlator(900);
    correlator.process(makeAlert({ host: "web-01", user: "alice", timestamp: at(0) }));
    expect(
      correlator.process(makeAlert({ host: "db-09", user: "bob", timestamp: at(10) })),
    ).toBeNull();
  });

  it("does not correlate across the time window", () => {
    const correlator = new Correlator(900);
    correlator.process(makeAlert({ timestamp: at(0) }));
    expect(correlator.process(makeAlert({ ruleId: "R-2", timestamp: at(1000) }))).toBeNull();
  });

  it("ignores null host/user rather than matching them against each other", () => {
    const correlator = new Correlator(900);
    correlator.process(makeAlert({ host: null, user: null, timestamp: at(0) }));
    expect(
      correlator.process(makeAlert({ ruleId: "R-2", host: null, user: null, timestamp: at(5) })),
    ).toBeNull();
  });
});

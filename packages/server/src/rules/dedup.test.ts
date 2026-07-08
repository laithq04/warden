import { describe, expect, it } from "vitest";
import { AlertDeduper } from "./dedup.js";
import type { Alert, Rule } from "./schema.js";

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "TEST-1",
    title: "Test Rule",
    severity: "medium",
    mitre: { tactic: "Execution", techniqueId: "T1059" },
    description: "test",
    detection: { condition: "selection", selection: { action: { equals: "x" } } },
    ...overrides,
  };
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  const timestamp = overrides.timestamp ?? "2026-07-08T12:00:00.000Z";
  return {
    id: `alert-${Math.random().toString(36).slice(2)}`,
    ruleId: "TEST-1",
    title: "Test Rule",
    severity: "medium",
    mitre: { tactic: "Execution", techniqueId: "T1059" },
    description: "test",
    timestamp,
    host: "web-01",
    user: "admin",
    count: 1,
    lastSeen: timestamp,
    event: { host: "web-01", user: "admin" },
    ...overrides,
  };
}

function at(seconds: number): string {
  return new Date(Date.parse("2026-07-08T12:00:00.000Z") + seconds * 1000).toISOString();
}

describe("AlertDeduper", () => {
  it("suppresses a repeat firing for the same rule/host/user and bumps count", () => {
    const deduper = new AlertDeduper([makeRule()]);
    const first = makeAlert();
    expect(deduper.process(first).status).toBe("new");

    const repeat = makeAlert({ timestamp: at(30), lastSeen: at(30) });
    const result = deduper.process(repeat);
    expect(result.status).toBe("duplicate");
    expect(first.count).toBe(2);
    expect(first.lastSeen).toBe(at(30));
  });

  it("treats a different host or user as a distinct alert", () => {
    const deduper = new AlertDeduper([makeRule()]);
    deduper.process(makeAlert());
    expect(deduper.process(makeAlert({ user: "bob" })).status).toBe("new");
    expect(deduper.process(makeAlert({ host: "web-02" })).status).toBe("new");
  });

  it("allows a new alert once the default cooldown has passed", () => {
    const deduper = new AlertDeduper([makeRule()]);
    deduper.process(makeAlert());
    expect(deduper.process(makeAlert({ timestamp: at(299), lastSeen: at(299) })).status).toBe(
      "duplicate",
    );
    expect(deduper.process(makeAlert({ timestamp: at(600), lastSeen: at(600) })).status).toBe(
      "new",
    );
  });

  it("honors a rule-specific dedup_seconds override with a rolling cooldown", () => {
    const deduper = new AlertDeduper([makeRule({ dedup_seconds: 10 })]);
    deduper.process(makeAlert());
    expect(deduper.process(makeAlert({ timestamp: at(5), lastSeen: at(5) })).status).toBe(
      "duplicate",
    );
    // The repeat at t=5 extended the cooldown, so t=11 is still suppressed.
    expect(deduper.process(makeAlert({ timestamp: at(11), lastSeen: at(11) })).status).toBe(
      "duplicate",
    );
    expect(deduper.process(makeAlert({ timestamp: at(22), lastSeen: at(22) })).status).toBe(
      "new",
    );
  });

  it("dedupes threshold rules on their group_by key instead of host/user", () => {
    const rule = makeRule({
      detection: {
        condition: "selection",
        selection: { action: { equals: "network_connection" } },
        threshold: { count: 5, group_by: "src_ip", window_seconds: 10 },
      },
    });
    const deduper = new AlertDeduper([rule]);
    deduper.process(makeAlert({ host: "web-01", event: { src_ip: "203.0.113.9" } }));
    const sameSource = deduper.process(
      makeAlert({ host: "web-02", user: null, event: { src_ip: "203.0.113.9" }, timestamp: at(5), lastSeen: at(5) }),
    );
    expect(sameSource.status).toBe("duplicate");
    const otherSource = deduper.process(
      makeAlert({ event: { src_ip: "198.51.100.4" }, timestamp: at(6), lastSeen: at(6) }),
    );
    expect(otherSource.status).toBe("new");
  });
});

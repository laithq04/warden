import { describe, expect, it } from "vitest";
import { RuleEngine } from "./engine.js";
import type { Rule } from "./schema.js";
import type { NormalizedEvent } from "../schema/event.js";

function makeEvent(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    id: "evt-1",
    timestamp: "2026-07-08T12:00:00.000Z",
    source: "test",
    action: "auth_failure",
    host: "web-01",
    user: "admin",
    src_ip: "203.0.113.7",
    dest_ip: null,
    dest_port: 22,
    process: null,
    bytes_out: null,
    outcome: "failure",
    raw: {},
    ...overrides,
  };
}

function makeRule(detection: Rule["detection"], id = "TEST-1"): Rule {
  return {
    id,
    title: "Test Rule",
    severity: "medium",
    mitre: { tactic: "Credential Access", techniqueId: "T1110" },
    description: "test",
    detection,
  };
}

describe("equals condition", () => {
  const engine = () =>
    new RuleEngine([
      makeRule({
        condition: "selection",
        selection: { action: { equals: "auth_failure" } },
      }),
    ]);

  it("fires when the field equals the value", () => {
    expect(engine().evaluate(makeEvent())).toHaveLength(1);
  });

  it("does not fire on a different value", () => {
    expect(engine().evaluate(makeEvent({ action: "auth_success" }))).toHaveLength(0);
  });
});

describe("contains condition", () => {
  const engine = () =>
    new RuleEngine([
      makeRule({
        condition: "selection",
        selection: { process: { contains: "-Enc" } },
      }),
    ]);

  it("fires on a substring match", () => {
    const event = makeEvent({ process: "powershell.exe -EncodedCommand abc" });
    expect(engine().evaluate(event)).toHaveLength(1);
  });

  it("does not fire without the substring or when the field is null", () => {
    expect(engine().evaluate(makeEvent({ process: "notepad.exe" }))).toHaveLength(0);
    expect(engine().evaluate(makeEvent({ process: null }))).toHaveLength(0);
  });
});

describe("regex condition", () => {
  const engine = () =>
    new RuleEngine([
      makeRule({
        condition: "selection",
        selection: { src_ip: { regex: "^203\\.0\\.113\\." } },
      }),
    ]);

  it("fires when the pattern matches", () => {
    expect(engine().evaluate(makeEvent({ src_ip: "203.0.113.99" }))).toHaveLength(1);
  });

  it("does not fire when the pattern does not match", () => {
    expect(engine().evaluate(makeEvent({ src_ip: "192.0.2.1" }))).toHaveLength(0);
  });
});

describe("composed conditions", () => {
  const rule = makeRule({
    condition: "sel_action and sel_process",
    sel_action: { action: { equals: "process_create" } },
    sel_process: { process: { contains: "powershell" } },
  });

  it("requires all AND-ed selections to match", () => {
    const engine = new RuleEngine([rule]);
    expect(
      engine.evaluate(makeEvent({ action: "process_create", process: "powershell.exe -Enc x" })),
    ).toHaveLength(1);
    expect(
      engine.evaluate(makeEvent({ action: "process_create", process: "cmd.exe" })),
    ).toHaveLength(0);
    expect(
      engine.evaluate(makeEvent({ action: "auth_failure", process: "powershell.exe" })),
    ).toHaveLength(0);
  });

  it("supports OR between selections", () => {
    const engine = new RuleEngine([
      makeRule({
        condition: "sel_a or sel_b",
        sel_a: { action: { equals: "auth_failure" } },
        sel_b: { action: { equals: "auth_success" } },
      }),
    ]);
    expect(engine.evaluate(makeEvent({ action: "auth_success" }))).toHaveLength(1);
    expect(engine.evaluate(makeEvent({ action: "process_create" }))).toHaveLength(0);
  });
});

describe("threshold condition", () => {
  const thresholdRule = makeRule({
    condition: "selection",
    selection: { action: { equals: "auth_failure" } },
    threshold: { count: 5, group_by: "user", window_seconds: 60 },
  });

  function eventAt(secondsOffset: number, user = "admin"): NormalizedEvent {
    return makeEvent({
      user,
      timestamp: new Date(Date.parse("2026-07-08T12:00:00.000Z") + secondsOffset * 1000).toISOString(),
    });
  }

  it("fires when N events for the same group arrive inside the window", () => {
    const engine = new RuleEngine([thresholdRule]);
    for (let i = 0; i < 4; i++) {
      expect(engine.evaluate(eventAt(i * 5))).toHaveLength(0);
    }
    const alerts = engine.evaluate(eventAt(20));
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.ruleId).toBe("TEST-1");
  });

  it("does not fire when events are spread beyond the window", () => {
    const engine = new RuleEngine([thresholdRule]);
    for (let i = 0; i < 10; i++) {
      expect(engine.evaluate(eventAt(i * 61))).toHaveLength(0);
    }
  });

  it("tracks groups independently", () => {
    const engine = new RuleEngine([thresholdRule]);
    for (let i = 0; i < 4; i++) {
      engine.evaluate(eventAt(i, "alice"));
      engine.evaluate(eventAt(i, "bob"));
    }
    expect(engine.evaluate(eventAt(10, "alice"))).toHaveLength(1);
    expect(engine.evaluate(eventAt(11, "carol"))).toHaveLength(0);
  });

  it("resets the group window after firing", () => {
    const engine = new RuleEngine([thresholdRule]);
    for (let i = 0; i < 4; i++) engine.evaluate(eventAt(i));
    expect(engine.evaluate(eventAt(4))).toHaveLength(1);
    expect(engine.evaluate(eventAt(5))).toHaveLength(0);
  });
});

describe("alert construction", () => {
  it("copies rule metadata and the matched event onto the alert", () => {
    const engine = new RuleEngine([
      makeRule({ condition: "selection", selection: { action: { equals: "auth_failure" } } }),
    ]);
    const event = makeEvent();
    const [alert] = engine.evaluate(event);
    expect(alert).toBeDefined();
    expect(alert!.ruleId).toBe("TEST-1");
    expect(alert!.severity).toBe("medium");
    expect(alert!.mitre).toEqual({ tactic: "Credential Access", techniqueId: "T1110" });
    expect(alert!.event).toEqual(event);
    expect(alert!.id).toBeTruthy();
  });
});

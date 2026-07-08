import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { loadRules } from "./loader.js";
import { RuleEngine } from "./engine.js";
import type { NormalizedEvent } from "../schema/event.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRulesDir = path.resolve(here, "..", "..", "..", "..", "rules");

function makeEvent(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    id: "evt-1",
    timestamp: "2026-07-08T12:00:00.000Z",
    source: "test",
    action: "process_create",
    host: "ws-042",
    user: "jdoe",
    src_ip: null,
    dest_ip: null,
    dest_port: null,
    process: null,
    parent_process: null,
    bytes_out: null,
    outcome: "success",
    raw: {},
    ...overrides,
  };
}

describe("repo detection rule set", () => {
  let engine: RuleEngine;
  const rules = loadRules(repoRulesDir);

  beforeEach(() => {
    engine = new RuleEngine(rules);
  });

  it("loads all 11 rules with unique ids and valid MITRE technique ids", () => {
    expect(rules).toHaveLength(11);
    expect(new Set(rules.map((r) => r.id)).size).toBe(11);
    for (const rule of rules) {
      expect(rule.mitre.techniqueId).toMatch(/^T\d{4}(\.\d{3})?$/);
    }
  });

  function firedRuleIds(event: NormalizedEvent): string[] {
    return engine.evaluate(event).map((a) => a.ruleId);
  }

  it("WARDEN-0001 fires on encoded PowerShell", () => {
    expect(
      firedRuleIds(makeEvent({ process: "powershell.exe -EncodedCommand SQBFAFgA" })),
    ).toContain("WARDEN-0001");
  });

  it("WARDEN-0002 fires after five failed auths for one user", () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      ids.push(
        ...firedRuleIds(
          makeEvent({
            action: "auth_failure",
            user: "svc-backup",
            outcome: "failure",
            timestamp: new Date(Date.parse("2026-07-08T12:00:00Z") + i * 1000).toISOString(),
          }),
        ),
      );
    }
    expect(ids).toContain("WARDEN-0002");
  });

  it("WARDEN-0003 fires on privileged login success but not for regular users", () => {
    expect(firedRuleIds(makeEvent({ action: "auth_success", user: "root" }))).toContain(
      "WARDEN-0003",
    );
    expect(firedRuleIds(makeEvent({ action: "auth_success", user: "deploy" }))).not.toContain(
      "WARDEN-0003",
    );
  });

  it("WARDEN-0004 fires on a connection burst from one source", () => {
    const ids: string[] = [];
    for (let i = 0; i < 15; i++) {
      ids.push(
        ...firedRuleIds(
          makeEvent({
            action: "network_connection",
            src_ip: "203.0.113.50",
            dest_port: 1000 + i,
            timestamp: new Date(Date.parse("2026-07-08T12:00:00Z") + i * 100).toISOString(),
          }),
        ),
      );
    }
    expect(ids).toContain("WARDEN-0004");
  });

  it("WARDEN-0005 fires when Word spawns PowerShell but not explorer", () => {
    expect(
      firedRuleIds(
        makeEvent({
          parent_process: "C:\\Program Files\\Microsoft Office\\WINWORD.EXE",
          process: "powershell.exe -nop -w hidden",
        }),
      ),
    ).toContain("WARDEN-0005");
    expect(
      firedRuleIds(
        makeEvent({
          parent_process: "C:\\Windows\\explorer.exe",
          process: "powershell.exe -nop",
        }),
      ),
    ).not.toContain("WARDEN-0005");
  });

  it("WARDEN-0006 fires when fodhelper spawns cmd", () => {
    expect(
      firedRuleIds(
        makeEvent({
          parent_process: "C:\\Windows\\System32\\fodhelper.exe",
          process: "cmd.exe /c whoami",
        }),
      ),
    ).toContain("WARDEN-0006");
  });

  it("WARDEN-0007 fires above 50MB outbound but not below", () => {
    expect(
      firedRuleIds(makeEvent({ action: "network_connection", bytes_out: 80_000_000 })),
    ).toContain("WARDEN-0007");
    expect(
      firedRuleIds(makeEvent({ action: "network_connection", bytes_out: 4_096 })),
    ).not.toContain("WARDEN-0007");
  });

  it("WARDEN-0008 fires on both service stop and tamper command", () => {
    expect(
      firedRuleIds(makeEvent({ action: "service_stop", process: "WinDefend" })),
    ).toContain("WARDEN-0008");
    expect(firedRuleIds(makeEvent({ process: "net stop windefend" }))).toContain("WARDEN-0008");
  });

  it("WARDEN-0009 fires on net user /add and useradd into sudo", () => {
    expect(firedRuleIds(makeEvent({ process: "net user backdoor P@ssw0rd1 /add" }))).toContain(
      "WARDEN-0009",
    );
    expect(
      firedRuleIds(makeEvent({ process: "useradd -m -G sudo shadowadmin" })),
    ).toContain("WARDEN-0009");
  });

  it("WARDEN-0010 fires on LSASS dump command lines", () => {
    expect(
      firedRuleIds(makeEvent({ process: "procdump.exe -ma lsass.exe c:\\temp\\out.dmp" })),
    ).toContain("WARDEN-0010");
  });

  it("WARDEN-0011 fires on scheduled task running a script", () => {
    expect(
      firedRuleIds(
        makeEvent({
          process: 'schtasks /create /tn Updater /tr "powershell -File C:\\u.ps1" /sc minute',
        }),
      ),
    ).toContain("WARDEN-0011");
  });

  it("stays quiet on benign process activity", () => {
    expect(firedRuleIds(makeEvent({ process: "C:\\Windows\\notepad.exe" }))).toHaveLength(0);
  });
});

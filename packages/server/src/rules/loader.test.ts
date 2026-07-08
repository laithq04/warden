import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadRules } from "./loader.js";
import { RuleEngine } from "./engine.js";
import { parseEdrProcess } from "../parsers/edr-process.js";
import { parseSyslogAuth } from "../parsers/syslog-auth.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRulesDir = path.resolve(here, "..", "..", "..", "..", "rules");

describe("YAML rule loader", () => {
  it("loads and validates the repo example rules", () => {
    const rules = loadRules(repoRulesDir);
    expect(rules.length).toBeGreaterThanOrEqual(2);

    const powershell = rules.find((r) => r.id === "WARDEN-0001");
    expect(powershell).toBeDefined();
    expect(powershell!.severity).toBe("high");
    expect(powershell!.mitre.techniqueId).toBe("T1059.001");
    expect(powershell!.detection.condition).toBe("selection and encoded_flag");

    const bruteForce = rules.find((r) => r.id === "WARDEN-0002");
    expect(bruteForce).toBeDefined();
    expect(bruteForce!.severity).toBe("medium");
    expect(bruteForce!.mitre.techniqueId).toBe("T1110");
    expect(bruteForce!.detection.threshold).toEqual({
      count: 5,
      group_by: "user",
      window_seconds: 60,
    });
  });

  it("loaded rules fire end-to-end against parsed events", () => {
    const engine = new RuleEngine(loadRules(repoRulesDir));

    const psEvent = parseEdrProcess({
      ts: "2026-07-08T15:00:00.000Z",
      hostname: "ws-042",
      image: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      commandLine: "powershell.exe -EncodedCommand SQBFAFgA",
      user: "CORP\\jdoe",
    });
    const psAlerts = engine.evaluate(psEvent!);
    expect(psAlerts.map((a) => a.ruleId)).toContain("WARDEN-0001");

    let bruteForceAlerts = 0;
    for (let i = 0; i < 5; i++) {
      const line = `Jul  8 14:22:0${i} bastion sshd[900${i}]: Failed password for invalid user root from 203.0.113.7 port 5140${i} ssh2`;
      const event = parseSyslogAuth(line);
      bruteForceAlerts += engine
        .evaluate(event!)
        .filter((a) => a.ruleId === "WARDEN-0002").length;
    }
    expect(bruteForceAlerts).toBe(1);
  });
});

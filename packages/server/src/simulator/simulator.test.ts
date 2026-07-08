import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getParser } from "../parsers/registry.js";
import { loadRules } from "../rules/loader.js";
import { RuleEngine } from "../rules/engine.js";
import { scenarios } from "./scenarios/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rules = loadRules(path.resolve(here, "..", "..", "..", "..", "rules"));

function firedRuleIds(name: string): string[] {
  const engine = new RuleEngine(rules);
  const ids: string[] = [];
  for (const item of scenarios[name]!.build(new Date())) {
    const parse = getParser(item.parser);
    expect(parse, `parser ${item.parser}`).not.toBeNull();
    const event = parse!(item.event);
    expect(event, `event failed to parse: ${JSON.stringify(item.event)}`).not.toBeNull();
    ids.push(...engine.evaluate(event!).map((a) => a.ruleId));
  }
  return ids;
}

describe("simulator scenarios", () => {
  it("every scenario event parses with its declared parser", () => {
    for (const scenario of Object.values(scenarios)) {
      for (const item of scenario.build(new Date())) {
        const event = getParser(item.parser)!(item.event);
        expect(event, `${scenario.name}: ${JSON.stringify(item.event)}`).not.toBeNull();
        expect(item.delayMs).toBeGreaterThan(0);
      }
    }
  });

  it("brute-force-then-exfil fires WARDEN-0002, 0003, 0007 in order", () => {
    expect([...new Set(firedRuleIds("brute-force-then-exfil"))]).toEqual([
      "WARDEN-0002",
      "WARDEN-0003",
      "WARDEN-0007",
    ]);
  });

  it("recon-to-privesc fires WARDEN-0004, 0005, 0006, 0009 in order", () => {
    expect([...new Set(firedRuleIds("recon-to-privesc"))]).toEqual([
      "WARDEN-0004",
      "WARDEN-0005",
      "WARDEN-0006",
      "WARDEN-0009",
    ]);
  });

  it("benign-baseline fires no rules at all", () => {
    expect(firedRuleIds("benign-baseline")).toEqual([]);
  });
});

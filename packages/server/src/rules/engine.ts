import { randomUUID } from "node:crypto";
import type { NormalizedEvent } from "../schema/event.js";
import type { Alert, FieldMatcher, Rule, Selection } from "./schema.js";

const regexCache = new Map<string, RegExp>();

function getRegex(pattern: string): RegExp {
  let re = regexCache.get(pattern);
  if (!re) {
    re = new RegExp(pattern);
    regexCache.set(pattern, re);
  }
  return re;
}

function matchField(event: NormalizedEvent, field: string, matcher: FieldMatcher): boolean {
  const value = (event as Record<string, unknown>)[field];
  if (value === undefined || value === null) return false;
  if (matcher.equals !== undefined && value !== matcher.equals) return false;
  const asString = typeof value === "string" ? value : String(value);
  if (matcher.contains !== undefined && !asString.includes(matcher.contains)) return false;
  if (matcher.regex !== undefined && !getRegex(matcher.regex).test(asString)) return false;
  if (matcher.gt !== undefined && !(typeof value === "number" && value > matcher.gt)) return false;
  return true;
}

function matchSelection(event: NormalizedEvent, selection: Selection): boolean {
  return Object.entries(selection).every(([field, matcher]) =>
    matchField(event, field, matcher),
  );
}

// Condition strings are Sigma-style selection names combined with "and"/"or",
// where "and" binds tighter than "or" (e.g. "sel1 and sel2 or sel3").
function matchCondition(event: NormalizedEvent, rule: Rule): boolean {
  const { condition, threshold: _threshold, ...selections } = rule.detection;
  return condition.split(/\s+or\s+/).some((group) =>
    group.split(/\s+and\s+/).every((name) => {
      const selection = selections[name.trim()];
      if (!selection) {
        throw new Error(
          `rule ${rule.id}: condition references unknown selection "${name.trim()}"`,
        );
      }
      return matchSelection(event, selection);
    }),
  );
}

type WindowState = Map<string, number[]>;

export class RuleEngine {
  private readonly rules: Rule[];
  private readonly windows = new Map<string, WindowState>();

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  evaluate(event: NormalizedEvent): Alert[] {
    const alerts: Alert[] = [];
    for (const rule of this.rules) {
      if (!matchCondition(event, rule)) continue;
      const threshold = rule.detection.threshold;
      if (threshold && !this.thresholdReached(rule, event)) continue;
      const timestamp = new Date().toISOString();
      alerts.push({
        id: randomUUID(),
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        mitre: rule.mitre,
        description: rule.description,
        timestamp,
        host: event.host ?? null,
        user: event.user ?? null,
        count: 1,
        lastSeen: timestamp,
        event,
      });
    }
    return alerts;
  }

  // Sliding count-over-window keyed by the group_by field value, using event
  // timestamps so replayed/test telemetry evaluates deterministically. The
  // group's window resets once it fires, so a sustained burst produces one
  // alert per threshold-crossing rather than one per event.
  private thresholdReached(rule: Rule, event: NormalizedEvent): boolean {
    const threshold = rule.detection.threshold!;
    const groupValue = (event as Record<string, unknown>)[threshold.group_by];
    if (groupValue === undefined || groupValue === null) return false;

    let state = this.windows.get(rule.id);
    if (!state) {
      state = new Map();
      this.windows.set(rule.id, state);
    }

    const key = String(groupValue);
    const eventMs = Date.parse(event.timestamp);
    const cutoff = eventMs - threshold.window_seconds * 1000;
    const timestamps = (state.get(key) ?? []).filter((ts) => ts > cutoff);
    timestamps.push(eventMs);

    if (timestamps.length >= threshold.count) {
      state.delete(key);
      return true;
    }
    state.set(key, timestamps);
    return false;
  }
}

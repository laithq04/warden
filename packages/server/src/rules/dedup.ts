import type { Alert, Rule } from "./schema.js";

export const DEFAULT_DEDUP_SECONDS = 300;

export type DedupResult =
  | { status: "new"; alert: Alert }
  | { status: "duplicate"; original: Alert };

// Suppresses repeat firings of the same rule against the same entity within a
// cooldown window. Instead of a duplicate alert, the original alert's count
// and lastSeen are bumped so persistence can reflect the recurrence.
export class AlertDeduper {
  private readonly rulesById = new Map<string, Rule>();
  private readonly recent = new Map<string, Alert>();

  constructor(
    rules: Rule[],
    private readonly defaultSeconds = DEFAULT_DEDUP_SECONDS,
  ) {
    for (const rule of rules) this.rulesById.set(rule.id, rule);
  }

  process(alert: Alert): DedupResult {
    const rule = this.rulesById.get(alert.ruleId);
    // Threshold rules already aggregate by group_by, so dedupe on that same
    // key; everything else dedupes on the host+user pair.
    const groupBy = rule?.detection.threshold?.group_by;
    const key = groupBy
      ? `${alert.ruleId}|${String((alert.event as Record<string, unknown>)[groupBy] ?? "")}`
      : `${alert.ruleId}|${alert.host ?? ""}|${alert.user ?? ""}`;

    const windowMs = (rule?.dedup_seconds ?? this.defaultSeconds) * 1000;
    const existing = this.recent.get(key);
    if (existing && Date.parse(alert.timestamp) - Date.parse(existing.lastSeen) < windowMs) {
      existing.count += 1;
      existing.lastSeen = alert.timestamp;
      return { status: "duplicate", original: existing };
    }

    this.recent.set(key, alert);
    return { status: "new", alert };
  }
}

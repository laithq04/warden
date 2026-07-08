import { z } from "zod";

export const severityLevels = ["info", "low", "medium", "high", "critical"] as const;
export type Severity = (typeof severityLevels)[number];

export const fieldMatcherSchema = z
  .object({
    equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
    contains: z.string().optional(),
    regex: z.string().optional(),
  })
  .strict()
  .refine(
    (m) => m.equals !== undefined || m.contains !== undefined || m.regex !== undefined,
    { message: "field matcher must specify equals, contains, or regex" },
  );

export type FieldMatcher = z.infer<typeof fieldMatcherSchema>;

export const selectionSchema = z.record(z.string(), fieldMatcherSchema);
export type Selection = z.infer<typeof selectionSchema>;

export const thresholdSchema = z.object({
  count: z.number().int().min(1),
  group_by: z.string().min(1),
  window_seconds: z.number().positive(),
});
export type Threshold = z.infer<typeof thresholdSchema>;

export const detectionSchema = z
  .object({
    condition: z.string().min(1),
    threshold: thresholdSchema.optional(),
  })
  .catchall(selectionSchema);
export type Detection = z.infer<typeof detectionSchema>;

export const ruleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: z.enum(severityLevels),
  mitre: z.object({
    tactic: z.string().min(1),
    techniqueId: z.string().regex(/^T\d{4}(\.\d{3})?$/),
  }),
  description: z.string().min(1),
  detection: detectionSchema,
});

export type Rule = z.infer<typeof ruleSchema>;

export const alertSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  severity: z.enum(severityLevels),
  mitre: z.object({ tactic: z.string(), techniqueId: z.string() }),
  description: z.string(),
  timestamp: z.iso.datetime({ offset: true }),
  event: z.unknown(),
});
export type Alert = z.infer<typeof alertSchema>;

import { z } from "zod";
import { severityLevels } from "../rules/schema.js";

export const incidentStatuses = ["open", "closed"] as const;

export const incidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(severityLevels),
  status: z.enum(incidentStatuses),
  host: z.string().nullish(),
  user: z.string().nullish(),
  alertIds: z.array(z.string()),
  stageCount: z.number().int().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type Incident = z.infer<typeof incidentSchema>;

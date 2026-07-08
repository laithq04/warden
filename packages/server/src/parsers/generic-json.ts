import { randomUUID } from "node:crypto";
import { z } from "zod";
import { normalizedEventSchema, type NormalizedEvent } from "../schema/event.js";
import type { Parser } from "./types.js";

const inputSchema = normalizedEventSchema.omit({ id: true, raw: true }).extend({
  id: z.string().min(1).optional(),
});

export const parseGenericJson: Parser = (raw): NormalizedEvent | null => {
  const result = inputSchema.safeParse(raw);
  if (!result.success) return null;
  return {
    ...result.data,
    id: result.data.id ?? randomUUID(),
    raw,
  };
};

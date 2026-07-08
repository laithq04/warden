import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { NormalizedEvent } from "../schema/event.js";
import type { Parser } from "./types.js";

// Parses a synthetic EDR process-execution payload used by Warden's test/demo
// telemetry. This is not any vendor's proprietary EDR wire format.
const edrInputSchema = z.object({
  ts: z.iso.datetime({ offset: true }),
  hostname: z.string().min(1),
  parentImage: z.string().nullish(),
  image: z.string().min(1),
  commandLine: z.string().nullish(),
  user: z.string().nullish(),
  sha256: z.string().nullish(),
});

export const parseEdrProcess: Parser = (raw): NormalizedEvent | null => {
  const result = edrInputSchema.safeParse(raw);
  if (!result.success) return null;
  const e = result.data;
  return {
    id: randomUUID(),
    timestamp: e.ts,
    source: "edr-process",
    host: e.hostname,
    user: e.user ?? null,
    action: "process_create",
    src_ip: null,
    dest_ip: null,
    dest_port: null,
    process: e.commandLine ?? e.image,
    parent_process: e.parentImage ?? null,
    bytes_out: null,
    outcome: "success",
    raw,
  };
};

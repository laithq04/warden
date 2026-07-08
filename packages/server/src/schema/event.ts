import { z } from "zod";

export const normalizedEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.iso.datetime({ offset: true }),
  source: z.string().min(1),
  host: z.string().nullish(),
  user: z.string().nullish(),
  action: z.string().min(1),
  src_ip: z.string().nullish(),
  dest_ip: z.string().nullish(),
  dest_port: z.number().int().min(0).max(65535).nullish(),
  process: z.string().nullish(),
  bytes_out: z.number().min(0).nullish(),
  outcome: z.string().nullish(),
  raw: z.unknown(),
});

export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;

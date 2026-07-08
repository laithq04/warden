import type { NormalizedEvent } from "../schema/event.js";

export type ParserName = "generic-json" | "syslog-auth" | "edr-process";

export type Parser = (raw: unknown) => NormalizedEvent | null;

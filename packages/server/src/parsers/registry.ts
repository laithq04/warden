import type { Parser, ParserName } from "./types.js";
import { parseGenericJson } from "./generic-json.js";
import { parseSyslogAuth } from "./syslog-auth.js";
import { parseEdrProcess } from "./edr-process.js";

const registry: Record<ParserName, Parser> = {
  "generic-json": parseGenericJson,
  "syslog-auth": parseSyslogAuth,
  "edr-process": parseEdrProcess,
};

export const parserNames = Object.keys(registry) as ParserName[];

export function getParser(name: string): Parser | null {
  return (registry as Record<string, Parser | undefined>)[name] ?? null;
}

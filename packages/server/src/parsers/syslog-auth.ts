import { randomUUID } from "node:crypto";
import type { NormalizedEvent } from "../schema/event.js";
import type { Parser } from "./types.js";

// Parses a synthetic syslog-style sshd auth line used by Warden's test/demo
// telemetry. This is not an ingestion path for any vendor's real log format.
// Example:
//   Jul  8 14:22:01 web-01 sshd[1234]: Failed password for invalid user admin from 203.0.113.7 port 51422 ssh2
const LINE_PATTERN =
  /^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+sshd\[\d+\]:\s+(Failed|Accepted)\s+password\s+for\s+(?:invalid\s+user\s+)?(\S+)\s+from\s+(\S+)\s+port\s+(\d+)/;

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export const parseSyslogAuth: Parser = (raw): NormalizedEvent | null => {
  if (typeof raw !== "string") return null;
  const match = LINE_PATTERN.exec(raw.trim());
  if (!match) return null;
  const [, mon, day, time, host, verdict, user, srcIp, port] = match;
  const month = MONTHS[mon!];
  if (month === undefined) return null;

  // Syslog timestamps carry no year; assume the current year (test format only).
  const [hh, mm, ss] = time!.split(":").map(Number);
  const timestamp = new Date(
    Date.UTC(new Date().getUTCFullYear(), month, Number(day), hh!, mm!, ss!),
  ).toISOString();

  const failed = verdict === "Failed";
  return {
    id: randomUUID(),
    timestamp,
    source: "syslog-auth",
    host,
    user,
    action: failed ? "auth_failure" : "auth_success",
    src_ip: srcIp,
    dest_ip: null,
    dest_port: Number(port),
    process: "sshd",
    bytes_out: null,
    outcome: failed ? "failure" : "success",
    raw,
  };
};

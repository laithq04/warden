import { describe, expect, it } from "vitest";
import { parseGenericJson } from "./generic-json.js";
import { parseSyslogAuth } from "./syslog-auth.js";
import { parseEdrProcess } from "./edr-process.js";
import { getParser, parserNames } from "./registry.js";

describe("generic-json parser", () => {
  it("passes through a valid normalized event and keeps raw", () => {
    const input = {
      id: "evt-1",
      timestamp: "2026-07-08T12:00:00.000Z",
      source: "firewall",
      action: "connection_blocked",
      src_ip: "10.0.0.5",
      dest_ip: "198.51.100.9",
      dest_port: 443,
      bytes_out: 1200,
    };
    const event = parseGenericJson(input);
    expect(event).not.toBeNull();
    expect(event!.id).toBe("evt-1");
    expect(event!.action).toBe("connection_blocked");
    expect(event!.dest_port).toBe(443);
    expect(event!.raw).toEqual(input);
  });

  it("generates an id when missing", () => {
    const event = parseGenericJson({
      timestamp: "2026-07-08T12:00:00.000Z",
      source: "app",
      action: "login",
    });
    expect(event).not.toBeNull();
    expect(event!.id).toBeTruthy();
  });

  it("returns null for input missing required fields", () => {
    expect(parseGenericJson({ source: "app" })).toBeNull();
    expect(parseGenericJson("not an object")).toBeNull();
    expect(parseGenericJson({ timestamp: "not-a-date", source: "a", action: "b" })).toBeNull();
  });
});

describe("syslog-auth parser", () => {
  const failedLine =
    "Jul  8 14:22:01 web-01 sshd[1234]: Failed password for invalid user admin from 203.0.113.7 port 51422 ssh2";
  const acceptedLine =
    "Jul  8 14:25:33 web-01 sshd[1240]: Accepted password for deploy from 192.0.2.44 port 51500 ssh2";

  it("parses a failed password line into auth_failure", () => {
    const event = parseSyslogAuth(failedLine);
    expect(event).not.toBeNull();
    expect(event!.action).toBe("auth_failure");
    expect(event!.outcome).toBe("failure");
    expect(event!.user).toBe("admin");
    expect(event!.host).toBe("web-01");
    expect(event!.src_ip).toBe("203.0.113.7");
    expect(event!.dest_port).toBe(51422);
    expect(event!.process).toBe("sshd");
    expect(event!.raw).toBe(failedLine);
    expect(event!.timestamp).toContain("-07-08T14:22:01");
  });

  it("parses an accepted password line into auth_success", () => {
    const event = parseSyslogAuth(acceptedLine);
    expect(event).not.toBeNull();
    expect(event!.action).toBe("auth_success");
    expect(event!.outcome).toBe("success");
    expect(event!.user).toBe("deploy");
  });

  it("returns null for non-matching input", () => {
    expect(parseSyslogAuth("this is not a syslog line")).toBeNull();
    expect(parseSyslogAuth({ not: "a string" })).toBeNull();
    expect(parseSyslogAuth("Jul 8 14:22:01 web-01 cron[99]: session opened")).toBeNull();
  });
});

describe("edr-process parser", () => {
  const input = {
    ts: "2026-07-08T15:00:00.000Z",
    hostname: "ws-042",
    parentImage: "C:\\Windows\\explorer.exe",
    image: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    commandLine: "powershell.exe -EncodedCommand SQBFAFgA",
    user: "CORP\\jdoe",
    sha256: "a".repeat(64),
  };

  it("parses a process telemetry payload into process_create", () => {
    const event = parseEdrProcess(input);
    expect(event).not.toBeNull();
    expect(event!.action).toBe("process_create");
    expect(event!.host).toBe("ws-042");
    expect(event!.user).toBe("CORP\\jdoe");
    expect(event!.process).toBe(input.commandLine);
    expect(event!.timestamp).toBe(input.ts);
    expect(event!.raw).toEqual(input);
  });

  it("falls back to image when commandLine is absent", () => {
    const event = parseEdrProcess({ ts: input.ts, hostname: "ws-042", image: input.image });
    expect(event).not.toBeNull();
    expect(event!.process).toBe(input.image);
  });

  it("returns null for invalid input", () => {
    expect(parseEdrProcess({ hostname: "ws-042" })).toBeNull();
    expect(parseEdrProcess("string")).toBeNull();
    expect(parseEdrProcess({ ...input, ts: "yesterday" })).toBeNull();
  });
});

describe("parser registry", () => {
  it("resolves all three parsers by name", () => {
    expect(parserNames.sort()).toEqual(["edr-process", "generic-json", "syslog-auth"]);
    for (const name of parserNames) {
      expect(getParser(name)).toBeTypeOf("function");
    }
  });

  it("returns null for unknown parser names", () => {
    expect(getParser("nonexistent")).toBeNull();
  });
});

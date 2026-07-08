// SYNTHETIC TEST DATA — every event in this file is fabricated demo telemetry
// representing routine, benign activity (plus a few deliberate near-misses
// below alert thresholds). It exists to prove Warden's defensive rules stay
// quiet on normal traffic; the hosts, users, and IPs are invented.
import type { Scenario, ScenarioEvent } from "../types.js";
import { at, sshLine } from "./util.js";

function edr(
  base: Date,
  offsetSeconds: number,
  hostname: string,
  user: string | null,
  parentImage: string,
  image: string,
  commandLine: string,
): unknown {
  return { ts: at(base, offsetSeconds), hostname, parentImage, image, commandLine, user };
}

export const benignBaseline: Scenario = {
  name: "benign-baseline",
  description:
    "Routine logins, browsing, database traffic, and a nightly backup, with near-misses (3 failed logins, a 34 MB transfer) that should raise no alerts",
  build(base) {
    const events: ScenarioEvent[] = [
      {
        parser: "syslog-auth",
        delayMs: 200,
        event: sshLine(base, 0, {
          host: "app-02", verdict: "Accepted", user: "alice.w", srcIp: "10.0.2.15", port: 50412,
        }),
      },
      {
        parser: "edr-process",
        delayMs: 250,
        event: edr(
          base, 4, "hr-ws-11", "b.osei",
          "C:\\Windows\\explorer.exe",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "chrome.exe --profile-directory=Default",
        ),
      },
      {
        parser: "syslog-auth",
        delayMs: 250,
        event: sshLine(base, 8, {
          host: "db-01", verdict: "Failed", user: "m.chen", srcIp: "10.0.3.9", port: 50920,
        }),
      },
      {
        parser: "syslog-auth",
        delayMs: 250,
        event: sshLine(base, 19, {
          host: "db-01", verdict: "Failed", user: "m.chen", srcIp: "10.0.3.9", port: 50921,
        }),
      },
      {
        parser: "syslog-auth",
        delayMs: 250,
        event: sshLine(base, 31, {
          host: "db-01", verdict: "Failed", user: "m.chen", srcIp: "10.0.3.9", port: 50922,
        }),
      },
      {
        parser: "syslog-auth",
        delayMs: 300,
        event: sshLine(base, 40, {
          host: "db-01", verdict: "Accepted", user: "m.chen", srcIp: "10.0.3.9", port: 50923,
        }),
      },
      {
        parser: "edr-process",
        delayMs: 250,
        event: edr(
          base, 46, "hr-ws-11", "b.osei",
          "C:\\Windows\\explorer.exe",
          "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
          "\"WINWORD.EXE\" /n \"C:\\Users\\b.osei\\Documents\\Q3-review.docx\"",
        ),
      },
      {
        parser: "edr-process",
        delayMs: 250,
        event: edr(
          base, 52, "hr-ws-11", "b.osei",
          "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "chrome.exe --single-argument https://intranet.example.test/handbook",
        ),
      },
      {
        parser: "generic-json",
        delayMs: 200,
        event: {
          timestamp: at(base, 60), source: "netflow", host: "app-02", user: null,
          action: "network_connection", src_ip: "10.0.2.15", dest_ip: "10.0.3.20",
          dest_port: 5432, process: null, parent_process: null, bytes_out: 8_192,
          outcome: "success",
        },
      },
      {
        parser: "generic-json",
        delayMs: 200,
        event: {
          timestamp: at(base, 64), source: "netflow", host: "app-02", user: null,
          action: "network_connection", src_ip: "10.0.2.15", dest_ip: "10.0.3.20",
          dest_port: 5432, process: null, parent_process: null, bytes_out: 12_288,
          outcome: "success",
        },
      },
      {
        parser: "generic-json",
        delayMs: 200,
        event: {
          timestamp: at(base, 68), source: "netflow", host: "app-02", user: null,
          action: "network_connection", src_ip: "10.0.2.15", dest_ip: "10.0.3.20",
          dest_port: 5432, process: null, parent_process: null, bytes_out: 6_144,
          outcome: "success",
        },
      },
      {
        parser: "generic-json",
        delayMs: 300,
        event: {
          timestamp: at(base, 75), source: "netflow", host: "db-01", user: "svc.backup",
          action: "network_transfer", src_ip: "10.0.3.20", dest_ip: "10.0.9.9",
          dest_port: 22, process: null, parent_process: null, bytes_out: 34_500_000,
          outcome: "success",
        },
      },
      {
        parser: "syslog-auth",
        delayMs: 250,
        event: sshLine(base, 82, {
          host: "build-03", verdict: "Accepted", user: "b.osei", srcIp: "10.0.4.7", port: 51230,
        }),
      },
      {
        parser: "edr-process",
        delayMs: 250,
        event: edr(
          base, 88, "build-03", "b.osei",
          "C:\\Windows\\explorer.exe",
          "C:\\Windows\\System32\\cmd.exe",
          "cmd.exe /c ipconfig /all",
        ),
      },
      {
        parser: "edr-process",
        delayMs: 250,
        event: edr(
          base, 95, "hr-ws-11", null,
          "C:\\Windows\\System32\\services.exe",
          "C:\\Windows\\System32\\svchost.exe",
          "svchost.exe -k netsvcs -p",
        ),
      },
    ];
    return events;
  },
};

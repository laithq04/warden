// SYNTHETIC TEST DATA — every event in this file is fabricated demo telemetry
// for exercising Warden's defensive detection rules. The hosts, users, IPs
// (RFC 5737 documentation ranges), command lines, and "credentials" are
// invented; this is not real attack tooling or a record of any real intrusion.
import type { Scenario, ScenarioEvent } from "../types.js";
import { at } from "./util.js";

const HOST = "fin-ws-04";
const HOST_IP = "10.0.8.31";
const SCANNER_IP = "198.51.100.23";
const USER = "j.moreno";

const SCAN_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 1433, 3306, 3389, 5985,
];

function edr(
  base: Date,
  offsetSeconds: number,
  parentImage: string,
  image: string,
  commandLine: string,
): unknown {
  return {
    ts: at(base, offsetSeconds),
    hostname: HOST,
    parentImage,
    image,
    commandLine,
    user: USER,
  };
}

export const reconToPrivesc: Scenario = {
  name: "recon-to-privesc",
  description:
    "Port scan of a workstation, then Word spawning PowerShell, a UAC bypass, and a rogue admin account (WARDEN-0004 -> 0005 -> 0006 -> 0009, one incident)",
  build(base) {
    const events: ScenarioEvent[] = [];

    SCAN_PORTS.forEach((port, i) => {
      events.push({
        parser: "generic-json",
        delayMs: 120,
        event: {
          timestamp: at(base, i * 0.4),
          source: "fw-sensor",
          host: HOST,
          user: null,
          action: "network_connection",
          src_ip: SCANNER_IP,
          dest_ip: HOST_IP,
          dest_port: port,
          process: null,
          parent_process: null,
          bytes_out: null,
          outcome: port === 445 || port === 3389 ? "success" : "blocked",
        },
      });
    });

    events.push({
      parser: "edr-process",
      delayMs: 700,
      event: edr(
        base,
        30,
        "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
        "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        "powershell.exe -NoProfile -WindowStyle Hidden -File C:\\Users\\j.moreno\\AppData\\Local\\Temp\\invoice-macro.ps1",
      ),
    });

    events.push({
      parser: "edr-process",
      delayMs: 600,
      event: edr(
        base,
        55,
        "C:\\Windows\\System32\\fodhelper.exe",
        "C:\\Windows\\System32\\cmd.exe",
        "cmd.exe /c reg delete HKCU\\Software\\Classes\\ms-settings /f",
      ),
    });

    events.push({
      parser: "edr-process",
      delayMs: 600,
      event: edr(
        base,
        80,
        "C:\\Windows\\System32\\cmd.exe",
        "C:\\Windows\\System32\\net.exe",
        "net user svc_sync Fake-Demo-Pass1 /add",
      ),
    });

    events.push({
      parser: "edr-process",
      delayMs: 300,
      event: edr(
        base,
        84,
        "C:\\Windows\\System32\\cmd.exe",
        "C:\\Windows\\System32\\net.exe",
        "net localgroup administrators svc_sync /add",
      ),
    });

    return events;
  },
};

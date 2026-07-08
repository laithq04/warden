// SYNTHETIC TEST DATA — every event in this file is fabricated demo telemetry
// for exercising Warden's defensive detection rules. The hosts, users, IPs
// (RFC 5737 documentation ranges), and activity are invented; this is not
// real attack tooling or a record of any real intrusion.
import type { Scenario, ScenarioEvent } from "../types.js";
import { at, sshLine } from "./util.js";

const HOST = "web-01";
const HOST_IP = "10.0.5.20";
const USER = "admin";
const ATTACKER_IP = "203.0.113.44";

export const bruteForceThenExfil: Scenario = {
  name: "brute-force-then-exfil",
  description:
    "SSH brute force on one account, then a successful privileged login, then a large outbound transfer (WARDEN-0002 -> 0003 -> 0007, one incident)",
  build(base) {
    const events: ScenarioEvent[] = [];

    const failureOffsets = [0, 6, 11, 15, 18, 20];
    failureOffsets.forEach((offset, i) => {
      events.push({
        parser: "syslog-auth",
        delayMs: 250,
        event: sshLine(base, offset, {
          host: HOST,
          verdict: "Failed",
          user: USER,
          srcIp: ATTACKER_IP,
          port: 51410 + i,
        }),
      });
    });

    events.push({
      parser: "syslog-auth",
      delayMs: 500,
      event: sshLine(base, 28, {
        host: HOST,
        verdict: "Accepted",
        user: USER,
        srcIp: ATTACKER_IP,
        port: 51431,
      }),
    });

    events.push({
      parser: "generic-json",
      delayMs: 600,
      event: {
        timestamp: at(base, 55),
        source: "netflow",
        host: HOST,
        user: USER,
        action: "network_transfer",
        src_ip: HOST_IP,
        dest_ip: ATTACKER_IP,
        dest_port: 443,
        process: null,
        parent_process: null,
        bytes_out: 262_144_000,
        outcome: "success",
      },
    });

    return events;
  },
};

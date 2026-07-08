// CLI for replaying Warden's synthetic demo scenarios against a running
// server. All emitted telemetry is fabricated test data (see the notices in
// ./scenarios/*) used to exercise the defensive detection pipeline.
import { config } from "../config.js";
import { scenarios } from "./scenarios/index.js";
import { replayScenario } from "./replay.js";

function scenarioList(): string {
  return Object.values(scenarios)
    .map((s) => `  ${s.name.padEnd(24)} ${s.description}`)
    .join("\n");
}

function usage(): string {
  return [
    "usage: npm run simulate -- <scenario> [--speed <multiplier>] [--url <baseUrl>]",
    "       npm run simulate -- --list",
    "",
    "scenarios:",
    scenarioList(),
  ].join("\n");
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
let scenarioName: string | undefined;
let speed = 1;
let baseUrl = process.env.WARDEN_URL ?? `http://localhost:${config.port}`;

for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--list") {
    console.log(scenarioList());
    process.exit(0);
  } else if (arg === "--speed") {
    speed = Number(args[++i]);
    if (!Number.isFinite(speed) || speed <= 0) fail("--speed must be a positive number");
  } else if (arg === "--url") {
    const value = args[++i];
    if (!value) fail("--url requires a value");
    baseUrl = value;
  } else if (arg === "--help" || arg === "-h") {
    console.log(usage());
    process.exit(0);
  } else if (!arg.startsWith("-") && scenarioName === undefined) {
    scenarioName = arg;
  } else {
    fail(`unknown argument "${arg}"\n\n${usage()}`);
  }
}

if (!scenarioName) fail(usage());

const scenario = scenarios[scenarioName];
if (!scenario) {
  fail(
    `unknown scenario "${scenarioName}"\n\navailable scenarios:\n${scenarioList()}`,
  );
}

console.log(`replaying "${scenario.name}" against ${baseUrl} (speed x${speed})`);
try {
  const result = await replayScenario(scenario, { baseUrl, speed, log: console.log });
  console.log(
    `done: ${result.eventsSent} event(s) sent, ${result.alerts.length} alert(s), ` +
      `${result.incidentIds.length} incident(s) touched`,
  );
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

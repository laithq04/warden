// SYNTHETIC TEST DATA HELPERS — these functions fabricate fake telemetry
// (timestamps and sshd-style log lines) for exercising Warden's defensive
// detection rules. Nothing here touches or represents real systems.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function at(base: Date, offsetSeconds: number): string {
  return new Date(base.getTime() + offsetSeconds * 1000).toISOString();
}

export interface SshLineOptions {
  host: string;
  verdict: "Failed" | "Accepted";
  user: string;
  srcIp: string;
  port: number;
}

export function sshLine(base: Date, offsetSeconds: number, opts: SshLineOptions): string {
  const d = new Date(base.getTime() + offsetSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, " ");
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  const pid = 1000 + Math.floor(Math.random() * 9000);
  return (
    `${MONTHS[d.getUTCMonth()]!} ${day} ${time} ${opts.host} sshd[${pid}]: ` +
    `${opts.verdict} password for ${opts.user} from ${opts.srcIp} port ${opts.port} ssh2`
  );
}

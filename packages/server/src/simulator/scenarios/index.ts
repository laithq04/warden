import type { Scenario } from "../types.js";
import { bruteForceThenExfil } from "./brute-force-then-exfil.js";
import { reconToPrivesc } from "./recon-to-privesc.js";
import { benignBaseline } from "./benign-baseline.js";

export const scenarios: Record<string, Scenario> = {
  [bruteForceThenExfil.name]: bruteForceThenExfil,
  [reconToPrivesc.name]: reconToPrivesc,
  [benignBaseline.name]: benignBaseline,
};

import path from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at packages/server/{src|dist}/config.*, so three levels up
// is the repo root in both dev (tsx) and built (dist) layouts.
const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3001),
  mongodbUri: process.env.MONGODB_URI ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  rulesDir: process.env.RULES_DIR ?? path.resolve(here, "..", "..", "..", "rules"),
};

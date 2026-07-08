import { createServer } from "node:http";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { loadRules } from "./rules/loader.js";
import { RuleEngine } from "./rules/engine.js";
import { AlertDeduper } from "./rules/dedup.js";
import { Correlator } from "./correlation/correlator.js";
import { Store } from "./store.js";
import { Broadcaster } from "./broadcast.js";
import { createApp } from "./app.js";

const rules = loadRules(config.rulesDir);
console.log(`[rules] loaded ${rules.length} rule(s) from ${config.rulesDir}`);

const engine = new RuleEngine(rules);
const deduper = new AlertDeduper(rules);
const correlator = new Correlator(config.correlationWindowSeconds);
const store = new Store();
const server = createServer();
const broadcaster = new Broadcaster(server);
const app = createApp({ engine, deduper, correlator, store, broadcaster });
server.on("request", app);

await connectDatabase();

server.listen(config.port, () => {
  console.log(`[server] warden engine listening on http://localhost:${config.port} (ws: /ws)`);
});

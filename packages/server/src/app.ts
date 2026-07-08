import express from "express";
import cors from "cors";
import { z } from "zod";
import { getParser, parserNames } from "./parsers/registry.js";
import type { RuleEngine } from "./rules/engine.js";
import type { Alert, Rule } from "./rules/schema.js";
import type { AlertDeduper } from "./rules/dedup.js";
import type { Correlator } from "./correlation/correlator.js";
import type { Incident } from "./correlation/schema.js";
import type { NormalizedEvent } from "./schema/event.js";
import type { Store } from "./store.js";
import type { Broadcaster } from "./broadcast.js";
import { scenarios } from "./simulator/scenarios/index.js";

const ingestBodySchema = z.object({
  parser: z.string().min(1),
  event: z.unknown(),
});

export interface AppDeps {
  engine: RuleEngine;
  deduper: AlertDeduper;
  correlator: Correlator;
  store: Store;
  broadcaster: Broadcaster;
  rules: Rule[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseLimit(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(Math.floor(n), 200);
}

export function createApp({ engine, deduper, correlator, store, broadcaster, rules }: AppDeps) {
  const app = express();
  // Permissive CORS for local dev only; tightened in Phase 5.
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  async function processEvent(event: NormalizedEvent) {
    await store.saveEvent(event);
    broadcaster.broadcast({ type: "event", data: event });

    const alerts: Alert[] = [];
    const incidents: Incident[] = [];
    for (const candidate of engine.evaluate(event)) {
      const dedup = deduper.process(candidate);
      if (dedup.status === "duplicate") {
        await store.updateAlert(dedup.original);
        continue;
      }

      alerts.push(candidate);
      await store.saveAlert(candidate);
      broadcaster.broadcast({ type: "alert", data: candidate });

      const correlation = correlator.process(candidate);
      if (correlation) {
        incidents.push(correlation.incident);
        await store.upsertIncident(correlation.incident);
        broadcaster.broadcast({ type: "incident", data: correlation.incident });
      }
    }

    return { alerts, incidents };
  }

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/api/ingest", async (req, res) => {
    const body = ingestBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "body must be { parser, event }" });
      return;
    }

    const parse = getParser(body.data.parser);
    if (!parse) {
      res.status(400).json({
        error: `unknown parser "${body.data.parser}"`,
        available: parserNames,
      });
      return;
    }

    const event = parse(body.data.event);
    if (!event) {
      res.status(422).json({ error: `event did not match the "${body.data.parser}" format` });
      return;
    }

    const { alerts, incidents } = await processEvent(event);
    res.status(200).json({ event, alerts, incidents });
  });

  app.get("/api/rules", (_req, res) => {
    res.status(200).json(
      rules.map(({ id, title, severity, mitre, description }) => ({
        id,
        title,
        severity,
        mitre,
        description,
      })),
    );
  });

  let runningScenario: string | null = null;

  app.get("/api/scenarios", (_req, res) => {
    res.status(200).json({
      running: runningScenario,
      scenarios: Object.values(scenarios).map(({ name, description }) => ({ name, description })),
    });
  });

  app.post("/api/simulate/:scenario", (req, res) => {
    const scenario = scenarios[req.params.scenario];
    if (!scenario) {
      res.status(404).json({
        error: `unknown scenario "${req.params.scenario}"`,
        available: Object.keys(scenarios),
      });
      return;
    }
    if (runningScenario) {
      res.status(409).json({ error: `scenario "${runningScenario}" is already running` });
      return;
    }

    const rawSpeed = Number(req.query.speed);
    const speed = Number.isFinite(rawSpeed) && rawSpeed > 0 ? rawSpeed : 1;
    const items = scenario.build(new Date());
    runningScenario = scenario.name;

    // Replays in-process (no HTTP round-trip); results stream to clients over /ws.
    void (async () => {
      try {
        for (const [i, item] of items.entries()) {
          if (i > 0) await sleep(item.delayMs / speed);
          const event = getParser(item.parser)?.(item.event);
          if (event) await processEvent(event);
        }
      } catch (err) {
        console.error(`[simulate] scenario "${scenario.name}" failed:`, err);
      } finally {
        runningScenario = null;
      }
    })();

    res.status(202).json({ scenario: scenario.name, events: items.length, speed });
  });

  app.get("/api/events", async (req, res) => {
    res.status(200).json(await store.listEvents(parseLimit(req.query.limit)));
  });

  app.get("/api/alerts", async (req, res) => {
    res.status(200).json(await store.listAlerts(parseLimit(req.query.limit)));
  });

  app.get("/api/incidents", async (req, res) => {
    res.status(200).json(await store.listIncidents(parseLimit(req.query.limit)));
  });

  return app;
}

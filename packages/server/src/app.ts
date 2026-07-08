import express from "express";
import cors from "cors";
import { z } from "zod";
import { getParser, parserNames } from "./parsers/registry.js";
import type { RuleEngine } from "./rules/engine.js";
import type { Broadcaster } from "./broadcast.js";

const ingestBodySchema = z.object({
  parser: z.string().min(1),
  event: z.unknown(),
});

export function createApp(engine: RuleEngine, broadcaster: Broadcaster) {
  const app = express();
  // Permissive CORS for local dev only; tightened in Phase 5.
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/api/ingest", (req, res) => {
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

    const alerts = engine.evaluate(event);
    broadcaster.broadcast({ type: "event", data: event });
    for (const alert of alerts) {
      broadcaster.broadcast({ type: "alert", data: alert });
    }

    res.status(200).json({ event, alerts });
  });

  return app;
}

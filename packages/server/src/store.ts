import mongoose from "mongoose";
import type { NormalizedEvent } from "./schema/event.js";
import type { Alert } from "./rules/schema.js";
import type { Incident } from "./correlation/schema.js";
import { AlertModel, EventModel, IncidentModel } from "./models.js";

const MEMORY_CAP = 1000;

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

// Always keeps a capped in-memory copy so the read API works without MongoDB;
// writes additionally go to Mongo when a connection is up. Mongo being down
// must never fail ingest, so write errors are logged (once) and swallowed.
export class Store {
  private readonly events: NormalizedEvent[] = [];
  private readonly alerts: Alert[] = [];
  private readonly incidents: Incident[] = [];
  private warnedOffline = false;
  private warnedWriteError = false;

  async saveEvent(event: NormalizedEvent): Promise<void> {
    this.push(this.events, event);
    await this.write(() => EventModel.create(event));
  }

  async saveAlert(alert: Alert): Promise<void> {
    this.push(this.alerts, alert);
    await this.write(() => AlertModel.create(alert));
  }

  // The in-memory copy holds the same object reference the deduper mutated,
  // so only Mongo needs an explicit update.
  async updateAlert(alert: Alert): Promise<void> {
    await this.write(() =>
      AlertModel.updateOne(
        { id: alert.id },
        { $set: { count: alert.count, lastSeen: alert.lastSeen } },
      ),
    );
  }

  async upsertIncident(incident: Incident): Promise<void> {
    const idx = this.incidents.findIndex((i) => i.id === incident.id);
    if (idx === -1) this.push(this.incidents, incident);
    await this.write(() =>
      IncidentModel.findOneAndUpdate({ id: incident.id }, incident, { upsert: true }),
    );
  }

  async listEvents(limit: number): Promise<NormalizedEvent[]> {
    if (mongoReady()) {
      return (await EventModel.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .select("-_id")
        .lean()) as unknown as NormalizedEvent[];
    }
    return this.tail(this.events, limit);
  }

  async listAlerts(limit: number): Promise<Alert[]> {
    if (mongoReady()) {
      return (await AlertModel.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .select("-_id")
        .lean()) as unknown as Alert[];
    }
    return this.tail(this.alerts, limit);
  }

  async listIncidents(limit: number): Promise<Incident[]> {
    if (mongoReady()) {
      return (await IncidentModel.find()
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select("-_id")
        .lean()) as unknown as Incident[];
    }
    return [...this.incidents]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, limit);
  }

  private push<T>(list: T[], item: T): void {
    list.push(item);
    if (list.length > MEMORY_CAP) list.splice(0, list.length - MEMORY_CAP);
  }

  private tail<T>(list: T[], limit: number): T[] {
    return list.slice(-limit).reverse();
  }

  private async write(op: () => Promise<unknown>): Promise<void> {
    if (!mongoReady()) {
      if (!this.warnedOffline) {
        this.warnedOffline = true;
        console.warn(
          "[store] MongoDB not connected; keeping data in memory only (set MONGODB_URI to persist)",
        );
      }
      return;
    }
    try {
      await op();
    } catch (err) {
      if (!this.warnedWriteError) {
        this.warnedWriteError = true;
        console.warn("[store] MongoDB write failed, continuing without persistence:", (err as Error).message);
      }
    }
  }
}

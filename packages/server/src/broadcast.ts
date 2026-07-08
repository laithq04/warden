import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import type { NormalizedEvent } from "./schema/event.js";
import type { Alert } from "./rules/schema.js";
import type { Incident } from "./correlation/schema.js";

export type WsMessage =
  | { type: "event"; data: NormalizedEvent }
  | { type: "alert"; data: Alert }
  | { type: "incident"; data: Incident };

export class Broadcaster {
  private readonly wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
  }

  broadcast(message: WsMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): void {
    this.wss.close();
  }
}

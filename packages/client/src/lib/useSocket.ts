import { useEffect, useRef, useState } from "react";
import type { WsMessage } from "./types";

export type SocketStatus = "connecting" | "open" | "closed";

export function useSocket(onMessage: (msg: WsMessage) => void) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${proto}//${location.host}/ws`);

      socket.onopen = () => setStatus("open");
      socket.onmessage = (event) => {
        try {
          handlerRef.current(JSON.parse(event.data as string) as WsMessage);
        } catch {
          // ignore malformed frames
        }
      };
      socket.onclose = () => {
        setStatus("closed");
        if (!cancelled) retryTimer = setTimeout(connect, 2000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  return status;
}

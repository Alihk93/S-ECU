import { useEffect, useRef, useState } from "react";
import { parseFrame, type LiveFrame } from "@/lib/protocol";

export type LinkStatus = "connecting" | "live" | "offline";

export interface EcuLink {
  status: LinkStatus;
  // Latest decoded frame; read by the engine loop each tick without re-rendering.
  frameRef: React.MutableRefObject<LiveFrame | null>;
  // True only while a fresh frame is flowing (drops back to sim if the stream stalls).
  connectedRef: React.MutableRefObject<boolean>;
}

const STALE_MS = 1500; // no frame for this long => treat link as dead, fall back to sim
const RECONNECT_MIN = 500;
const RECONNECT_MAX = 8000;

/**
 * Same-origin WebSocket client for live ESP telemetry, with exponential-backoff
 * reconnect. Display-only: it never sends. When no server is present (e.g. the bundled
 * artifact opened standalone), it simply stays "offline" and the engine runs its sim.
 */
export function useEcuLink(): EcuLink {
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const frameRef = useRef<LiveFrame | null>(null);
  const connectedRef = useRef(false);
  const lastFrameAt = useRef(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let backoff = RECONNECT_MIN;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let staleTimer: ReturnType<typeof setInterval> | undefined;
    let disposed = false;
    let everConnected = false;
    let failedAttempts = 0;

    const markOffline = () => {
      connectedRef.current = false;
      if (disposed) return;
      // Reconnecting after a real link drops; "offline" once we conclude no server
      // is there (e.g. the bundle opened standalone) so the badge reads "Simulation".
      setStatus(everConnected || failedAttempts < 2 ? "connecting" : "offline");
    };

    let firstFrameTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (disposed) return;
      const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
      try {
        ws = new WebSocket(url);
      } catch {
        failedAttempts++;
        markOffline();
        scheduleReconnect();
        return;
      }

      // A socket can open (e.g. a dev server) yet never speak our protocol; if no valid
      // frame arrives shortly, drop it so we fall back to the simulation.
      ws.onopen = () => {
        clearTimeout(firstFrameTimer);
        firstFrameTimer = setTimeout(() => {
          if (!connectedRef.current) ws?.close();
        }, STALE_MS);
      };

      ws.onmessage = (ev) => {
        const frame = parseFrame(typeof ev.data === "string" ? ev.data : "");
        if (!frame) return;
        clearTimeout(firstFrameTimer);
        frameRef.current = frame;
        lastFrameAt.current = performance.now();
        backoff = RECONNECT_MIN;
        everConnected = true;
        failedAttempts = 0;
        if (!connectedRef.current) {
          connectedRef.current = true;
          if (!disposed) setStatus("live");
        }
      };
      ws.onclose = () => {
        clearTimeout(firstFrameTimer);
        if (!connectedRef.current) failedAttempts++;
        markOffline();
        scheduleReconnect();
      };
      ws.onerror = () => ws?.close();
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, RECONNECT_MAX);
    };

    // Watchdog: if frames stop arriving but the socket stays half-open, drop to sim.
    staleTimer = setInterval(() => {
      if (
        connectedRef.current &&
        performance.now() - lastFrameAt.current > STALE_MS
      ) {
        markOffline();
      }
    }, 500);

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      clearTimeout(firstFrameTimer);
      clearInterval(staleTimer);
      ws?.close();
    };
  }, []);

  return { status, frameRef, connectedRef };
}

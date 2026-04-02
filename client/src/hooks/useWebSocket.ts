import { useEffect, useRef, useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { reportApi } from "@/store/api/reportApi";
import type { WebSocketMessage } from "@/types";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const connectRef = useRef<() => void>(() => {});
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const connect = useCallback(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/reports/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage;

        if (data.type === "new_report") {
          // Invalidate the reports cache so RTK Query refetches
          dispatch(
            reportApi.util.invalidateTags([{ type: "Report", id: "LIST" }]),
          );
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    connectRef.current = connect;
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Null out handlers before closing so the onclose callback
        // does not schedule a reconnect for this intentional close.
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
}

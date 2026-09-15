import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ORG_TREE_QUERY_KEY } from "@/entities/org/api/useOrgTree";
import { OrgNodeDto } from "@/entities/org/model/types";
import {
  WebSocketMessage,
  NodePatchPayload,
} from "@/entities/org/model/patchTypes";
import { useOrgUi } from "@/features/org-view/model/OrgUiContext";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface UseOrgWebSocketReturn {
  status: ConnectionStatus;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 16000;

export const useOrgWebSocket = (): UseOrgWebSocketReturn => {
  const queryClient = useQueryClient();
  const { setLastPatch } = useOrgUi();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const wsRef = useRef<WebSocket | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  const applyPatch = useCallback(
    (patch: NodePatchPayload) => {
      // 1. Точечно мутируем сырой кэш React Query без сетевого рефетча
      queryClient.setQueryData<OrgNodeDto[]>(ORG_TREE_QUERY_KEY, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((node) =>
          node.id === patch.id ? { ...node, ...patch } : node,
        );
      });

      // 2. Отправляем патч в контекст для инкрементального пересчета агрегатов
      setLastPatch(patch);
    },
    [queryClient, setLastPatch],
  );

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    setStatus((prev) => (prev === "connected" ? "reconnecting" : prev));
    const socketUrl = "ws://localhost:3001/ws";
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmountedRef.current) {
        ws.close();
        return;
      }
      setStatus("connected");
      backoffRef.current = INITIAL_BACKOFF_MS;
      console.log("⚡ [WebSocket] Соединение установлено");
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === "NODE_PATCH") {
          applyPatch(message.payload);
        }
      } catch (err) {
        console.error("⚠️ [WebSocket] Ошибка обработки сообщения:", err);
      }
    };

    ws.onerror = () => {
      // Браузер вызовет onclose следом
    };

    ws.onclose = () => {
      if (isUnmountedRef.current) return;

      setStatus("reconnecting");
      const nextDelay = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);

      reconnectTimeoutRef.current = setTimeout(() => {
        backoffRef.current = nextDelay;
        connect();
      }, backoffRef.current);
    };
  }, [applyPatch]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { status };
};

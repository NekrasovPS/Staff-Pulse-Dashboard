import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { generateOrgTree, FlatNodeRaw } from "./mock-data";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbNodes: FlatNodeRaw[] = generateOrgTree();

app.get("/api/org-tree", (_req, res) => {
  setTimeout(() => {
    res.json(dbNodes);
  }, 200);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Периодическая генерация живых патчей для случайных узлов
const broadcastPatch = () => {
  if (wss.clients.size === 0) return;

  // Выбираем случайный узел
  const randomIndex = Math.floor(Math.random() * dbNodes.length);
  const targetNode = dbNodes[randomIndex];

  // Генерируем изменение: дельта бюджета, штата или эффективности
  const changeType = Math.floor(Math.random() * 3);
  const now = new Date().toISOString();

  let patchData: Partial<FlatNodeRaw> = {
    id: targetNode.id,
    updatedAt: now,
  };

  if (changeType === 0) {
    // Изменение эффективности (+/- 5-15%)
    const delta =
      (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 12 + 3);
    const newPerf = Math.max(10, Math.min(100, targetNode.performance + delta));
    targetNode.performance = newPerf;
    patchData.performance = newPerf;
  } else if (changeType === 1) {
    // Изменение численности сотрудников (+/- 1-3 чел)
    const delta =
      (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1);
    const newHeadcount = Math.max(1, targetNode.headcount + delta);
    targetNode.headcount = newHeadcount;
    patchData.headcount = newHeadcount;
  } else {
    // Изменение бюджета (+/- 200 000 - 1 500 000 руб)
    const delta =
      (Math.random() > 0.5 ? 1 : -1) *
      (Math.floor(Math.random() * 10 + 2) * 100_000);
    const newBudget = Math.max(500_000, targetNode.budget + delta);
    targetNode.budget = newBudget;
    patchData.budget = newBudget;
  }

  targetNode.updatedAt = now;

  const message = JSON.stringify({
    type: "NODE_PATCH",
    payload: patchData,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Запуск фонового генератора обновлений каждые 3.5 секунды
setInterval(broadcastPatch, 3500);

server.listen(PORT, () => {
  console.log(`🚀 HTTP server running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket server running on ws://localhost:${PORT}/ws`);
});

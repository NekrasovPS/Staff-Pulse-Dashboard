import express from "express";
import cors from "cors";
import { generateOrgTree } from "./mock-data";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbNodes = generateOrgTree();

app.get("/api/org-tree", (_req, res) => {
  // Имитация небольшой сетевой задержки для проверки loading states
  setTimeout(() => {
    res.json(dbNodes);
  }, 350);
});

app.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log(`📊 Total generated nodes: ${dbNodes.length}`);
});

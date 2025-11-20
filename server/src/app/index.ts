import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRoutes, projectRoutes } from "../api/v1/index.js";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ 
  status: "ok", 
  timestamp: new Date().toISOString(),
  database: "sqlite"
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

const port = process.env.PORT ?? 4000;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`\n ReactPilot API running on http://localhost:${port}`);
    console.log(` Dashboard: http://localhost:5174`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(` Database: SQLite (data/reactpilot.db)\n`);
  });
}

export default app;

import os from "node:os";
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/http";
import { prisma } from "../utils/prisma";

export const health = (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "backend", uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() });
};

// Proves backend -> PostgreSQL connectivity with a real query.
export const databaseHealth = asyncHandler(async (_req, res) => {
  const started = Date.now();
  try {
    const [row] = await prisma.$queryRaw<{ version: string }[]>`SELECT version() AS version`;
    res.json({ status: "ok", latencyMs: Date.now() - started, version: row.version.split(" ").slice(0, 2).join(" ") });
  } catch {
    res.status(503).json({ status: "error", error: "Database unreachable" });
  }
});

// Requires login: exposes host details that should not be public.
export const systemInfo = asyncHandler(async (_req, res) => {
  res.json({
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    cpus: os.cpus().length,
    loadAverage: os.loadavg().map((n) => Number(n.toFixed(2))),
    totalMemoryMB: Math.round(os.totalmem() / 1048576),
    freeMemoryMB: Math.round(os.freemem() / 1048576),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    processUptimeSeconds: Math.round(process.uptime()),
    systemUptimeSeconds: Math.round(os.uptime()),
    processMemoryMB: Math.round(process.memoryUsage().rss / 1048576),
  });
});

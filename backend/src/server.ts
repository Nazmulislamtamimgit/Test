import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./utils/prisma";

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown so systemd restarts do not drop in-flight requests.
function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

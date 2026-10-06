import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./config/logger.js";
import prisma from "./config/database.js";

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, environment: env.NODE_ENV },
    `Forge API server started running at http://localhost:${env.PORT}`
  );
  logger.info(`Swagger API Docs available at http://localhost:${env.PORT}/docs`);
});

// Graceful Shutdown
async function shutdown(signal) {
  logger.info({ signal }, "Received shutdown signal. Closing HTTP server...");

  server.close(async () => {
    logger.info("HTTP server closed. Disconnecting database...");
    try {
      await prisma.$disconnect();
      logger.info("Database disconnected cleanly.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during database disconnect");
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if clean exit fails
  setTimeout(() => {
    logger.error("Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled Rejection detected!");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught Exception thrown!");
  process.exit(1);
});

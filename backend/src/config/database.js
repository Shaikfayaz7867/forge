import { PrismaClient } from "@prisma/client";
import { env, isTest } from "./env.js";
import logger from "./logger.js";

const globalForPrisma = globalThis;

/** Singleton Prisma client. Reuses existing instance in dev to avoid hot-reload leaks. */
const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "warn" },
            { emit: "event", level: "error" },
          ]
        : [{ emit: "event", level: "error" }],
    datasources: {
      db: {
        url: isTest ? process.env.TEST_DATABASE_URL ?? env.DATABASE_URL : env.DATABASE_URL,
      },
    },
  });

if (env.NODE_ENV === "development") {
  // Log slow queries in dev
  prisma.$on("query", (e) => {
    if (e.duration > 200) {
      logger.warn({ duration: e.duration, query: e.query.slice(0, 200) }, "Slow query");
    }
  });
}

prisma.$on("error", (e) => {
  logger.error({ message: e.message, target: e.target }, "Prisma error");
});

if (env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

export default prisma;

/** Test database connectivity. */
export async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

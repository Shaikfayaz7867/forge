import prisma from "../config/database.js";
import { asyncHandler } from "../utils/async-handler.js";

export const healthController = {
  health: asyncHandler(async (req, res) => {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }),

  ready: asyncHandler(async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(503).json({
        status: "unready",
        database: "disconnected",
        error: err.message,
      });
    }
  }),

  live: asyncHandler(async (req, res) => {
    return res.status(200).json({ status: "live" });
  }),
};

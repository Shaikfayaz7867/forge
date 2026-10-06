import prisma from "../config/database.js";
import logger from "../config/logger.js";

/**
 * Cleanup expired tokens and abandoned active sessions (>24h old).
 */
export async function runCleanupJob() {
  logger.info("Running scheduled cleanup job...");

  try {
    // 1. Delete revoked/expired refresh tokens
    const now = new Date();
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { isRevoked: true }],
      },
    });

    // 2. Delete active sessions inactive for over 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deletedSessions = await prisma.activeSession.deleteMany({
      where: {
        updatedAt: { lt: oneDayAgo },
      },
    });

    logger.info(
      { deletedTokens: deletedTokens.count, deletedSessions: deletedSessions.count },
      "Cleanup job finished successfully"
    );
  } catch (err) {
    logger.error({ err }, "Cleanup job failed");
  }
}

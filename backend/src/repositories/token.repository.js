import prisma from "../config/database.js";
import { createHash } from "crypto";

/** Hash a refresh token for safe storage. Never store the raw token. */
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export const tokenRepository = {
  async create({ userId, token, family, expiresAt, userAgent, ipAddress }) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        family,
        expiresAt,
        userAgent: userAgent?.slice(0, 512),
        ipAddress: ipAddress?.slice(0, 64),
      },
    });
  },

  async findByToken(token) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });
  },

  async findByFamily(family) {
    return prisma.refreshToken.findMany({
      where: { family },
    });
  },

  async revoke(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  },

  async revokeFamily(family) {
    return prisma.refreshToken.updateMany({
      where: { family },
      data: { isRevoked: true },
    });
  },

  async revokeAllForUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  },

  async touchLastUsed(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  },

  /** Cleanup expired tokens (call from a scheduled job). */
  async deleteExpired() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};

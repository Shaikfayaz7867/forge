import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, refreshTokenExpirySeconds } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";
import { userRepository } from "../repositories/user.repository.js";
import { tokenRepository } from "../repositories/token.repository.js";
import prisma from "../config/database.js";
import logger from "../config/logger.js";

export const authService = {
  async register({ email, password, name }) {
    // Check for existing user
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict("Email address is already registered", "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({ email, passwordHash, name });



    logger.info({ userId: user.id }, "User registered");
    return user;
  },

  async login({ email, password, userAgent, ipAddress }) {
    const user = await userRepository.findByEmail(email);

    // Always compute hash even if user not found to prevent timing attacks
    const passwordMatch = user
      ? await verifyPassword(user.passwordHash, password)
      : await hashPassword("dummy").then(() => false);

    if (!user || !passwordMatch || !user.isActive) {
      await auditLogin(user?.id ?? null, false, ipAddress, userAgent);
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, userAgent, ipAddress);
    await auditLogin(user.id, true, ipAddress, userAgent);

    logger.info({ userId: user.id }, "User logged in");
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken };
  },

  async refresh({ refreshToken: rawToken, userAgent, ipAddress }) {
    const payload = verifyRefreshToken(rawToken);
    const stored = await tokenRepository.findByToken(rawToken);

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      // If the token exists but is revoked → reuse attack detected
      if (stored?.isRevoked) {
        await tokenRepository.revokeFamily(stored.family);
        logger.warn({ family: stored.family }, "Refresh token reuse detected — family revoked");
        throw ApiError.unauthorized("Token reuse detected — all sessions invalidated", "TOKEN_REUSED");
      }
      throw ApiError.unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
    }

    if (!stored.user?.isActive) {
      throw ApiError.unauthorized("Account deactivated", "ACCOUNT_INACTIVE");
    }

    // Rotate: revoke old token, issue new pair in same family
    await tokenRepository.revoke(stored.id);
    const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
      stored.user,
      userAgent,
      ipAddress,
      stored.family // keep same family for reuse detection
    );

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(rawToken) {
    const stored = await tokenRepository.findByToken(rawToken);
    if (stored) {
      await tokenRepository.revoke(stored.id);
    }
  },

  async logoutAll(userId) {
    await tokenRepository.revokeAllForUser(userId);
    logger.info({ userId }, "All sessions revoked");
  },
};

/** Issue access + refresh token pair. */
async function issueTokenPair(user, userAgent, ipAddress, existingFamily) {
  const family = existingFamily ?? randomUUID();
  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, family });

  const expiresAt = new Date(Date.now() + refreshTokenExpirySeconds() * 1000);
  await tokenRepository.create({ userId: user.id, token: refreshToken, family, expiresAt, userAgent, ipAddress });

  return { accessToken, refreshToken };
}

async function auditLogin(userId, success, ipAddress, userAgent) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: success ? "LOGIN" : "LOGIN_FAILED",
        ipAddress: ipAddress?.slice(0, 64),
        userAgent: userAgent?.slice(0, 512),
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}

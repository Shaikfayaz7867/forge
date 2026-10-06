import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

/**
 * Generate a short-lived access JWT.
 * @param {{ id: string, email: string, role: string }} payload
 */
export function generateAccessToken(payload) {
  return jwt.sign(
    { sub: payload.id, email: payload.email, role: payload.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: "HS256" }
  );
}

/**
 * Generate a long-lived refresh JWT.
 * @param {{ id: string, family: string }} payload
 */
export function generateRefreshToken(payload) {
  return jwt.sign(
    { sub: payload.id, family: payload.family },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN, algorithm: "HS256" }
  );
}

/**
 * Verify an access token. Throws ApiError.unauthorized on failure.
 * @param {string} token
 * @returns {{ sub: string, email: string, role: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token expired", "TOKEN_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid access token", "TOKEN_INVALID");
  }
}

/**
 * Verify a refresh token. Throws ApiError.unauthorized on failure.
 * @param {string} token
 * @returns {{ sub: string, family: string, iat: number, exp: number }}
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Refresh token expired", "REFRESH_TOKEN_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid refresh token", "REFRESH_TOKEN_INVALID");
  }
}

/**
 * Parse refresh token expiry in seconds from env string (e.g. "7d" → 604800).
 */
export function refreshTokenExpirySeconds() {
  const str = env.JWT_REFRESH_EXPIRES_IN;
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 3600;
  const [, n, unit] = match;
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(n) * (multipliers[unit] ?? 86400);
}

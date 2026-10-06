import { verifyAccessToken } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../config/database.js";

/**
 * Authentication middleware.
 * Reads the Bearer token from the Authorization header, verifies it,
 * and attaches req.user = { id, email, role }.
 *
 * NEVER trusts userId from the request body or query string.
 */
export async function authenticate(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized("Bearer token required");
    }

    const payload = verifyAccessToken(token);

    // Verify the user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Account not found or deactivated", "ACCOUNT_INACTIVE");
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present, but
 * does not require it. Used for endpoints that work both authenticated
 * and unauthenticated.
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (user && user.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
}

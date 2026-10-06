import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { isProd } from "../config/env.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const ACCESS_COOKIE_NAME = "accessToken";

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes (matches token expiry)
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    return sendCreated(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } }, "User registered successfully");
  }),

  login: asyncHandler(async (req, res) => {
    const userAgent = req.get("User-Agent");
    const ipAddress = req.ip;

    const { user, accessToken, refreshToken } = await authService.login({
      ...req.body,
      userAgent,
      ipAddress,
    });

    setAuthCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { user, accessToken, refreshToken }, "Login successful");
  }),

  refresh: asyncHandler(async (req, res) => {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
    const userAgent = req.get("User-Agent");
    const ipAddress = req.ip;

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        error: { code: "REFRESH_TOKEN_REQUIRED", message: "Refresh token is required" },
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh({
      refreshToken: rawToken,
      userAgent,
      ipAddress,
    });

    setAuthCookies(res, accessToken, newRefreshToken);
    return sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, "Token refreshed successfully");
  }),

  logout: asyncHandler(async (req, res) => {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
    if (rawToken) {
      await authService.logout(rawToken);
    }
    clearAuthCookies(res);
    return sendSuccess(res, null, "Logged out successfully");
  }),

  logoutAll: asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);
    clearAuthCookies(res);
    return sendSuccess(res, null, "Logged out from all sessions");
  }),

  me: asyncHandler(async (req, res) => {
    return sendSuccess(res, { user: req.user });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    // Stub implementation: log the email and pretend we sent an email
    const { email } = req.body;
    console.log(`[STUB] Password reset requested for: ${email}`);
    // Real implementation would generate a token, save to DB, and send an email
    return sendSuccess(res, null, "If that email exists, we sent a password reset link.");
  }),
};

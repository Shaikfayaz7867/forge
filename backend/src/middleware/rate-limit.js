import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/** Standard rate limit message format. */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests, please slow down",
    },
    requestId: req.requestId,
  });
};

/** General API rate limiter — 100 req / 15 min. */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
  skip: (req) => req.method === "OPTIONS",
});

/** Strict limiter for login/register — 10 req / 15 min. */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

/** Stricter limiter for refresh tokens — 20 req / 15 min. */
export const refreshLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

/** Upload endpoints — 30 req / 15 min. */
export const uploadLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.user?.id ?? req.ip,
});

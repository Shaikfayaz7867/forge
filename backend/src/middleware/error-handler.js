import logger from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { isProd } from "../config/env.js";

/**
 * Global error handler. Must be registered with 4 arguments (err, req, res, next).
 * Converts any error into a safe, consistent API response.
 * Never exposes stack traces, SQL errors, or internal paths in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const requestId = req.requestId ?? "unknown";

  if (err instanceof ApiError) {
    // Expected operational error
    if (err.statusCode >= 500) {
      logger.error({ err, requestId, userId: req.user?.id }, err.message);
    } else {
      logger.warn({ statusCode: err.statusCode, code: err.code, requestId }, err.message);
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details?.length > 0 ? err.details : undefined,
      },
      requestId,
    });
  }

  // CORS errors
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({
      success: false,
      error: { code: "CORS_BLOCKED", message: "Cross-origin request blocked" },
      requestId,
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    // Unique constraint violation
    const field = err.meta?.target?.[0] ?? "field";
    return res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: `${field} already exists` },
      requestId,
    });
  }

  if (err.code === "P2025") {
    // Record not found (e.g. update on non-existent record)
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Record not found" },
      requestId,
    });
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: { code: "FILE_TOO_LARGE", message: "File exceeds maximum allowed size" },
      requestId,
    });
  }

  // Unexpected error — log full details but never send to client
  logger.error({ err, requestId, userId: req.user?.id }, "Unhandled error");

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "An unexpected error occurred" : err.message,
    },
    requestId,
  });
}

/**
 * Custom API error class. All thrown errors in the application should be
 * instances of ApiError. The global error handler serialises these safely.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Human-readable error message
   * @param {string} code Machine-readable error code (SCREAMING_SNAKE_CASE)
   * @param {any[]} details Optional validation details array
   */
  constructor(statusCode, message, code = "INTERNAL_ERROR", details = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, code = "BAD_REQUEST", details = []) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "Access denied", code = "FORBIDDEN") {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = "CONFLICT") {
    return new ApiError(409, message, code);
  }

  static unprocessable(message, code = "UNPROCESSABLE", details = []) {
    return new ApiError(422, message, code, details);
  }

  static tooManyRequests(message = "Too many requests", code = "RATE_LIMITED") {
    return new ApiError(429, message, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, message, code);
  }
}

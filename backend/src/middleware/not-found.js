import { ApiError } from "../utils/ApiError.js";

/** Handles requests to unknown routes. */
export function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`, "ROUTE_NOT_FOUND"));
}

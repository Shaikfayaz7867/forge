import { randomUUID } from "crypto";

/**
 * Attaches a unique request ID to every request.
 * Uses the incoming X-Request-ID header if present and valid, otherwise generates one.
 * The ID is included in all log entries and error responses.
 */
export function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && /^[\w\-]{8,64}$/.test(incoming)
      ? incoming
      : randomUUID();

  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
}

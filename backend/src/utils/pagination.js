import { ApiError } from "./ApiError.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Parse and validate pagination parameters from a query string.
 * @param {{ page?: string, limit?: string }} query Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const rawLimit = parseInt(query.limit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Validate that a sort field is in the allowed whitelist.
 * Never expose raw column names from query params directly to Prisma.
 * @param {string} field
 * @param {string[]} allowed
 * @param {string} defaultField
 */
export function validateSortField(field, allowed, defaultField) {
  if (!field) return defaultField;
  if (!allowed.includes(field)) {
    throw ApiError.badRequest(
      `Invalid sort field '${field}'. Allowed: ${allowed.join(", ")}`,
      "INVALID_SORT_FIELD"
    );
  }
  return field;
}

/**
 * Parse sort order. Only "asc" or "desc" are valid.
 * @param {string} order
 * @returns {"asc" | "desc"}
 */
export function parseSortOrder(order) {
  return order === "asc" ? "asc" : "desc";
}

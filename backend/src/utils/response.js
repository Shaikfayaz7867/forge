/**
 * Standard API response helpers. All responses use consistent shape.
 *
 * Success: { success: true, data: {} }
 * Error:   { success: false, error: { code, message, details }, requestId }
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {any} data Response payload
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data, message = null, statusCode = 200) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  
  return res.status(statusCode).json(payload);
}

/**
 * Send a created response (201).
 * @param {import('express').Response} res
 * @param {any} data Created resource
 * @param {string} [message] Optional success message
 */
export function sendCreated(res, data, message = null) {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a no-content response (204).
 * @param {import('express').Response} res
 */
export function sendNoContent(res) {
  return res.status(204).end();
}

/**
 * Build a paginated response payload.
 * @param {any[]} items
 * @param {number} total Total count before pagination
 * @param {number} page Current page (1-indexed)
 * @param {number} limit Items per page
 */
export function paginated(items, total, page, limit) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

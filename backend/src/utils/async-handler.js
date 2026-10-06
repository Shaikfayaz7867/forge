/**
 * Wraps async route handlers to catch rejected promises and forward to
 * Express's next(err). Eliminates try/catch boilerplate in every controller.
 *
 * @param {Function} fn Async express handler (req, res, next) => Promise
 * @returns {Function} Express-compatible handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

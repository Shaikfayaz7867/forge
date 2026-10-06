import { ApiError } from "../utils/ApiError.js";

/**
 * Role-based authorization middleware factory.
 * Call authorize("ADMIN") to require ADMIN role.
 * Must be used after authenticate().
 *
 * @param {...string} roles Allowed roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(" or ")}`));
    }
    next();
  };
}

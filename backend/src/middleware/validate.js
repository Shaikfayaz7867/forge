import { ApiError } from "../utils/ApiError.js";

/**
 * Zod validation middleware factory.
 * Validates req.body, req.params, and/or req.query against provided Zod schemas.
 *
 * @param {{ body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    const errors = [];

    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        errors.push(...details);
      } else {
        // Replace with coerced/transformed values
        req[part] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(
        new ApiError(422, "Validation failed", "VALIDATION_ERROR", errors)
      );
    }

    next();
  };
}

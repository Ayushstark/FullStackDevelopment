import { ApiError } from "../utils/ApiError.js";

/**
 * Global error handling middleware.
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      errors: err.errors,
      success: false,
    });
  }

  console.error("Unhandled error:", err);
  return res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    success: false,
  });
}

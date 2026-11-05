import { getMongoStatus } from "../config/db.js";

/**
 * GET /api/health
 */
export function healthCheck(_req, res) {
  res.json({
    status: "online",
    db: getMongoStatus() ? "MongoDB Connected" : "Local Resilient Store (MongoDB offline)",
    timestamp: new Date().toISOString(),
  });
}

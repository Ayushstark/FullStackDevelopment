import express from "express";
import cors from "cors";
import { NODE_ENV, CLIENT_ORIGINS } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Only allow the configured frontend origin in production. Vite's local origins
// are enabled for development, while non-browser clients can omit Origin.
const allowedOrigins = new Set(
  [CLIENT_ORIGINS, ...(NODE_ENV === "production" ? [] : ["http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"])]
    .filter(Boolean)
    .flatMap((origins) => origins.split(",").map((origin) => origin.trim()).filter(Boolean)),
);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "256kb" }));

// Mount all routes
app.use(routes);

// Global error handler
app.use(errorHandler);

export default app;

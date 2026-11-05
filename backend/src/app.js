import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { NODE_ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware: allow all caller origins dynamically with credentials
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));
app.options("*", cors());
app.use(express.json({ limit: "256kb" }));

// Ensure DB connection is initialized on API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    try {
      await connectDB();
    } catch (_err) {
      // Proceed gracefully to fallback store
    }
  }
  next();
});

// Mount all routes
app.use(routes);

// In production or when client build exists, serve static assets
const distPath = path.resolve(__dirname, "../../dist");
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const clientBuildPath = fs.existsSync(distPath)
  ? distPath
  : (fs.existsSync(frontendDistPath) ? frontendDistPath : null);

if (clientBuildPath) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Global error handler
app.use(errorHandler);

export default app;

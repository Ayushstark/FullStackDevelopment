import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { authMiddleware } from "../middleware/auth.js";
import { createLog, getLogs } from "../controllers/growth.controller.js";

const router = Router();

router.post("/log", apiLimiter, authMiddleware, createLog);
router.get("/logs", apiLimiter, authMiddleware, getLogs);

export default router;

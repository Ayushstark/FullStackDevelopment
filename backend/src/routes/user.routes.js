import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { authMiddleware } from "../middleware/auth.js";
import { updateProfile } from "../controllers/user.controller.js";

const router = Router();

router.put("/profile", apiLimiter, authMiddleware, updateProfile);

export default router;

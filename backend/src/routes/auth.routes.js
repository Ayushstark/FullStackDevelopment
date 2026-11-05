import { Router } from "express";
import { authLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import { authMiddleware } from "../middleware/auth.js";
import { register, login, me, logout } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", apiLimiter, authMiddleware, me);
router.post("/logout", apiLimiter, logout);

export default router;

import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { getContests } from "../controllers/contest.controller.js";

const router = Router();

router.get("/contests", apiLimiter, getContests);

export default router;

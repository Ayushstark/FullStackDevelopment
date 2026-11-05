import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.js";
import {
  getCodeChef,
  getGfg,
  getLeetCode,
  getGitHub,
  getCodeforces,
  getDailyChallenge,
} from "../controllers/platform.controller.js";

const router = Router();

router.get("/daily-challenge", apiLimiter, getDailyChallenge);
router.get("/codechef/:handle", apiLimiter, getCodeChef);
router.get("/gfg/:handle", apiLimiter, getGfg);
router.get("/leetcode/:handle", apiLimiter, getLeetCode);
router.get("/github/:handle", apiLimiter, getGitHub);
router.get("/codeforces/:handle", apiLimiter, getCodeforces);

export default router;

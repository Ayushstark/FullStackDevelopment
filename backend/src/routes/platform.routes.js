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

// Platform handles are short usernames; reject anything else before calling a provider.
const HANDLE_PATTERN = /^[A-Za-z0-9_.-]{1,40}$/;
router.param("handle", (req, res, next, handle) => {
  if (!HANDLE_PATTERN.test(handle)) {
    return res.status(400).json({ success: false, error: "Invalid platform handle." });
  }
  return next();
});

router.get("/daily-challenge", apiLimiter, getDailyChallenge);
router.get("/codechef/:handle", apiLimiter, getCodeChef);
router.get("/gfg/:handle", apiLimiter, getGfg);
router.get("/leetcode/:handle", apiLimiter, getLeetCode);
router.get("/github/:handle", apiLimiter, getGitHub);
router.get("/codeforces/:handle", apiLimiter, getCodeforces);

export default router;

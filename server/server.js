import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { User } from "./models/User.js";
import { GrowthLog } from "./models/GrowthLog.js";
import { authMiddleware, JWT_SECRET } from "./middleware/auth.js";
import { fallbackStore } from "./fallbackStore.js";
import { getCodeChefProfile } from "./services/codechefService.js";
import { getGfgProfile } from "./services/gfgService.js";
import { getLeetCodeProfile } from "./services/leetcodeService.js";
import { getGitHubProfile } from "./services/githubService.js";
import { getAllRealContests } from "./services/contestService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/opportunity_os";

// Only allow the configured frontend origin in production. Vite's local origins
// are enabled for development, while non-browser clients can omit Origin.
const allowedOrigins = new Set(
  [process.env.CLIENT_ORIGINS, ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"])]
    .filter(Boolean)
    .flatMap((origins) => origins.split(",").map((origin) => origin.trim()).filter(Boolean)),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

let isMongoConnected = false;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
  })
  .then(() => {
    isMongoConnected = true;
    console.info(`[MongoDB] Connected successfully to Database (${MONGODB_URI})`);
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${MONGODB_URI}: ${err.message}`);
    console.warn("[MongoDB] Operating in resilient fallback mode so login, registration, and sessions work seamlessly.");
    console.warn("[MongoDB] To connect a live database, set MONGODB_URI in server/.env or connect MongoDB Atlas.");
  });

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    db: isMongoConnected ? "MongoDB Connected" : "Local Resilient Store (MongoDB offline)",
    timestamp: new Date().toISOString(),
  });
});

// ---------------- AUTH ROUTES ----------------

// Register
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, university, degree, gradYear } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    if (isMongoConnected) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        university: university || "National Institute of Technology",
        degree: degree || "B.Tech in Computer Science & Engineering",
        gradYear: gradYear || "2027",
      });

      const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({
        message: "Registration successful! Stored in MongoDB.",
        token,
        user: sanitizeUser(newUser),
      });
    } else {
      // Fallback local store
      const existing = fallbackStore.findUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = fallbackStore.createUser({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        university: university || "National Institute of Technology",
        degree: degree || "B.Tech in Computer Science & Engineering",
        gradYear: gradYear || "2027",
      });

      const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({
        message: "Registration successful!",
        token,
        user: sanitizeUser(newUser),
      });
    }
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

// Login
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = null;
    if (isMongoConnected) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = fallbackStore.findUserByEmail(normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful!",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

// Get Current User (Session verification)
app.get("/api/auth/me", apiLimiter, authMiddleware, async (req, res) => {
  try {
    let user = null;
    if (isMongoConnected) {
      user = await User.findById(req.user.id);
    } else {
      user = fallbackStore.findUserById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ error: "User session not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Auth me error:", err);
    res.status(500).json({ error: "Failed to verify session." });
  }
});

// Logout
app.post("/api/auth/logout", apiLimiter, (_req, res) => {
  res.json({ message: "Logged out successfully." });
});

// Update Profile
app.put("/api/user/profile", apiLimiter, authMiddleware, async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
    const updates = {};
    const stringFields = ["name", "email", "university", "degree", "gradYear", "resumeSummary"];

    for (const field of stringFields) {
      if (typeof body[field] === "string") updates[field] = body[field].trim();
    }

    for (const field of ["skills", "targetRoles"]) {
      if (Array.isArray(body[field]) && body[field].every((value) => typeof value === "string")) {
        updates[field] = body[field].map((value) => value.trim()).filter(Boolean);
      }
    }

    if (body.platformHandles && typeof body.platformHandles === "object" && !Array.isArray(body.platformHandles)) {
      const handles = {};
      for (const field of ["leetcode", "codeforces", "codechef", "geeksforgeeks", "gfg", "github"]) {
        if (typeof body.platformHandles[field] === "string") {
          handles[field] = body.platformHandles[field].trim();
        }
      }
      if (Object.keys(handles).length) updates.platformHandles = handles;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid profile fields were provided." });
    }

    let updatedUser = null;
    if (isMongoConnected) {
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true, strict: "throw" },
      );
    } else {
      updatedUser = fallbackStore.updateUserProfile(req.user.id, updates);
    }

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "Profile updated successfully.", user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// Record a new activity or problem log
app.post("/api/growth/log", apiLimiter, authMiddleware, async (req, res) => {
  try {
    const { platform, problemsSolved, notes } = req.body || {};

    const validPlatforms = ["LeetCode", "Codeforces", "CodeChef", "GitHub", "AtCoder", "HackerRank"];
    if (!platform || !validPlatforms.includes(platform)) {
      return res.status(400).json({ error: "Invalid or unsupported platform." });
    }

    const count = parseInt(problemsSolved, 10);
    if (isNaN(count) || count < 1) {
      return res.status(400).json({ error: "Problems or items count must be at least 1." });
    }

    const today = new Date().toISOString().split("T")[0];
    const logPayload = {
      userId: req.user.id,
      date: today,
      platform,
      problemsSolved: count,
      notes: typeof notes === "string" ? notes.trim() : "",
    };

    let savedLog = null;
    if (isMongoConnected) {
      savedLog = await GrowthLog.create(logPayload);
    } else {
      savedLog = fallbackStore.createGrowthLog(logPayload);
    }

    res.status(201).json({
      message: "Coding activity recorded successfully.",
      log: savedLog,
    });
  } catch (err) {
    console.error("Growth log error:", err);
    res.status(500).json({ error: "Failed to save coding activity log." });
  }
});

// Retrieve recent activity logs for current user
app.get("/api/growth/logs", apiLimiter, authMiddleware, async (req, res) => {
  try {
    let logs = [];
    if (isMongoConnected) {
      logs = await GrowthLog.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    } else {
      logs = fallbackStore.getGrowthLogs(req.user.id);
    }

    res.json({ logs });
  } catch (err) {
    console.error("Fetch growth logs error:", err);
    res.status(500).json({ error: "Failed to fetch activity logs." });
  }
});

// Real-time CodeChef profile retrieval endpoint
app.get("/api/platforms/codechef/:handle", apiLimiter, async (req, res) => {
  try {
    const { handle } = req.params;
    const forceRefresh = req.query.force === "true";
    const profileData = await getCodeChefProfile(handle, { forceRefresh });

    if (!profileData.success) {
      const isNotFound = profileData.error && profileData.error.toLowerCase().includes("not found");
      return res.status(isNotFound ? 404 : 400).json(profileData);
    }

    res.json(profileData);
  } catch (err) {
    console.error("CodeChef profile retrieval error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch CodeChef statistics." });
  }
});

// Real-time GeeksforGeeks profile retrieval endpoint
app.get("/api/platforms/gfg/:handle", apiLimiter, async (req, res) => {
  try {
    const { handle } = req.params;
    const forceRefresh = req.query.force === "true";
    const profileData = await getGfgProfile(handle, { forceRefresh });

    if (!profileData.success) {
      const isNotFound = profileData.error && profileData.error.toLowerCase().includes("not found");
      return res.status(isNotFound ? 404 : 400).json(profileData);
    }

    res.json(profileData);
  } catch (err) {
    console.error("GeeksforGeeks profile retrieval error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch GeeksforGeeks statistics." });
  }
});

// Real-time LeetCode profile retrieval endpoint
app.get("/api/platforms/leetcode/:handle", apiLimiter, async (req, res) => {
  try {
    const { handle } = req.params;
    const forceRefresh = req.query.force === "true";
    const profileData = await getLeetCodeProfile(handle, { forceRefresh });

    if (!profileData.success) {
      const isNotFound = profileData.error && profileData.error.toLowerCase().includes("not found");
      return res.status(isNotFound ? 404 : 400).json(profileData);
    }

    res.json(profileData);
  } catch (err) {
    console.error("LeetCode profile retrieval error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch LeetCode statistics." });
  }
});

// Real-time GitHub profile retrieval endpoint
app.get("/api/platforms/github/:handle", apiLimiter, async (req, res) => {
  try {
    const { handle } = req.params;
    const forceRefresh = req.query.force === "true";
    const profileData = await getGitHubProfile(handle, { forceRefresh });

    if (!profileData.success) {
      const isNotFound = profileData.error && profileData.error.toLowerCase().includes("not found");
      return res.status(isNotFound ? 404 : 400).json(profileData);
    }

    res.json(profileData);
  } catch (err) {
    console.error("GitHub profile retrieval error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch GitHub statistics." });
  }
});

// Live Multi-Platform Contests & Events endpoint
app.get("/api/contests", apiLimiter, async (req, res) => {
  try {
    const force = req.query.force === "true";
    const contests = await getAllRealContests({ force });
    res.json({
      success: true,
      count: contests.length,
      contests,
    });
  } catch (err) {
    console.error("Contest retrieval error:", err);
    res.status(500).json({ success: false, error: "Failed to retrieve real-time contests." });
  }
});

app.listen(PORT, () => {
  console.info(`[OpportunityOS Backend] Server listening on http://localhost:${PORT}`);
});


import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { getMongoStatus } from "../config/db.js";
import { User } from "../models/User.js";
import { fallbackStore } from "../store/fallbackStore.js";
import { sanitizeUser } from "../utils/sanitize.js";

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
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
    if (getMongoStatus()) {
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
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = null;
    if (getMongoStatus()) {
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
}

/**
 * GET /api/auth/me
 */
export async function me(req, res) {
  try {
    let user = null;
    if (getMongoStatus()) {
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
}

/**
 * POST /api/auth/logout
 */
export function logout(_req, res) {
  res.json({ message: "Logged out successfully." });
}

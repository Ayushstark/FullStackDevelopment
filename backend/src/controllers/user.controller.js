import { getMongoStatus } from "../config/db.js";
import { User } from "../models/User.js";
import { fallbackStore } from "../store/fallbackStore.js";
import { sanitizeUser } from "../utils/sanitize.js";




export async function updateProfile(req, res) {
  try {
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
    const updates = {};
    const stringLimits = { name: 80, email: 254, university: 120, degree: 120, gradYear: 4, resumeSummary: 1000 };

    for (const [field, maxLength] of Object.entries(stringLimits)) {
      if (typeof body[field] !== "string") continue;
      const value = body[field].trim();
      if (value.length > maxLength) {
        return res.status(400).json({ error: `${field} must be at most ${maxLength} characters.` });
      }
      updates[field] = value;
    }

    // A blank email would lock the user out, so treat it as "not changed".
    if (updates.email === "") delete updates.email;
    if (updates.name !== undefined && updates.name.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }
    if (updates.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (updates.gradYear && !/^\d{4}$/.test(updates.gradYear)) {
      return res.status(400).json({ error: "Graduation year must be a four-digit year." });
    }

    if (typeof body.profileImage === "string") {
      const isValidImage = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(body.profileImage);
      if (body.profileImage.length > 240_000 || (body.profileImage && !isValidImage)) {
        return res.status(400).json({ error: "Profile image must be a JPEG, PNG, or WebP under 170 KB." });
      }
      updates.profileImage = body.profileImage;
    }

    for (const field of ["skills", "targetRoles"]) {
      if (body[field] === undefined) continue;
      const isValidList = Array.isArray(body[field])
        && body[field].length <= 30
        && body[field].every((value) => typeof value === "string" && value.length <= 60);
      if (!isValidList) {
        return res.status(400).json({ error: `${field} must be a list of at most 30 short text items.` });
      }
      updates[field] = body[field].map((value) => value.trim()).filter(Boolean);
    }

    if (body.platformHandles && typeof body.platformHandles === "object" && !Array.isArray(body.platformHandles)) {
      const handles = {};
      for (const field of ["leetcode", "codeforces", "codechef", "geeksforgeeks", "gfg", "github"]) {
        if (typeof body.platformHandles[field] === "string") {
          const value = body.platformHandles[field].trim();
          if (value && !/^[A-Za-z0-9_.-]{1,40}$/.test(value)) {
            return res.status(400).json({ error: `Invalid ${field} handle.` });
          }
          handles[field] = value;
        }
      }
      if (Object.keys(handles).length) updates.platformHandles = handles;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid profile fields were provided." });
    }

    let updatedUser = null;
    if (getMongoStatus()) {
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
}

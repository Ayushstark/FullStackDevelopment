import { getAllRealContests } from "../services/contestService.js";

/**
 * GET /api/contests
 */
export async function getContests(req, res) {
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
}

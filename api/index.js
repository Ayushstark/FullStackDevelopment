import { connectDB } from "../backend/src/config/db.js";
import app from "../backend/src/app.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (_e) {
    // Proceed to fallback store
  }
  return app(req, res);
}

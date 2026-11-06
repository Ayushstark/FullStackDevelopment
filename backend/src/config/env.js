import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const PORT = process.env.PORT || 5000;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/opportunity_os";
export const NODE_ENV = process.env.NODE_ENV || "development";
if (!process.env.JWT_SECRET && NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production.");
}
export const JWT_SECRET = process.env.JWT_SECRET || "local-dev-only-secret";
export const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS || "";

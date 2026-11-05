import mongoose from "mongoose";
import { MONGODB_URI } from "./env.js";

let isMongoConnected = false;

/**
 * Returns the current MongoDB connection status.
 */
export function getMongoStatus() {
  return isMongoConnected;
}

/**
 * Attempts to connect to MongoDB. Falls back to resilient local mode on failure.
 */
export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.info(`[MongoDB] Connected successfully to Database (${MONGODB_URI})`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${MONGODB_URI}: ${err.message}`);
    console.warn("[MongoDB] Operating in resilient fallback mode so login, registration, and sessions work seamlessly.");
    console.warn("[MongoDB] To connect a live database, set MONGODB_URI in .env or connect MongoDB Atlas.");
  }
}

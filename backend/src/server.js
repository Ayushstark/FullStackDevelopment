import { PORT } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

// Connect to MongoDB (falls back to local resilient store on failure)
connectDB();

app.listen(PORT, () => {
  console.info(`[OpportunityOS Backend] Server listening on http://localhost:${PORT}`);
});

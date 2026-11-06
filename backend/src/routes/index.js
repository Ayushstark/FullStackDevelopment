import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import growthRoutes from "./growth.routes.js";
import platformRoutes from "./platform.routes.js";
import contestRoutes from "./contest.routes.js";
import healthRoutes from "./health.routes.js";
import opportunityRoutes from "./opportunity.routes.js";
import applicationRoutes from "./application.routes.js";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/user", userRoutes);
router.use("/api/growth", growthRoutes);
router.use("/api/platforms", platformRoutes);
router.use("/api", contestRoutes);
router.use("/api", opportunityRoutes);
router.use("/api", applicationRoutes);
router.use("/api", healthRoutes);

export default router;

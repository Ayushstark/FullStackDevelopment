import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/application.controller.js";

const router = Router();

router.use(optionalAuth);

router.get("/applications", getApplications);
router.post("/applications", createApplication);
router.patch("/applications/:id", updateApplication);
router.put("/applications/:id", updateApplication);
router.delete("/applications/:id", deleteApplication);

export default router;


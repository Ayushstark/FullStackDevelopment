import { Router } from "express";
import { getOpportunities, getOpportunityById } from "../controllers/opportunity.controller.js";

const router = Router();

router.get("/opportunities", getOpportunities);
router.get("/opportunities/:id", getOpportunityById);

export default router;


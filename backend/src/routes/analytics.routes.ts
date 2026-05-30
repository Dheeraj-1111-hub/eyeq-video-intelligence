import { Router } from "express";
import {
  getOverview,
  getProcessingMetrics,
  getSearchAnalytics,
  getInvestigationAnalytics,
} from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect all analytics routes with JWT authentication
router.use(requireAuth);

router.get("/overview", getOverview);
router.get("/processing", getProcessingMetrics);
router.get("/search", getSearchAnalytics);
router.get("/investigation", getInvestigationAnalytics);

export default router;

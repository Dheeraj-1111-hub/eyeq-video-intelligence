import { Router } from "express";
import { getMetrics, getStorageStats } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(requireAuth);
// Only admins can access these routes
router.use(requireRole(["admin"]));

router.get("/metrics", getMetrics);
router.get("/storage", getStorageStats);

export default router;

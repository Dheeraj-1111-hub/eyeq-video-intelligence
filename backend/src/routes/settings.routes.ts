import { Router } from "express";
import {
  getSettings,
  updateSettings,
  updateProfile,
  deleteStorage,
} from "../controllers/settings.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect all settings routes with JWT authentication
router.use(requireAuth);

router.get("/", getSettings);
router.put("/", updateSettings);
router.put("/profile", updateProfile);
router.delete("/storage/:type", deleteStorage);

export default router;

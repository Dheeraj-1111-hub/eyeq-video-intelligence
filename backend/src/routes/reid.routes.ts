import { Router } from "express";
import { trackSubject, createSubject } from "../controllers/reid.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect ReID routes
router.use(requireAuth);

router.post("/track", trackSubject);
router.post("/subjects", createSubject);

export default router;

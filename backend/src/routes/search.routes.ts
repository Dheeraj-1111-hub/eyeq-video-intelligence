import { Router } from "express";
import { searchDetections, getSearchMetadata } from "../controllers/search.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/metadata", requireAuth, getSearchMetadata);
router.post("/", requireAuth, searchDetections);

export default router;

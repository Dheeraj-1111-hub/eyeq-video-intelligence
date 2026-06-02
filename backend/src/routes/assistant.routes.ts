import { Router } from "express";
import { askAssistant } from "../controllers/assistant.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/ask", askAssistant);

export default router;

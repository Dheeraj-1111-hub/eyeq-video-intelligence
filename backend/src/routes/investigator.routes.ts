import { Router } from "express";
import { chatWithInvestigator } from "../controllers/investigator.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/chat", protect, chatWithInvestigator);

export default router;

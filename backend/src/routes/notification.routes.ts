import { Router } from "express";
import { getNotifications, markAsRead } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);

export default router;

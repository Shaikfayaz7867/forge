import { Router } from "express";
import { notificationsController } from "../controllers/notifications.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

// SSE stream — keep connection alive for real-time pushes
router.get("/notifications/stream", notificationsController.stream);

// REST endpoints
router.get("/notifications", notificationsController.list);
router.get("/notifications/quote", notificationsController.getQuote);
router.patch("/notifications/read-all", notificationsController.markAllRead);
router.patch("/notifications/:id/read", notificationsController.markRead);

export default router;

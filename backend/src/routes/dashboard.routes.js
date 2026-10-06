import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard", dashboardController.getSummary);
router.get("/dashboard/analytics", dashboardController.getAnalytics);
router.get("/dashboard/streak", dashboardController.getStreak);
router.get("/dashboard/achievements", dashboardController.getAchievements);

export default router;

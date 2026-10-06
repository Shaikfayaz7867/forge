import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";

const router = Router();

router.get("/health", healthController.health);
router.get("/health/ready", healthController.ready);
router.get("/health/live", healthController.live);

export default router;

import { Router } from "express";
import { foodController } from "../controllers/food.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// Public / User read-only routes
router.get("/foods", foodController.getFoods);
router.get("/foods/:id", foodController.getFoodById);

// Admin-only modification routes
router.post("/foods", authenticate, authorize("ADMIN"), foodController.createFood);
router.patch("/foods/:id", authenticate, authorize("ADMIN"), foodController.updateFood);
router.delete("/foods/:id", authenticate, authorize("ADMIN"), foodController.deleteFood);

export default router;

import { Router } from "express";
import { exerciseController } from "../controllers/exercise.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// Public / User read-only routes
router.get("/exercises", exerciseController.getExercises);
router.get("/exercises/:id", exerciseController.getExerciseById);

// Admin-only modification routes
router.post("/exercises", authenticate, authorize("ADMIN"), exerciseController.createExercise);
router.patch("/exercises/:id", authenticate, authorize("ADMIN"), exerciseController.updateExercise);
router.delete("/exercises/:id", authenticate, authorize("ADMIN"), exerciseController.deleteExercise);

export default router;

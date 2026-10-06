import { Router } from "express";
import { workoutController } from "../controllers/workout.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createPlanSchema, updatePlanSchema } from "../validators/workout.validator.js";

const router = Router();

router.use(authenticate);

// Workout Templates
router.get("/workout-templates", workoutController.getTemplates);

// Workout Plans
router.get("/workout-plans", workoutController.getPlans);
router.post("/workout-plans", validate({ body: createPlanSchema }), workoutController.createPlan);
router.get("/workout-plans/:id", workoutController.getPlanById);
router.put("/workout-plans/:id", validate({ body: updatePlanSchema }), workoutController.updatePlan);
router.patch("/workout-plans/:id", validate({ body: updatePlanSchema }), workoutController.updatePlan);
router.delete("/workout-plans/:id", workoutController.deletePlan);
router.post("/workout-plans/:id/duplicate", workoutController.duplicatePlan);

// Workout History
router.get("/workout-history", workoutController.getHistory);
router.get("/workout-history/:id", workoutController.getHistoryById);
router.delete("/workout-history/:id", workoutController.deleteHistory);

export default router;

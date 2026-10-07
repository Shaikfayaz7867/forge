import { Router } from "express";
import { nutritionController } from "../controllers/nutrition.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { addFoodEntriesSchema, updateFoodEntrySchema } from "../validators/nutrition.validator.js";

const router = Router();

router.use(authenticate);

router.get("/nutrition/logs", nutritionController.getFoodLogs);
router.get("/nutrition/rescue", nutritionController.getRescueOptions);
router.post("/nutrition/logs", validate({ body: addFoodEntriesSchema }), nutritionController.addFoodEntries);
router.get("/nutrition/logs/:id", nutritionController.getLogById);
router.patch("/nutrition/logs/:id", validate({ body: updateFoodEntrySchema }), nutritionController.updateFoodEntry);
router.delete("/nutrition/logs/:id", nutritionController.deleteFoodEntry);

export default router;

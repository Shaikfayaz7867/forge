import { Router } from "express";
import { profileController } from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { profileSchema, profilePatchSchema } from "../validators/profile.validator.js";
import { settingsSchema } from "../validators/settings.validator.js";

const router = Router();

router.use(authenticate);

router.get("/profile", profileController.getProfile);
router.put("/profile", validate({ body: profileSchema }), profileController.updateProfile);
router.patch("/profile", validate({ body: profilePatchSchema }), profileController.updateProfile);

router.get("/settings", profileController.getSettings);
router.put("/settings", validate({ body: settingsSchema }), profileController.updateSettings);

export default router;

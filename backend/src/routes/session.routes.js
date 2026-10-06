import { Router } from "express";
import { sessionController } from "../controllers/session.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { startSessionSchema, updateActiveSessionSchema } from "../validators/session.validator.js";

const router = Router();

router.use(authenticate);

router.get("/sessions/active", sessionController.getActiveSession);
router.post("/sessions", validate({ body: startSessionSchema }), sessionController.startSession);
router.patch("/sessions/active", validate({ body: updateActiveSessionSchema }), sessionController.updateActiveSession);
router.post("/sessions/active/complete", sessionController.finishSession);
router.post("/sessions/active/cancel", sessionController.cancelSession);

export default router;

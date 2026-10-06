import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter, refreshLimiter } from "../middleware/rate-limit.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, validate({ body: registerSchema }), authController.register);
router.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", authController.logout);

// Protected routes
router.use(authenticate);
router.post("/logout-all", authController.logoutAll);
router.get("/me", authController.me);

export default router;

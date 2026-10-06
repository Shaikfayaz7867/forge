import { Router } from "express";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import workoutRoutes from "./workout.routes.js";
import sessionRoutes from "./session.routes.js";
import nutritionRoutes from "./nutrition.routes.js";
import progressRoutes from "./progress.routes.js";
import exerciseRoutes from "./exercise.routes.js";
import foodRoutes from "./food.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import dataRoutes from "./data.routes.js";
import healthRoutes from "./health.routes.js";
import notificationsRoutes from "./notifications.routes.js";

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use(profileRoutes);
apiRouter.use(workoutRoutes);
apiRouter.use(sessionRoutes);
apiRouter.use(nutritionRoutes);
apiRouter.use(progressRoutes);
apiRouter.use(exerciseRoutes);
apiRouter.use(foodRoutes);
apiRouter.use(dashboardRoutes);
apiRouter.use(dataRoutes);
apiRouter.use(notificationsRoutes);

export default apiRouter;

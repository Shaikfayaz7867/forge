import { Router } from "express";
import { dataController } from "../controllers/data.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/data/export", dataController.exportData);
router.post("/data/import", dataController.importData);

export default router;

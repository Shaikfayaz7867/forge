import { Router } from "express";
import { progressController } from "../controllers/progress.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { uploadPhoto } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rate-limit.js";
import { addWeightSchema, addMeasurementSchema, addWaterSchema } from "../validators/progress.validator.js";

const router = Router();

router.use(authenticate);

// Weight
router.get("/weight", progressController.getWeight);
router.post("/weight", validate({ body: addWeightSchema }), progressController.addWeight);
router.patch("/weight/:id", validate({ body: addWeightSchema }), progressController.updateWeight);
router.delete("/weight/:id", progressController.deleteWeight);

// Measurements
router.get("/measurements", progressController.getMeasurements);
router.post("/measurements", validate({ body: addMeasurementSchema }), progressController.addMeasurement);
router.patch("/measurements/:id", validate({ body: addMeasurementSchema }), progressController.updateMeasurement);
router.delete("/measurements/:id", progressController.deleteMeasurement);

// Water
router.get("/water", progressController.getWater);
router.post("/water", validate({ body: addWaterSchema }), progressController.addWater);
router.put("/water/:date", progressController.setWaterDate);
router.delete("/water/:date", progressController.deleteWater);

// Progress Photos
router.get("/progress-photos", progressController.getPhotos);
router.post("/progress-photos", uploadLimiter, uploadPhoto.single("photo"), progressController.addPhoto);
router.get("/progress-photos/:id", progressController.getPhotoById);
router.delete("/progress-photos/:id", progressController.deletePhoto);

export default router;

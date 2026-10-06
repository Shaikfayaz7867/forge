import { progressService } from "../services/progress.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { paginated } from "../utils/response.js";
import { parsePagination } from "../utils/pagination.js";
import { ApiError } from "../utils/ApiError.js";

export const progressController = {
  // Weight
  getWeight: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { weights, total } = await progressService.getWeightHistory(req.user.id, pagination);
    return sendSuccess(res, paginated(weights, total, pagination.page, pagination.limit));
  }),

  addWeight: asyncHandler(async (req, res) => {
    const entry = await progressService.addWeight(req.user.id, req.body);
    return sendCreated(res, entry, "Weight logged");
  }),

  updateWeight: asyncHandler(async (req, res) => {
    const entry = await progressService.updateWeight(req.user.id, req.params.id, req.body);
    return sendSuccess(res, entry, "Weight entry updated");
  }),

  deleteWeight: asyncHandler(async (req, res) => {
    await progressService.deleteWeight(req.user.id, req.params.id);
    return sendSuccess(res, null, "Weight entry deleted");
  }),

  // Measurements
  getMeasurements: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { measurements, total } = await progressService.getMeasurementHistory(req.user.id, pagination);
    return sendSuccess(res, paginated(measurements, total, pagination.page, pagination.limit));
  }),

  addMeasurement: asyncHandler(async (req, res) => {
    const entry = await progressService.addMeasurement(req.user.id, req.body);
    return sendCreated(res, entry, "Body measurements logged");
  }),

  updateMeasurement: asyncHandler(async (req, res) => {
    const entry = await progressService.updateMeasurement(req.user.id, req.params.id, req.body);
    return sendSuccess(res, entry, "Measurement updated");
  }),

  deleteMeasurement: asyncHandler(async (req, res) => {
    await progressService.deleteMeasurement(req.user.id, req.params.id);
    return sendSuccess(res, null, "Measurement entry deleted");
  }),

  // Water
  getWater: asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const logs = await progressService.getWaterLogs(req.user.id, { from, to });
    return sendSuccess(res, logs);
  }),

  addWater: asyncHandler(async (req, res) => {
    const entry = await progressService.addWater(req.user.id, req.body);
    return sendCreated(res, entry, "Water intake logged");
  }),

  setWaterDate: asyncHandler(async (req, res) => {
    const entry = await progressService.setWaterDate(req.user.id, req.params.date, req.body.amountMl);
    return sendSuccess(res, entry, "Water log set for date");
  }),

  deleteWater: asyncHandler(async (req, res) => {
    await progressService.deleteWater(req.user.id, req.params.date);
    return sendSuccess(res, null, "Water log deleted");
  }),

  // Progress Photos
  getPhotos: asyncHandler(async (req, res) => {
    const { from, to, pose } = req.query;
    const photos = await progressService.getPhotos(req.user.id, { from, to, pose });
    return sendSuccess(res, photos);
  }),

  addPhoto: asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest("Photo file is required", "FILE_MISSING");
    }
    const relativePath = `uploads/${req.file.filename}`;
    const photo = await progressService.addPhoto(req.user.id, {
      date: req.body.date || new Date().toISOString().split("T")[0],
      pose: req.body.pose || "front",
      filePath: relativePath,
    });
    return sendCreated(res, photo, "Progress photo uploaded");
  }),

  getPhotoById: asyncHandler(async (req, res) => {
    const photo = await progressService.getPhotoById(req.user.id, req.params.id);
    return sendSuccess(res, photo);
  }),

  deletePhoto: asyncHandler(async (req, res) => {
    await progressService.deletePhoto(req.user.id, req.params.id);
    return sendSuccess(res, null, "Progress photo deleted");
  }),
};

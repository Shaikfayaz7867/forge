import { nutritionService } from "../services/nutrition.service.js";
import { rescueService } from "../services/rescue.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

export const nutritionController = {
  getFoodLogs: asyncHandler(async (req, res) => {
    const { date, from, to } = req.query;
    if (date) {
      const summary = await nutritionService.getDailyMacros(req.user.id, date);
      return sendSuccess(res, summary);
    }
    const logs = await nutritionService.listEntries(req.user.id, { from, to });
    return sendSuccess(res, logs);
  }),

  getRescueOptions: asyncHandler(async (req, res) => {
    const { craving, remainingCalories, remainingProtein, remainingCarbs, remainingFat } = req.query;
    const result = await rescueService.getRescueOptions({
      craving: craving || "sweet",
      remainingCalories,
      remainingProtein,
      remainingCarbs,
      remainingFat,
    });
    return sendSuccess(res, result);
  }),

  getLogById: asyncHandler(async (req, res) => {
    const entry = await nutritionService.getEntry(req.user.id, req.params.id);
    return sendSuccess(res, entry);
  }),

  addFoodEntries: asyncHandler(async (req, res) => {
    const rawBody = req.body.entries || req.body;
    const entries = Array.isArray(rawBody) ? rawBody : [rawBody];
    const created = await nutritionService.addEntries(req.user.id, entries);
    return sendCreated(res, created, "Food log entries added");
  }),

  updateFoodEntry: asyncHandler(async (req, res) => {
    const updated = await nutritionService.updateEntry(req.user.id, req.params.id, req.body);
    return sendSuccess(res, updated, "Food log entry updated");
  }),

  deleteFoodEntry: asyncHandler(async (req, res) => {
    await nutritionService.deleteEntry(req.user.id, req.params.id);
    return sendSuccess(res, null, "Food log entry deleted");
  }),
};

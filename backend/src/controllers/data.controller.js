import { dataService } from "../services/data.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const dataController = {
  exportData: asyncHandler(async (req, res) => {
    const data = await dataService.exportUserData(req.user.id);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="forge-export-${Date.now()}.json"`);
    return res.json(data);
  }),

  importData: asyncHandler(async (req, res) => {
    const result = await dataService.importUserData(req.user.id, req.body);
    return sendSuccess(res, result, "Data imported successfully");
  }),
};

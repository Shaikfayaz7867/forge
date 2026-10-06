import { dashboardService } from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const dashboardController = {
  getSummary: asyncHandler(async (req, res) => {
    const summary = await dashboardService.getDashboardSummary(req.user.id);
    return sendSuccess(res, summary);
  }),

  getAnalytics: asyncHandler(async (req, res) => {
    const { period = "30d" } = req.query;
    const analytics = await dashboardService.getAnalyticsOverview(req.user.id, period);
    return sendSuccess(res, analytics);
  }),

  getStreak: asyncHandler(async (req, res) => {
    const streak = await dashboardService.getStreak(req.user.id);
    return sendSuccess(res, streak);
  }),

  getAchievements: asyncHandler(async (req, res) => {
    const achievements = await dashboardService.getAchievements(req.user.id);
    return sendSuccess(res, achievements);
  }),
};

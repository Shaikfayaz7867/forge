import { workoutService } from "../services/workout.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { paginated } from "../utils/response.js";
import { parsePagination } from "../utils/pagination.js";

export const workoutController = {
  // Workout Plans
  getTemplates: asyncHandler(async (req, res) => {
    const templates = await workoutService.getTemplates();
    return sendSuccess(res, templates);
  }),

  getPlans: asyncHandler(async (req, res) => {
    const plans = await workoutService.getPlans(req.user.id);
    return sendSuccess(res, plans);
  }),

  getPlanById: asyncHandler(async (req, res) => {
    const plan = await workoutService.getPlanById(req.user.id, req.params.id);
    return sendSuccess(res, plan);
  }),

  createPlan: asyncHandler(async (req, res) => {
    const plan = await workoutService.createPlan(req.user.id, req.body);
    return sendCreated(res, plan, "Workout plan created");
  }),

  updatePlan: asyncHandler(async (req, res) => {
    const plan = await workoutService.updatePlan(req.user.id, req.params.id, req.body);
    return sendSuccess(res, plan, "Workout plan updated");
  }),

  deletePlan: asyncHandler(async (req, res) => {
    await workoutService.deletePlan(req.user.id, req.params.id);
    return sendSuccess(res, null, "Workout plan deleted");
  }),

  duplicatePlan: asyncHandler(async (req, res) => {
    const copy = await workoutService.duplicatePlan(req.user.id, req.params.id);
    return sendCreated(res, copy, "Workout plan duplicated");
  }),

  // Workout History
  getHistory: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { sessions, total } = await workoutService.getHistory(req.user.id, pagination);
    return sendSuccess(res, paginated(sessions, total, pagination.page, pagination.limit));
  }),

  getHistoryById: asyncHandler(async (req, res) => {
    const session = await workoutService.getSessionById(req.user.id, req.params.id);
    return sendSuccess(res, session);
  }),

  deleteHistory: asyncHandler(async (req, res) => {
    await workoutService.deleteSession(req.user.id, req.params.id);
    return sendSuccess(res, null, "Workout session deleted");
  }),
};

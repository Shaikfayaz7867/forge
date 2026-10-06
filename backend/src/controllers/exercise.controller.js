import { exerciseService } from "../services/exercise.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { paginated } from "../utils/response.js";
import { parsePagination } from "../utils/pagination.js";

export const exerciseController = {
  getExercises: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { search, muscleGroup, equipment, difficulty } = req.query;

    const { items, total } = await exerciseService.getExercises({
      search,
      muscleGroup,
      equipment,
      difficulty,
      limit: pagination.limit,
      offset: pagination.skip,
    });

    return sendSuccess(res, paginated(items, total, pagination.page, pagination.limit));
  }),

  getExerciseById: asyncHandler(async (req, res) => {
    const exercise = await exerciseService.getExerciseById(req.params.id);
    return sendSuccess(res, exercise);
  }),

  createExercise: asyncHandler(async (req, res) => {
    const exercise = await exerciseService.createExercise(req.body);
    return sendCreated(res, exercise, "Exercise created");
  }),

  updateExercise: asyncHandler(async (req, res) => {
    const exercise = await exerciseService.updateExercise(req.params.id, req.body);
    return sendSuccess(res, exercise, "Exercise updated");
  }),

  deleteExercise: asyncHandler(async (req, res) => {
    await exerciseService.deleteExercise(req.params.id);
    return sendSuccess(res, null, "Exercise deleted");
  }),
};

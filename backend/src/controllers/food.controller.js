import { foodService } from "../services/food.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { paginated } from "../utils/response.js";
import { parsePagination } from "../utils/pagination.js";

export const foodController = {
  getFoods: asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const { search, category, meal } = req.query;

    const { items, total } = await foodService.getFoods({
      search,
      category,
      meal,
      limit: pagination.limit,
      offset: pagination.skip,
    });

    return sendSuccess(res, paginated(items, total, pagination.page, pagination.limit));
  }),

  getFoodById: asyncHandler(async (req, res) => {
    const food = await foodService.getFoodById(req.params.id);
    return sendSuccess(res, food);
  }),

  createFood: asyncHandler(async (req, res) => {
    const food = await foodService.createFood(req.body);
    return sendCreated(res, food, "Food item created");
  }),

  updateFood: asyncHandler(async (req, res) => {
    const food = await foodService.updateFood(req.params.id, req.body);
    return sendSuccess(res, food, "Food item updated");
  }),

  deleteFood: asyncHandler(async (req, res) => {
    await foodService.deleteFood(req.params.id);
    return sendSuccess(res, null, "Food item deleted");
  }),
};

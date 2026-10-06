import { foodRepository } from "../repositories/food.repository.js";
import { ApiError } from "../utils/ApiError.js";

export const foodService = {
  async getFoods(params) {
    return foodRepository.findMany(params);
  },

  async getFoodById(id) {
    const food = await foodRepository.findById(id);
    if (!food) {
      throw ApiError.notFound(`Food with ID '${id}' not found`, "FOOD_NOT_FOUND");
    }
    return food;
  },

  async createFood({ servingOptions, ...foodData }) {
    const existing = await foodRepository.findById(foodData.id);
    if (existing) {
      throw ApiError.conflict(`Food with ID '${foodData.id}' already exists`, "FOOD_EXISTS");
    }
    return foodRepository.create(foodData, servingOptions);
  },

  async updateFood(id, { servingOptions, ...foodData }) {
    await this.getFoodById(id);
    return foodRepository.update(id, foodData, servingOptions);
  },

  async deleteFood(id) {
    await this.getFoodById(id);
    return foodRepository.delete(id);
  },
};

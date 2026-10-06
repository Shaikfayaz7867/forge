import { nutritionRepository, foodRepository } from "../repositories/nutrition.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination } from "../utils/pagination.js";

function entryToApi(entry) {
  return {
    id: entry.id,
    date: entry.date,
    time: entry.time,
    meal: entry.meal,
    foodId: entry.foodId,
    foodName: entry.foodName,
    servingLabel: entry.servingLabel,
    servingGrams: Number(entry.servingGrams),
    quantity: Number(entry.quantity),
    calories: Number(entry.calories),
    protein: Number(entry.protein),
    carbs: Number(entry.carbs),
    fat: Number(entry.fat),
  };
}

function foodToApi(food) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    cuisine: food.cuisine,
    meals: food.meals,
    aliases: food.aliases,
    servingOptions: food.servingOptions.map((s) => ({
      id: s.id,
      label: s.label,
      grams: Number(s.grams),
      calories: Number(s.calories),
      protein: Number(s.protein),
      carbs: Number(s.carbs),
      fat: Number(s.fat),
    })),
  };
}

export const nutritionService = {
  async listEntries(userId, query) {
    const { page, limit, skip } = parsePagination(query);
    const { entries, total } = await nutritionRepository.findEntries(userId, {
      skip,
      limit,
      date: query.date,
      from: query.from,
      to: query.to,
      meal: query.meal,
    });
    return {
      items: entries.map(entryToApi),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async getEntry(userId, id) {
    const entry = await nutritionRepository.findById(id, userId);
    if (!entry) throw ApiError.notFound("Food log entry not found");
    return entryToApi(entry);
  },

  async addEntries(userId, entries) {
    const created = await nutritionRepository.createMany(userId, entries);
    return created.map(entryToApi);
  },

  async updateEntry(userId, id, data) {
    const updated = await nutritionRepository.update(id, userId, data);
    if (!updated) throw ApiError.notFound("Food log entry not found");
    return entryToApi(updated);
  },

  async deleteEntry(userId, id) {
    const deleted = await nutritionRepository.delete(id, userId);
    if (!deleted) throw ApiError.notFound("Food log entry not found");
  },

  async getDailyMacros(userId, date) {
    return nutritionRepository.dailyMacros(userId, date);
  },
};

export const foodService = {
  async list(query) {
    const { page, limit, skip } = parsePagination(query);
    const { foods, total } = await foodRepository.findAll({
      skip,
      limit,
      query: query.q,
      category: query.category,
    });
    return {
      items: foods.map(foodToApi),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async get(id) {
    const food = await foodRepository.findById(id);
    if (!food) throw ApiError.notFound("Food not found");
    return foodToApi(food);
  },
};

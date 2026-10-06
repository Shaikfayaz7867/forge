import { exerciseRepository } from "../repositories/exercise.repository.js";
import { ApiError } from "../utils/ApiError.js";

function exerciseToApi(row) {
  if (!row) return null;
  return {
    ...row,
    image: row.imageKey, // Map imageKey back to image for the frontend
  };
}

export const exerciseService = {
  async getExercises(params) {
    const { items, total } = await exerciseRepository.findMany(params);
    return { items: items.map(exerciseToApi), total };
  },

  async getExerciseById(id) {
    const exercise = await exerciseRepository.findById(id);
    if (!exercise) {
      throw ApiError.notFound(`Exercise with ID '${id}' not found`, "EXERCISE_NOT_FOUND");
    }
    return exerciseToApi(exercise);
  },

  async createExercise(data) {
    const existing = await exerciseRepository.findById(data.id);
    if (existing) {
      throw ApiError.conflict(`Exercise with ID '${data.id}' already exists`, "EXERCISE_EXISTS");
    }
    return exerciseToApi(await exerciseRepository.create(data));
  },

  async updateExercise(id, data) {
    await this.getExerciseById(id); // Ensure it exists
    return exerciseToApi(await exerciseRepository.update(id, data));
  },

  async deleteExercise(id) {
    await this.getExerciseById(id);
    return exerciseToApi(await exerciseRepository.delete(id));
  },
};

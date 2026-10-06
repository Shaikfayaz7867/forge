import { workoutRepository } from "../repositories/workout.repository.js";
import { ApiError } from "../utils/ApiError.js";

/** Convert a DB plan row to the frontend WorkoutPlan shape. */
function templateToApi(tpl) {
  return {
    id: tpl.id,
    name: tpl.name,
    category: tpl.category,
    description: tpl.description,
    scheduledDays: tpl.scheduledDays,
    exercises: tpl.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets,
      repMin: e.repMin,
      repMax: e.repMax,
      targetWeight: e.targetWeight !== null ? Number(e.targetWeight) : null,
      restSec: e.restSec,
    }))
  };
}

function planToApi(plan) {
  return {
    id: plan.id,
    name: plan.name,
    category: plan.category,
    exercises: plan.plannedExercises.map((e) => ({
      id: e.id,
      exerciseId: e.exerciseId,
      sets: e.sets,
      repMin: e.repMin,
      repMax: e.repMax,
      targetWeight: e.targetWeight !== null ? Number(e.targetWeight) : null,
      restSec: e.restSec,
      notes: e.notes,
    })),
    notes: plan.notes,
    scheduledDays: plan.scheduledDays,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export const workoutService = {
  async getTemplates() {
    const templates = await workoutRepository.getTemplates();
    return templates.map(templateToApi);
  },

  async getPlans(userId) {
    const { plans } = await workoutRepository.findAll(userId, { skip: 0, limit: 1000 });
    return plans.map(planToApi);
  },

  async getPlanById(userId, id) {
    const plan = await workoutRepository.findById(id, userId);
    if (!plan) throw ApiError.notFound("Workout plan not found");
    return planToApi(plan);
  },

  async createPlan(userId, data) {
    const plan = await workoutRepository.create(userId, data);
    return planToApi(plan);
  },

  async updatePlan(userId, id, data) {
    const existing = await workoutRepository.findById(id, userId);
    if (!existing) throw ApiError.notFound("Workout plan not found");
    const updated = await workoutRepository.update(id, userId, data);
    return planToApi(updated);
  },

  async deletePlan(userId, id) {
    const result = await workoutRepository.delete(id, userId);
    if (!result) throw ApiError.notFound("Workout plan not found");
  },

  async duplicatePlan(userId, id) {
    const src = await workoutRepository.findById(id, userId);
    if (!src) throw ApiError.notFound("Workout plan not found");
    const copy = await workoutRepository.create(userId, {
      name: `${src.name} (copy)`,
      category: src.category,
      notes: src.notes,
      scheduledDays: src.scheduledDays,
      exercises: src.plannedExercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        repMin: e.repMin,
        repMax: e.repMax,
        targetWeight: e.targetWeight !== null ? Number(e.targetWeight) : null,
        restSec: e.restSec,
        notes: e.notes,
      })),
    });
    return planToApi(copy);
  },

  async getHistory(userId, { skip, limit }) {
    const { sessions, total } = await workoutRepository.findHistory(userId, { skip, limit });
    return { sessions, total };
  },

  async getSessionById(userId, id) {
    const session = await workoutRepository.findSessionById(id, userId);
    if (!session) throw ApiError.notFound("Workout session not found");
    return session;
  },

  async deleteSession(userId, id) {
    const result = await workoutRepository.deleteSession(id, userId);
    if (!result) throw ApiError.notFound("Workout session not found");
  }
};

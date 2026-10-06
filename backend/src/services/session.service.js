import { sessionRepository } from "../repositories/session.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination } from "../utils/pagination.js";
import { notificationsService } from "./notifications.service.js";


/** Convert a DB session to the frontend WorkoutSession shape. */
function sessionToApi(session) {
  return {
    id: session.id,
    planId: session.planId,
    name: session.name,
    category: session.category,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    durationSec: session.durationSec,
    exercises: session.exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      notes: ex.notes,
      restSec: ex.restSec,
      sets: ex.sets.map((s) => ({
        id: s.id,
        weight: Number(s.weight),
        reps: s.reps,
        completed: s.completed,
      })),
    })),
    notes: session.notes,
  };
}

/** Convert active session DB row to frontend ActiveSession shape. */
function activeToApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    planId: row.planId,
    name: row.name,
    category: row.category,
    startedAt: row.startedAt.toISOString(),
    notes: row.notes,
    currentExerciseIndex: row.currentExerciseIndex,
    exercises: Array.isArray(row.exercisesJson) ? row.exercisesJson : [],
  };
}

export const sessionService = {
  async getActive(userId) {
    const session = await sessionRepository.findActive(userId);
    return activeToApi(session);
  },

  async start(userId, data) {
    const sessionData = {
      planId: data.planId ?? null,
      name: data.name ?? "Quick Workout",
      category: data.category ?? "custom",
      startedAt: new Date(),
      notes: "",
      currentExerciseIndex: 0,
      exercisesJson: data.exercises ?? [],
    };
    const session = await sessionRepository.upsertActive(userId, sessionData);
    return activeToApi(session);
  },

  async updateActive(userId, data) {
    const existing = await sessionRepository.findActive(userId);
    if (!existing) throw ApiError.notFound("No active session found");

    const updated = await sessionRepository.upsertActive(userId, {
      planId: existing.planId,
      name: data.name ?? existing.name,
      category: existing.category,
      startedAt: existing.startedAt,
      notes: data.notes ?? existing.notes,
      currentExerciseIndex: data.currentExerciseIndex ?? existing.currentExerciseIndex,
      exercisesJson: data.exercises ?? existing.exercisesJson,
    });
    return activeToApi(updated);
  },

  async complete(userId) {
    const active = await sessionRepository.findActive(userId);
    if (!active) throw ApiError.notFound("No active session found");

    const exercises = Array.isArray(active.exercisesJson) ? active.exercisesJson : [];
    // Filter to only completed sets
    const completedExercises = exercises
      .map((ex) => ({ ...ex, sets: ex.sets.filter((s) => s.completed) }))
      .filter((ex) => ex.sets.length > 0);

    if (completedExercises.length === 0) {
      throw ApiError.badRequest("No completed sets to save", "NO_COMPLETED_SETS");
    }

    const endedAt = new Date();
    const durationSec = Math.max(
      60,
      Math.round((endedAt.getTime() - active.startedAt.getTime()) / 1000)
    );

    const session = await sessionRepository.completeSession(userId, {
      id: active.id,
      planId: active.planId,
      name: active.name,
      category: active.category,
      startedAt: active.startedAt,
      endedAt,
      durationSec,
      notes: active.notes,
      exercises: completedExercises,
    });

    // Push real-time workout completion event
    const totalSets = completedExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    notificationsService.pushToUser(userId, "workout_complete", {
      sessionId: session.id,
      name: active.name,
      durationSec,
      exerciseCount: completedExercises.length,
      totalSets,
    });

    // Push motivational notification (non-blocking)
    const durationMin = Math.round(durationSec / 60);
    notificationsService
      .notify(userId, {
        title: "🏋️ Workout Complete!",
        message: `${active.name} done in ${durationMin} minutes. ${completedExercises.length} exercises, ${totalSets} sets. Keep it up!`,
        type: "success",
        actionUrl: `/history`,
      })
      .catch(() => {});

    return sessionToApi(session);
  },

  async cancel(userId) {
    await sessionRepository.deleteActive(userId);
  },

  async listHistory(userId, query) {
    const { page, limit, skip } = parsePagination(query);
    const { sessions, total } = await sessionRepository.findHistory(userId, {
      skip,
      limit,
      from: query.from,
      to: query.to,
      exerciseId: query.exerciseId,
      category: query.category,
    });
    return {
      items: sessions.map(sessionToApi),
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

  async getHistory(userId, id) {
    const session = await sessionRepository.findHistoryById(id, userId);
    if (!session) throw ApiError.notFound("Workout session not found");
    return sessionToApi(session);
  },

  async deleteHistory(userId, id) {
    const result = await sessionRepository.deleteHistoryEntry(id, userId);
    if (!result) throw ApiError.notFound("Workout session not found");
  },

  /** Get all history as raw DB format for analytics. */
  async getAllHistory(userId) {
    return sessionRepository.findAllHistory(userId);
  },
};

import prisma from "../config/database.js";

export const sessionRepository = {
  /** Get active (in-progress) session for a user. */
  async findActive(userId) {
    return prisma.activeSession.findUnique({ where: { userId } });
  },

  /** Create or replace an active session (one per user). */
  async upsertActive(userId, data) {
    return prisma.activeSession.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  /** Delete the active session for a user. */
  async deleteActive(userId) {
    return prisma.activeSession.deleteMany({ where: { userId } });
  },

  /**
   * Complete a session: move from active_sessions to workout_sessions.
   * Uses a transaction to guarantee atomicity.
   */
  async completeSession(userId, sessionData) {
    return prisma.$transaction(async (tx) => {
      // Remove active session
      await tx.activeSession.deleteMany({ where: { userId } });

      // Create the completed session record
      const { exercises, ...rest } = sessionData;
      const session = await tx.workoutSession.create({
        data: {
          ...rest,
          userId,
          exercises: {
            create: exercises.map((ex, i) => ({
              exerciseId: ex.exerciseId,
              sortOrder: i,
              notes: ex.notes ?? "",
              restSec: ex.restSec ?? 90,
              sets: {
                create: ex.sets.map((s, j) => ({
                  weight: s.weight,
                  reps: s.reps,
                  completed: s.completed ?? true,
                  sortOrder: j,
                })),
              },
            })),
          },
        },
        include: {
          exercises: {
            include: { sets: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      return session;
    });
  },

  /** Fetch paginated workout history for a user. */
  async findHistory(userId, { skip, limit, from, to, exerciseId, category }) {
    const where = {
      userId,
      ...(from && to && { startedAt: { gte: new Date(from), lte: new Date(to + "T23:59:59Z") } }),
      ...(from && !to && { startedAt: { gte: new Date(from) } }),
      ...(category && { category }),
    };

    // If filtering by exerciseId, filter at exercise level
    if (exerciseId) {
      where.exercises = { some: { exerciseId } };
    }

    const [sessions, total] = await prisma.$transaction([
      prisma.workoutSession.findMany({
        where,
        include: {
          exercises: {
            include: { sets: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workoutSession.count({ where }),
    ]);

    return { sessions, total };
  },

  async findHistoryById(id, userId) {
    return prisma.workoutSession.findFirst({
      where: { id, userId },
      include: {
        exercises: {
          include: { sets: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  },

  async deleteHistoryEntry(id, userId) {
    const session = await prisma.workoutSession.findFirst({ where: { id, userId } });
    if (!session) return null;
    return prisma.workoutSession.delete({ where: { id } });
  },

  /** Fetch ALL sessions for analytics (no pagination). */
  async findAllHistory(userId, { from } = {}) {
    return prisma.workoutSession.findMany({
      where: {
        userId,
        ...(from && { startedAt: { gte: new Date(from) } }),
      },
      include: {
        exercises: {
          include: { sets: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { startedAt: "asc" },
    });
  },
};

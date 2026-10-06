import prisma from "../config/database.js";

export const workoutRepository = {
  async getTemplates() {
    return prisma.workoutTemplate.findMany({
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findAll(userId, { skip, limit }) {
    const [plans, total] = await prisma.$transaction([
      prisma.workoutPlan.findMany({
        where: { userId },
        include: { plannedExercises: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workoutPlan.count({ where: { userId } }),
    ]);
    return { plans, total };
  },

  async findById(id, userId) {
    return prisma.workoutPlan.findFirst({
      where: { id, userId },
      include: { plannedExercises: { orderBy: { sortOrder: "asc" } } },
    });
  },

  async create(userId, data) {
    const { exercises, ...rest } = data;
    return prisma.workoutPlan.create({
      data: {
        userId,
        ...rest,
        plannedExercises: {
          create: exercises.map((e, i) => ({ ...e, sortOrder: i })),
        },
      },
      include: { plannedExercises: { orderBy: { sortOrder: "asc" } } },
    });
  },

  async update(id, userId, data) {
    const { exercises, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      if (exercises !== undefined) {
        await tx.plannedExercise.deleteMany({ where: { planId: id } });
      }
      return tx.workoutPlan.update({
        where: { id },
        data: {
          ...rest,
          ...(exercises !== undefined && {
            plannedExercises: {
              create: exercises.map((e, i) => ({ ...e, sortOrder: i })),
            },
          }),
        },
        include: { plannedExercises: { orderBy: { sortOrder: "asc" } } },
      });
    });
  },

  async delete(id, userId) {
    // Verify ownership before delete
    const plan = await prisma.workoutPlan.findFirst({ where: { id, userId } });
    if (!plan) return null;
    return prisma.workoutPlan.delete({ where: { id } });
  },

  async findHistory(userId, { skip, limit }) {
    const [sessions, total] = await prisma.$transaction([
      prisma.workoutSession.findMany({
        where: { userId },
        include: { exercises: { orderBy: { sortOrder: "asc" } } },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workoutSession.count({ where: { userId } }),
    ]);
    return { sessions, total };
  },

  async findSessionById(id, userId) {
    return prisma.workoutSession.findFirst({
      where: { id, userId },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });
  },

  async deleteSession(id, userId) {
    const session = await prisma.workoutSession.findFirst({ where: { id, userId } });
    if (!session) return null;
    return prisma.workoutSession.delete({ where: { id } });
  }
};

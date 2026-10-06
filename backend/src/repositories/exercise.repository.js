import prisma from "../config/database.js";

export const exerciseRepository = {
  async findMany({ search, muscleGroup, equipment, difficulty, limit = 50, offset = 0 }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }
    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }
    if (equipment) {
      where.equipment = equipment;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [items, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      }),
      prisma.exercise.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id) {
    return prisma.exercise.findUnique({
      where: { id },
    });
  },

  async create(data) {
    return prisma.exercise.create({ data });
  },

  async update(id, data) {
    return prisma.exercise.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return prisma.exercise.delete({
      where: { id },
    });
  },

  async upsertMany(exercises) {
    const operations = exercises.map((e) =>
      prisma.exercise.upsert({
        where: { id: e.id },
        update: {
          name: e.name,
          muscleGroup: e.muscleGroup,
          secondaryMuscles: e.secondaryMuscles || [],
          equipment: e.equipment,
          difficulty: e.difficulty,
          instructions: e.instructions || [],
          tips: e.tips || [],
          image: e.image,
          bodyweight: e.bodyweight || false,
        },
        create: {
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
          secondaryMuscles: e.secondaryMuscles || [],
          equipment: e.equipment,
          difficulty: e.difficulty,
          instructions: e.instructions || [],
          tips: e.tips || [],
          image: e.image,
          bodyweight: e.bodyweight || false,
        },
      })
    );
    return prisma.$transaction(operations);
  },
};

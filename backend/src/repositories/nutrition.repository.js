import prisma from "../config/database.js";

export const nutritionRepository = {
  async findEntries(userId, { skip, limit, date, from, to, meal }) {
    const where = {
      userId,
      ...(date && { date }),
      ...(from && to && { date: { gte: from, lte: to } }),
      ...(from && !to && { date: { gte: from } }),
      ...(meal && { meal }),
    };

    const [entries, total] = await prisma.$transaction([
      prisma.foodLogEntry.findMany({
        where,
        orderBy: [{ date: "desc" }, { time: "asc" }],
        skip,
        take: limit,
        include: { food: { select: { id: true, name: true, category: true } } },
      }),
      prisma.foodLogEntry.count({ where }),
    ]);

    return { entries, total };
  },

  async findById(id, userId) {
    return prisma.foodLogEntry.findFirst({
      where: { id, userId },
      include: { food: { select: { id: true, name: true } } },
    });
  },

  async createMany(userId, entries) {
    return prisma.$transaction(
      entries.map((e) =>
        prisma.foodLogEntry.create({
          data: { userId, ...e },
          include: { food: { select: { id: true, name: true, category: true } } },
        })
      )
    );
  },

  async update(id, userId, data) {
    const entry = await prisma.foodLogEntry.findFirst({ where: { id, userId } });
    if (!entry) return null;
    return prisma.foodLogEntry.update({ where: { id }, data });
  },

  async delete(id, userId) {
    const entry = await prisma.foodLogEntry.findFirst({ where: { id, userId } });
    if (!entry) return null;
    return prisma.foodLogEntry.delete({ where: { id } });
  },

  /** Aggregate daily macros for a date. */
  async dailyMacros(userId, date) {
    const result = await prisma.foodLogEntry.aggregate({
      where: { userId, date },
      _sum: { calories: true, protein: true, carbs: true, fat: true },
      _count: true,
    });
    return {
      calories: Number(result._sum.calories ?? 0),
      protein: Number(result._sum.protein ?? 0),
      carbs: Number(result._sum.carbs ?? 0),
      fat: Number(result._sum.fat ?? 0),
      count: result._count,
    };
  },
};

export const foodRepository = {
  async findAll({ skip, limit, query, category }) {
    const where = {
      isActive: true,
      ...(category && { category }),
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { aliases: { has: query } },
        ],
      }),
    };

    const [foods, total] = await prisma.$transaction([
      prisma.food.findMany({
        where,
        include: { servingOptions: { orderBy: { sortOrder: "asc" } } },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.food.count({ where }),
    ]);

    return { foods, total };
  },

  async findById(id) {
    return prisma.food.findUnique({
      where: { id },
      include: { servingOptions: { orderBy: { sortOrder: "asc" } } },
    });
  },
};

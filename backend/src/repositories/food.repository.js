import prisma from "../config/database.js";

export const foodRepository = {
  async findMany({ search, category, meal, limit = 50, offset = 0 }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cuisine: { contains: search, mode: "insensitive" } },
        { aliases: { has: search.toLowerCase() } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (meal) {
      where.meals = { has: meal };
    }

    const [items, total] = await Promise.all([
      prisma.food.findMany({
        where,
        take: limit,
        skip: offset,
        include: { servingOptions: true },
        orderBy: { name: "asc" },
      }),
      prisma.food.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id) {
    return prisma.food.findUnique({
      where: { id },
      include: { servingOptions: true },
    });
  },

  async create(foodData, servingOptions = []) {
    return prisma.food.create({
      data: {
        ...foodData,
        servingOptions: {
          create: servingOptions,
        },
      },
      include: { servingOptions: true },
    });
  },

  async update(id, foodData, servingOptions) {
    return prisma.$transaction(async (tx) => {
      if (servingOptions) {
        await tx.foodServingOption.deleteMany({ where: { foodId: id } });
      }

      return tx.food.update({
        where: { id },
        data: {
          ...foodData,
          ...(servingOptions && {
            servingOptions: {
              create: servingOptions,
            },
          }),
        },
        include: { servingOptions: true },
      });
    });
  },

  async delete(id) {
    return prisma.food.delete({
      where: { id },
    });
  },
};

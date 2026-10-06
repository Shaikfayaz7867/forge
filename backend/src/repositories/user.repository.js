import prisma from "../config/database.js";

export const userRepository = {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async create({ email, passwordHash, name }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, role: true, createdAt: true },
      });
      // Bootstrap default profile and settings
      await tx.userSettings.create({ data: { userId: user.id } });
      return user;
    });
  },

  async findWithProfile(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: true,
        settings: true,
      },
    });
  },
};

import prisma from "../config/database.js";

export const profileRepository = {
  async findByUserId(userId) {
    return prisma.userProfile.findUnique({ where: { userId } });
  },

  async upsert(userId, data) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};

export const settingsRepository = {
  async findByUserId(userId) {
    return prisma.userSettings.findUnique({ where: { userId } });
  },

  async upsert(userId, data) {
    return prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};

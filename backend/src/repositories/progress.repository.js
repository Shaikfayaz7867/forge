import prisma from "../config/database.js";

export const progressRepository = {
  // ── Weight ──
  async findWeights(userId, { skip, limit, from, to }) {
    const where = {
      userId,
      ...(from && { date: { gte: from } }),
      ...(from && to && { date: { gte: from, lte: to } }),
    };

    const [weights, total] = await prisma.$transaction([
      prisma.weightEntry.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.weightEntry.count({ where }),
    ]);
    return { weights, total };
  },

  async upsertWeight(userId, date, weightKg) {
    return prisma.weightEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, weightKg },
      update: { weightKg },
    });
  },

  async findWeightById(id, userId) {
    return prisma.weightEntry.findFirst({ where: { id, userId } });
  },

  async deleteWeight(id, userId) {
    const w = await prisma.weightEntry.findFirst({ where: { id, userId } });
    if (!w) return null;
    return prisma.weightEntry.delete({ where: { id } });
  },

  // ── Measurements ──
  async findMeasurements(userId, { skip, limit }) {
    const [measurements, total] = await prisma.$transaction([
      prisma.measurementEntry.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.measurementEntry.count({ where: { userId } }),
    ]);
    return { measurements, total };
  },

  async upsertMeasurement(userId, date, values) {
    const data = {
      chestCm: values.chest ?? undefined,
      waistCm: values.waist ?? undefined,
      armsCm: values.arms ?? undefined,
      thighsCm: values.thighs ?? undefined,
      shouldersCm: values.shoulders ?? undefined,
      hipsCm: values.hips ?? undefined,
    };
    return prisma.measurementEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
    });
  },

  async deleteMeasurement(id, userId) {
    const m = await prisma.measurementEntry.findFirst({ where: { id, userId } });
    if (!m) return null;
    return prisma.measurementEntry.delete({ where: { id } });
  },

  async findMeasurementById(id, userId) {
    return prisma.measurementEntry.findFirst({ where: { id, userId } });
  },

  // ── Water ──
  async findWater(userId, { from, to } = {}) {
    return prisma.waterLog.findMany({
      where: {
        userId,
        ...(from && { date: { gte: from } }),
        ...(from && to && { date: { gte: from, lte: to } }),
      },
      orderBy: { date: "desc" },
    });
  },

  async upsertWater(userId, date, amountMl) {
    return prisma.waterLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, amountMl },
      update: { amountMl },
    });
  },

  async deleteWater(userId, date) {
    return prisma.waterLog.deleteMany({ where: { userId, date } });
  },

  // ── Progress Photos ──
  async findPhotos(userId, { from, to, pose } = {}) {
    return prisma.progressPhoto.findMany({
      where: {
        userId,
        ...(pose && { pose }),
        ...(from && { date: { gte: from } }),
        ...(from && to && { date: { gte: from, lte: to } }),
      },
      orderBy: { date: "desc" },
    });
  },

  async createPhoto(userId, data) {
    return prisma.progressPhoto.create({ data: { userId, ...data } });
  },

  async findPhotoById(id, userId) {
    return prisma.progressPhoto.findFirst({ where: { id, userId } });
  },

  async deletePhoto(id, userId) {
    const photo = await prisma.progressPhoto.findFirst({ where: { id, userId } });
    if (!photo) return null;
    await prisma.progressPhoto.delete({ where: { id } });
    return photo; // return for file cleanup
  },
};

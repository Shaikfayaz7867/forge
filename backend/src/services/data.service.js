import prisma from "../config/database.js";
import logger from "../config/logger.js";

export const dataService = {
  async exportUserData(userId) {
    const [
      profile,
      settings,
      workoutPlans,
      workoutSessions,
      activeSession,
      foodLogs,
      weightEntries,
      measurementEntries,
      waterLogs,
      progressPhotos,
    ] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.workoutPlan.findMany({
        where: { userId },
        include: { exercises: true },
      }),
      prisma.workoutSession.findMany({
        where: { userId },
        include: { exercises: { include: { sets: true } } },
      }),
      prisma.activeSession.findUnique({ where: { userId } }),
      prisma.foodLogEntry.findMany({ where: { userId } }),
      prisma.weightEntry.findMany({ where: { userId } }),
      prisma.measurementEntry.findMany({ where: { userId } }),
      prisma.waterLog.findMany({ where: { userId } }),
      prisma.progressPhoto.findMany({ where: { userId } }),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      workoutPlans,
      workoutSessions,
      activeSession,
      foodLogs,
      weightEntries,
      measurementEntries,
      waterLogs,
      progressPhotos,
    };
  },

  async importUserData(userId, payload) {
    logger.info({ userId }, "Starting user data import");

    return prisma.$transaction(async (tx) => {
      // 1. Profile
      if (payload.profile) {
        const { id, userId: _u, createdAt, updatedAt, ...profileData } = payload.profile;
        await tx.userProfile.upsert({
          where: { userId },
          create: { userId, ...profileData },
          update: profileData,
        });
      }

      // 2. Settings
      if (payload.settings) {
        const { id, userId: _u, createdAt, updatedAt, ...settingsData } = payload.settings;
        await tx.userSettings.upsert({
          where: { userId },
          create: { userId, ...settingsData },
          update: settingsData,
        });
      }

      // 3. Weight entries
      if (Array.isArray(payload.weightEntries)) {
        for (const w of payload.weightEntries) {
          if (w.date && w.weightKg) {
            await tx.weightEntry.upsert({
              where: { userId_date: { userId, date: w.date } },
              create: { userId, date: w.date, weightKg: Number(w.weightKg) },
              update: { weightKg: Number(w.weightKg) },
            });
          }
        }
      }

      // 4. Water logs
      if (Array.isArray(payload.waterLogs)) {
        for (const w of payload.waterLogs) {
          if (w.date && w.amountMl != null) {
            await tx.waterLog.upsert({
              where: { userId_date: { userId, date: w.date } },
              create: { userId, date: w.date, amountMl: Number(w.amountMl) },
              update: { amountMl: Number(w.amountMl) },
            });
          }
        }
      }

      // 5. Food log entries
      if (Array.isArray(payload.foodLogs)) {
        for (const f of payload.foodLogs) {
          if (f.date && f.foodId) {
            await tx.foodLogEntry.create({
              data: {
                userId,
                date: f.date,
                time: f.time || "12:00",
                meal: f.meal || "lunch",
                foodId: f.foodId,
                foodName: f.foodName || "Food",
                servingLabel: f.servingLabel || "1 serving",
                servingGrams: Number(f.servingGrams || 100),
                quantity: Number(f.quantity || 1),
                calories: Number(f.calories || 0),
                protein: Number(f.protein || 0),
                carbs: Number(f.carbs || 0),
                fat: Number(f.fat || 0),
              },
            });
          }
        }
      }

      // 6. Workout plans
      if (Array.isArray(payload.workoutPlans)) {
        for (const p of payload.workoutPlans) {
          const plan = await tx.workoutPlan.create({
            data: {
              userId,
              name: p.name || "Workout Plan",
              category: p.category || "strength",
              notes: p.notes || "",
              scheduledDays: p.scheduledDays || [],
            },
          });

          if (Array.isArray(p.exercises)) {
            for (let i = 0; i < p.exercises.length; i++) {
              const ex = p.exercises[i];
              await tx.plannedExercise.create({
                data: {
                  planId: plan.id,
                  exerciseId: ex.exerciseId,
                  order: i,
                  sets: ex.sets || 3,
                  repMin: ex.repMin || 8,
                  repMax: ex.repMax || 12,
                  targetWeight: ex.targetWeight || null,
                  restSec: ex.restSec || 90,
                  notes: ex.notes || "",
                },
              });
            }
          }
        }
      }

      return { success: true, message: "Import completed successfully" };
    });
  },
};

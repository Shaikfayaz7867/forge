import prisma from "../config/database.js";

const PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  "3m": 91,
  "6m": 182,
  "1y": 365,
};

export const dashboardService = {
  async getDashboardSummary(userId) {
    const todayStr = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const [profile, settings, todayFoodLogs, todayWater, recentWorkout, latestWeight, weekSessions] =
      await Promise.all([
        prisma.userProfile.findUnique({ where: { userId } }),
        prisma.userSettings.findUnique({ where: { userId } }),
        prisma.foodLogEntry.findMany({ where: { userId, date: todayStr } }),
        prisma.waterLog.findUnique({ where: { userId_date: { userId, date: todayStr } } }),
        prisma.workoutSession.findFirst({
          where: { userId },
          orderBy: { startedAt: "desc" },
          include: { exercises: { include: { sets: true } } },
        }),
        prisma.weightEntry.findFirst({
          where: { userId },
          orderBy: { date: "desc" },
        }),
        prisma.workoutSession.findMany({
          where: { userId, startedAt: { gte: new Date(sevenDaysAgo) } },
        }),
      ]);

    // Compute today's total macros
    const todayCalories = todayFoodLogs.reduce((acc, f) => acc + Number(f.calories), 0);
    const todayProtein = todayFoodLogs.reduce((acc, f) => acc + Number(f.protein), 0);
    const todayCarbs = todayFoodLogs.reduce((acc, f) => acc + Number(f.carbs), 0);
    const todayFat = todayFoodLogs.reduce((acc, f) => acc + Number(f.fat), 0);

    // Compute BMR & TDEE if profile exists
    let bmr = null;
    let tdee = null;
    if (profile) {
      // Mifflin-St Jeor formula
      const weight = latestWeight?.weightKg ?? profile.weightKg;
      if (profile.gender === "male") {
        bmr = Math.round(10 * Number(weight) + 6.25 * Number(profile.heightCm) - 5 * profile.age + 5);
      } else {
        bmr = Math.round(10 * Number(weight) + 6.25 * Number(profile.heightCm) - 5 * profile.age - 161);
      }
      const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };
      tdee = Math.round(bmr * (multipliers[profile.activity] || 1.55));
    }

    // Unread notification count
    const unreadCount = await prisma.notification
      .count({ where: { userId, readAt: null } })
      .catch(() => 0);

    return {
      today: {
        date: todayStr,
        calories: Math.round(todayCalories),
        protein: Math.round(todayProtein),
        carbs: Math.round(todayCarbs),
        fat: Math.round(todayFat),
        waterMl: todayWater?.amountMl || 0,
        waterGoalMl: settings?.waterGoalMl || 2500,
      },
      stats: {
        workoutsThisWeek: weekSessions.length,
        targetWorkoutsThisWeek: profile?.trainingDays || 4,
        latestWeightKg: latestWeight ? Number(latestWeight.weightKg) : (profile ? Number(profile.weightKg) : null),
        bmr,
        tdee,
        unreadNotifications: unreadCount,
      },
      recentWorkout: recentWorkout
        ? {
            id: recentWorkout.id,
            name: recentWorkout.name,
            category: recentWorkout.category,
            startedAt: recentWorkout.startedAt,
            durationSec: recentWorkout.durationSec,
            exerciseCount: recentWorkout.exercises.length,
          }
        : null,
    };
  },

  async getAnalyticsOverview(userId, period = "30d") {
    const days = PERIOD_DAYS[period] ?? 30;
    const since = new Date(Date.now() - days * 86400000);
    const sinceStr = since.toISOString().split("T")[0];

    const [sessions, foodLogs, weights] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId, startedAt: { gte: since } },
        include: { exercises: { include: { sets: true } } },
        orderBy: { startedAt: "asc" },
      }),
      prisma.foodLogEntry.findMany({
        where: { userId, date: { gte: sinceStr } },
        orderBy: { date: "asc" },
      }),
      prisma.weightEntry.findMany({
        where: { userId, date: { gte: sinceStr } },
        orderBy: { date: "asc" },
      }),
    ]);

    // Sessions per day
    const sessionsCountByDay = sessions.reduce((acc, s) => {
      const date = s.startedAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Volume per day
    const volumeByDay = sessions.reduce((acc, s) => {
      const date = s.startedAt.toISOString().split("T")[0];
      const vol = s.exercises.reduce(
        (exAcc, ex) =>
          exAcc + ex.sets.reduce((setAcc, set) => setAcc + (set.completed ? Number(set.weight) * set.reps : 0), 0),
        0
      );
      acc[date] = (acc[date] || 0) + vol;
      return acc;
    }, {});

    // Calories per day
    const caloriesByDay = foodLogs.reduce((acc, f) => {
      acc[f.date] = (acc[f.date] || 0) + Math.round(Number(f.calories));
      return acc;
    }, {});

    // Protein per day
    const proteinByDay = foodLogs.reduce((acc, f) => {
      acc[f.date] = (acc[f.date] || 0) + Math.round(Number(f.protein));
      return acc;
    }, {});

    const totalVolume = sessions.reduce((acc, s) => {
      return (
        acc +
        s.exercises.reduce((exAcc, ex) => {
          return (
            exAcc + ex.sets.reduce((setAcc, set) => setAcc + (set.completed ? Number(set.weight) * set.reps : 0), 0)
          );
        }, 0)
      );
    }, 0);

    return {
      period,
      totalSessions: sessions.length,
      totalVolumeKg: Math.round(totalVolume),
      weightHistory: weights.map((w) => ({ ...w, weightKg: Number(w.weightKg) })),
      sessionsCountByDay,
      volumeByDay,
      caloriesByDay,
      proteinByDay,
    };
  },

  async getStreak(userId) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const trainingDays = profile?.trainingDays ?? 4;

    // Get all sessions ordered by date
    const sessions = await prisma.workoutSession.findMany({
      where: { userId },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    });

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, trainingDays, totalWorkouts: 0 };
    }

    // Build set of unique workout weeks (ISO week)
    const getWeekKey = (date) => {
      const d = new Date(date);
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      return monday.toISOString().split("T")[0];
    };

    const workoutWeeks = new Set(sessions.map((s) => getWeekKey(s.startedAt)));
    const sortedWeeks = [...workoutWeeks].sort().reverse();

    // Current week key
    const thisWeek = getWeekKey(new Date());
    const lastWeek = getWeekKey(new Date(Date.now() - 7 * 86400000));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevWeek = null;

    // Current streak must start from this week or last week
    const startsFromRecent = sortedWeeks[0] === thisWeek || sortedWeeks[0] === lastWeek;
    if (startsFromRecent) {
      for (const week of sortedWeeks) {
        if (prevWeek === null) {
          tempStreak = 1;
          prevWeek = week;
          continue;
        }
        const prevDate = new Date(prevWeek);
        const currDate = new Date(week);
        const diffWeeks = Math.round((prevDate - currDate) / (7 * 86400000));
        if (diffWeeks === 1) {
          tempStreak++;
        } else {
          break;
        }
        prevWeek = week;
      }
      currentStreak = tempStreak;
    }

    // Longest streak
    tempStreak = 0;
    prevWeek = null;
    for (const week of [...sortedWeeks].reverse()) {
      if (prevWeek === null) {
        tempStreak = 1;
        prevWeek = week;
        continue;
      }
      const prevDate = new Date(prevWeek);
      const currDate = new Date(week);
      const diffWeeks = Math.round((currDate - prevDate) / (7 * 86400000));
      if (diffWeeks === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      prevWeek = week;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      trainingDays,
      totalWorkouts: sessions.length,
      workoutsThisWeek: sessions.filter((s) => getWeekKey(s.startedAt) === thisWeek).length,
    };
  },

  async getAchievements(userId) {
    const [sessions, weights, foodLogs, profile] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId },
        include: { exercises: { include: { sets: true } } },
        orderBy: { startedAt: "asc" },
      }),
      prisma.weightEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
      prisma.foodLogEntry.findMany({ where: { userId } }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);

    const achievements = [];

    // Total workouts milestones
    const milestones = [1, 5, 10, 25, 50, 100, 200];
    for (const m of milestones) {
      if (sessions.length >= m) {
        achievements.push({
          id: `workouts_${m}`,
          title: `${m} Workouts`,
          description: `Completed ${m} workout session${m > 1 ? "s" : ""}`,
          icon: "🏋️",
          earned: true,
          earnedAt: sessions[m - 1]?.startedAt,
        });
      }
    }

    // Total volume milestone
    const totalVolume = sessions.reduce(
      (acc, s) =>
        acc +
        s.exercises.reduce(
          (exAcc, ex) =>
            exAcc + ex.sets.reduce((setAcc, set) => setAcc + (set.completed ? Number(set.weight) * set.reps : 0), 0),
          0
        ),
      0
    );
    const volumeMilestones = [1000, 5000, 10000, 50000, 100000];
    for (const m of volumeMilestones) {
      if (totalVolume >= m) {
        achievements.push({
          id: `volume_${m}`,
          title: `${m >= 1000 ? m / 1000 + "T" : m}kg Lifted`,
          description: `Total volume lifted: ${m.toLocaleString()}kg`,
          icon: "💪",
          earned: true,
        });
      }
    }

    // Nutrition log milestones
    const uniqueLogDays = new Set(foodLogs.map((f) => f.date)).size;
    const logMilestones = [7, 30, 90, 365];
    for (const m of logMilestones) {
      if (uniqueLogDays >= m) {
        achievements.push({
          id: `nutrition_days_${m}`,
          title: `${m}-Day Logger`,
          description: `Logged nutrition for ${m} days`,
          icon: "🥗",
          earned: true,
        });
      }
    }

    // Weight tracking
    if (weights.length >= 10) {
      achievements.push({
        id: "weight_tracker",
        title: "Consistent Tracker",
        description: "Weighed in 10+ times",
        icon: "⚖️",
        earned: true,
      });
    }

    return {
      total: achievements.length,
      achievements: achievements.sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? "")),
      stats: {
        totalWorkouts: sessions.length,
        totalVolumeKg: Math.round(totalVolume),
        uniqueLogDays,
        weightEntries: weights.length,
      },
    };
  },
};

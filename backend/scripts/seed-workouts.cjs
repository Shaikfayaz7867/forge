const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templates = [
  {
    id: "tpl-push",
    name: "Push Day",
    category: "push",
    description: "Chest, shoulders and triceps",
    scheduledDays: [1, 4],
    exercises: [
      { exerciseId: "bench-press", sets: 3, repMin: 8, repMax: 10, targetWeight: 40, restSec: 120 },
      { exerciseId: "incline-dumbbell-press", sets: 3, repMin: 10, repMax: 10, targetWeight: 12, restSec: 90 },
      { exerciseId: "dumbbell-shoulder-press", sets: 3, repMin: 10, repMax: 10, targetWeight: 10, restSec: 90 },
      { exerciseId: "lateral-raise", sets: 3, repMin: 12, repMax: 12, targetWeight: 5, restSec: 60 },
      { exerciseId: "triceps-pushdown", sets: 3, repMin: 12, repMax: 12, targetWeight: 15, restSec: 60 },
    ],
  },
  {
    id: "tpl-pull",
    name: "Pull Day",
    category: "pull",
    description: "Back, rear delts and biceps",
    scheduledDays: [2, 5],
    exercises: [
      { exerciseId: "lat-pulldown", sets: 3, repMin: 8, repMax: 10, targetWeight: 40, restSec: 90 },
      { exerciseId: "seated-cable-row", sets: 3, repMin: 10, repMax: 12, targetWeight: 35, restSec: 90 },
      { exerciseId: "dumbbell-row", sets: 3, repMin: 10, repMax: 10, targetWeight: 16, restSec: 90 },
      { exerciseId: "face-pull", sets: 3, repMin: 15, repMax: 15, targetWeight: 15, restSec: 60 },
      { exerciseId: "hammer-curl", sets: 3, repMin: 10, repMax: 12, targetWeight: 8, restSec: 60 },
      { exerciseId: "bicep-curl", sets: 2, repMin: 10, repMax: 12, targetWeight: 15, restSec: 60 },
    ],
  },
  {
    id: "tpl-legs",
    name: "Leg Day",
    category: "legs",
    description: "Quads, hamstrings, glutes and calves",
    scheduledDays: [3, 6],
    exercises: [
      { exerciseId: "squat", sets: 4, repMin: 6, repMax: 8, targetWeight: 50, restSec: 150 },
      { exerciseId: "romanian-deadlift", sets: 3, repMin: 8, repMax: 10, targetWeight: 40, restSec: 120 },
      { exerciseId: "leg-press", sets: 3, repMin: 10, repMax: 12, targetWeight: 80, restSec: 90 },
      { exerciseId: "leg-curl", sets: 3, repMin: 12, repMax: 12, targetWeight: 25, restSec: 60 },
      { exerciseId: "calf-raise", sets: 4, repMin: 12, repMax: 15, targetWeight: 40, restSec: 60 },
    ],
  },
  {
    id: "tpl-upper",
    name: "Upper Body",
    category: "upper",
    description: "Balanced push and pull",
    scheduledDays: [1, 4],
    exercises: [
      { exerciseId: "bench-press", sets: 3, repMin: 6, repMax: 8, targetWeight: 40, restSec: 120 },
      { exerciseId: "barbell-row", sets: 3, repMin: 8, repMax: 10, targetWeight: 35, restSec: 120 },
      { exerciseId: "shoulder-press", sets: 3, repMin: 8, repMax: 10, targetWeight: 25, restSec: 90 },
      { exerciseId: "lat-pulldown", sets: 3, repMin: 10, repMax: 12, targetWeight: 40, restSec: 90 },
      { exerciseId: "skull-crushers", sets: 2, repMin: 10, repMax: 12, targetWeight: 15, restSec: 60 },
      { exerciseId: "hammer-curl", sets: 2, repMin: 10, repMax: 12, targetWeight: 8, restSec: 60 },
    ],
  },
  {
    id: "tpl-lower",
    name: "Lower Body",
    category: "lower",
    description: "Strength-focused legs",
    scheduledDays: [2, 5],
    exercises: [
      { exerciseId: "deadlift", sets: 3, repMin: 5, repMax: 5, targetWeight: 70, restSec: 180 },
      { exerciseId: "squat", sets: 3, repMin: 8, repMax: 8, targetWeight: 50, restSec: 150 },
      { exerciseId: "lunges", sets: 3, repMin: 10, repMax: 10, targetWeight: 10, restSec: 90 },
      { exerciseId: "leg-extension", sets: 3, repMin: 12, repMax: 12, targetWeight: 30, restSec: 60 },
      { exerciseId: "calf-raise", sets: 3, repMin: 15, repMax: 15, targetWeight: 40, restSec: 60 },
    ],
  },
  {
    id: "tpl-full",
    name: "Full Body",
    category: "full",
    description: "Everything in one efficient session",
    scheduledDays: [1, 3, 5],
    exercises: [
      { exerciseId: "squat", sets: 3, repMin: 6, repMax: 8, targetWeight: 50, restSec: 150 },
      { exerciseId: "bench-press", sets: 3, repMin: 8, repMax: 10, targetWeight: 40, restSec: 120 },
      { exerciseId: "seated-cable-row", sets: 3, repMin: 10, repMax: 12, targetWeight: 35, restSec: 90 },
      { exerciseId: "dumbbell-shoulder-press", sets: 2, repMin: 10, repMax: 12, targetWeight: 10, restSec: 90 },
      { exerciseId: "plank", sets: 3, repMin: 45, repMax: 60, targetWeight: null, restSec: 60 },
    ],
  },
];

async function main() {
  console.log("Seeding Workout Templates...");
  for (const tpl of templates) {
    const existing = await prisma.workoutTemplate.findUnique({ where: { id: tpl.id } });
    if (existing) {
      await prisma.templateExercise.deleteMany({ where: { templateId: tpl.id } });
    }
    
    await prisma.workoutTemplate.upsert({
      where: { id: tpl.id },
      create: {
        id: tpl.id,
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        scheduledDays: tpl.scheduledDays,
        exercises: {
          create: tpl.exercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            sortOrder: i,
            sets: ex.sets,
            repMin: ex.repMin,
            repMax: ex.repMax,
            targetWeight: ex.targetWeight,
            restSec: ex.restSec
          }))
        }
      },
      update: {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        scheduledDays: tpl.scheduledDays,
        exercises: {
          create: tpl.exercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            sortOrder: i,
            sets: ex.sets,
            repMin: ex.repMin,
            repMax: ex.repMax,
            targetWeight: ex.targetWeight,
            restSec: ex.restSec
          }))
        }
      }
    });
  }
  console.log("Workout templates seeded.");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

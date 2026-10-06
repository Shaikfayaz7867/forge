import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  { id: "bench-press", name: "Barbell Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", category: "compound", image: "Barbell_Bench_Press", difficulty: "intermediate", bodyweight: false, instructions: ["Lie flat on the bench.", "Grip the bar slightly wider than shoulder-width.", "Lower the bar to your mid-chest.", "Press the bar back up to the starting position."], tips: ["Keep your feet planted firmly.", "Squeeze your shoulder blades together."] },
  { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "dumbbell", category: "compound", image: "Incline_Dumbbell_Press", difficulty: "intermediate", bodyweight: false, instructions: ["Set bench to 30-45 degrees.", "Press dumbbells up and together.", "Lower with control."], tips: ["Keep a slight arch in your back.", "Don't let the dumbbells clank at the top."] },
  { id: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", category: "compound", image: "Dumbbell_Shoulder_Press", difficulty: "intermediate", bodyweight: false, instructions: ["Sit with back support.", "Press dumbbells straight up.", "Lower to ear level."], tips: ["Don't arch your back excessively."] },
  { id: "lateral-raise", name: "Lateral Raise", muscleGroup: "shoulders", secondaryMuscles: [], equipment: "dumbbell", category: "isolation", image: "Side_Lateral_Raise", difficulty: "beginner", bodyweight: false, instructions: ["Stand holding dumbbells at your sides.", "Raise arms out to the sides until parallel with the floor.", "Lower slowly."], tips: ["Lead with your elbows.", "Keep a slight bend in your arms."] },
  { id: "triceps-pushdown", name: "Triceps Pushdown", muscleGroup: "arms", secondaryMuscles: [], equipment: "cable", category: "isolation", image: "Triceps_Pushdown", difficulty: "beginner", bodyweight: false, instructions: ["Attach a rope or bar to a high cable.", "Keep elbows pinned to your sides.", "Push the weight down until arms are fully extended."], tips: ["Avoid using your shoulders.", "Control the weight on the way up."] },
  { id: "lat-pulldown", name: "Lat Pulldown", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "cable", category: "compound", image: "Wide-Grip_Lat_Pulldown", difficulty: "beginner", bodyweight: false, instructions: ["Sit at the lat pulldown machine.", "Grip the bar wider than shoulder-width.", "Pull the bar down to your upper chest.", "Return slowly."], tips: ["Lean slightly back.", "Focus on pulling with your back, not your arms."] },
  { id: "seated-cable-row", name: "Seated Cable Row", muscleGroup: "back", secondaryMuscles: ["biceps", "rear delts"], equipment: "cable", category: "compound", image: "Seated_Cable_Rows", difficulty: "beginner", bodyweight: false, instructions: ["Sit at the low pulley cable machine.", "Keep your back straight and pull the handle to your abdomen.", "Squeeze your shoulder blades.", "Return slowly."], tips: ["Don't use momentum by swinging your torso."] },
  { id: "dumbbell-row", name: "Dumbbell Row", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", category: "compound", image: "One-Arm_Dumbbell_Row", difficulty: "beginner", bodyweight: false, instructions: ["Place one knee and hand on a bench.", "Pull the dumbbell up to your hip.", "Lower slowly."], tips: ["Keep your back flat.", "Pull with your elbow, not your hand."] },
  { id: "face-pull", name: "Face Pull", muscleGroup: "shoulders", secondaryMuscles: ["upper back"], equipment: "cable", category: "isolation", image: "Face_Pull", difficulty: "beginner", bodyweight: false, instructions: ["Attach a rope to a high pulley.", "Pull the rope towards your face, separating your hands.", "Squeeze your rear delts."], tips: ["Keep your elbows high.", "Focus on external rotation."] },
  { id: "hammer-curl", name: "Hammer Curl", muscleGroup: "arms", secondaryMuscles: ["forearms"], equipment: "dumbbell", category: "isolation", image: "Hammer_Curls", difficulty: "beginner", bodyweight: false, instructions: ["Stand holding dumbbells with a neutral grip (palms facing each other).", "Curl the weights up towards your shoulders.", "Lower slowly."], tips: ["Keep your elbows stationary."] },
  { id: "bicep-curl", name: "Bicep Curl", muscleGroup: "arms", secondaryMuscles: ["forearms"], equipment: "dumbbell", category: "isolation", image: "Dumbbell_Bicep_Curl", difficulty: "beginner", bodyweight: false, instructions: ["Stand holding dumbbells with palms facing forward.", "Curl the weights up.", "Lower slowly."], tips: ["Don't swing the weights.", "Keep elbows pinned to your sides."] },
  { id: "squat", name: "Barbell Squat", muscleGroup: "legs", secondaryMuscles: ["glutes", "core"], equipment: "barbell", category: "compound", image: "Barbell_Squat", difficulty: "intermediate", bodyweight: false, instructions: ["Place the barbell across your upper back.", "Squat down until your thighs are parallel to the floor.", "Drive back up to the starting position."], tips: ["Keep your chest up.", "Push your knees out."] },
  { id: "romanian-deadlift", name: "Romanian Deadlift", muscleGroup: "legs", secondaryMuscles: ["glutes", "lower back"], equipment: "barbell", category: "compound", image: "Romanian_Deadlift", difficulty: "intermediate", bodyweight: false, instructions: ["Hold the barbell in front of your thighs.", "Hinge at the hips, keeping a slight bend in the knees.", "Lower the bar until you feel a stretch in your hamstrings.", "Return to standing."], tips: ["Keep the bar close to your body.", "Keep your back flat."] },
  { id: "leg-press", name: "Leg Press", muscleGroup: "legs", secondaryMuscles: ["glutes"], equipment: "machine", category: "compound", image: "Leg_Press", difficulty: "beginner", bodyweight: false, instructions: ["Sit in the leg press machine.", "Place your feet on the platform.", "Push the platform away.", "Lower it slowly."], tips: ["Don't lock your knees at the top.", "Go as deep as you comfortably can."] },
  { id: "leg-curl", name: "Leg Curl", muscleGroup: "legs", secondaryMuscles: ["calves"], equipment: "machine", category: "isolation", image: "Seated_Leg_Curl", difficulty: "beginner", bodyweight: false, instructions: ["Lie or sit in the leg curl machine.", "Curl the pad towards your glutes.", "Lower slowly."], tips: ["Squeeze at the top of the movement."] },
  { id: "calf-raise", name: "Calf Raise", muscleGroup: "legs", secondaryMuscles: [], equipment: "machine", category: "isolation", image: "Standing_Calf_Raises", difficulty: "beginner", bodyweight: false, instructions: ["Stand on the edge of a step or calf raise machine.", "Raise your heels as high as possible.", "Lower your heels below the edge."], tips: ["Pause at the top and bottom of the movement."] },
  { id: "barbell-row", name: "Barbell Row", muscleGroup: "back", secondaryMuscles: ["biceps", "lower back"], equipment: "barbell", category: "compound", image: "Bent_Over_Barbell_Row", difficulty: "intermediate", bodyweight: false, instructions: ["Hinge at the hips, keeping your back flat.", "Pull the barbell to your lower chest/upper abdomen.", "Lower slowly."], tips: ["Keep your elbows close to your body.", "Don't use momentum to lift the weight."] },
  { id: "shoulder-press", name: "Shoulder Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "barbell", category: "compound", image: "Standing_Military_Press", difficulty: "intermediate", bodyweight: false, instructions: ["Hold the barbell at shoulder level.", "Press it overhead until your arms are fully extended.", "Lower slowly."], tips: ["Keep your core tight.", "Don't arch your back excessively."] },
  { id: "skull-crushers", name: "Skull Crushers", muscleGroup: "arms", secondaryMuscles: [], equipment: "ez-bar", category: "isolation", image: "EZ-Bar_Skullcrusher", difficulty: "intermediate", bodyweight: false, instructions: ["Lie on a bench holding an EZ-bar.", "Lower the bar to your forehead by bending your elbows.", "Extend your arms back to the starting position."], tips: ["Keep your elbows pointing straight up.", "Don't let your elbows flare out."] },
  { id: "deadlift", name: "Deadlift", muscleGroup: "back", secondaryMuscles: ["legs", "glutes", "core"], equipment: "barbell", category: "compound", image: "Barbell_Deadlift", difficulty: "advanced", bodyweight: false, instructions: ["Stand with the barbell over your mid-foot.", "Hinge at the hips and grip the bar.", "Keep your back flat and chest up.", "Drive through your legs to stand up."], tips: ["Keep the bar in contact with your legs.", "Don't round your lower back."] },
  { id: "lunges", name: "Lunges", muscleGroup: "legs", secondaryMuscles: ["glutes"], equipment: "dumbbell", category: "compound", image: "Dumbbell_Lunges", difficulty: "beginner", bodyweight: false, instructions: ["Take a large step forward with one leg.", "Lower your body until both knees are bent at a 90-degree angle.", "Push back up to the starting position."], tips: ["Keep your chest up.", "Don't let your front knee go past your toes."] },
  { id: "leg-extension", name: "Leg Extension", muscleGroup: "legs", secondaryMuscles: [], equipment: "machine", category: "isolation", image: "Leg_Extensions", difficulty: "beginner", bodyweight: false, instructions: ["Sit in the leg extension machine.", "Extend your legs fully.", "Lower slowly."], tips: ["Squeeze your quads at the top of the movement."] },
  { id: "plank", name: "Plank", muscleGroup: "core", secondaryMuscles: ["shoulders"], equipment: "bodyweight", category: "isolation", image: "Plank", difficulty: "beginner", bodyweight: true, instructions: ["Get into a pushup position but rest on your forearms.", "Keep your body in a straight line from your head to your heels.", "Hold this position."], tips: ["Keep your core tight.", "Don't let your hips sag."] },
];
const exerciseImages = {};

const foods = [
  { 
    id: "f1", name: "Chicken Breast", category: "Protein", cuisine: "General", meals: ["lunch", "dinner"], aliases: [],
    servingOptions: [
      { label: "100g", grams: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 }
    ]
  },
  { 
    id: "f2", name: "White Rice (Cooked)", category: "Rice", cuisine: "General", meals: ["lunch", "dinner"], aliases: [],
    servingOptions: [
      { label: "100g", grams: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }
    ]
  },
  { 
    id: "f3", name: "Oats", category: "Breakfast", cuisine: "General", meals: ["breakfast"], aliases: [],
    servingOptions: [
      { label: "100g", grams: 100, calories: 389, protein: 16.9, carbs: 66, fat: 6.9 }
    ]
  },
  { 
    id: "f4", name: "Dosa", category: "Breakfast", cuisine: "South Indian", meals: ["breakfast", "dinner"], aliases: ["dosai"],
    servingOptions: [
      { label: "1 medium", grams: 100, calories: 133, protein: 3.2, carbs: 22, fat: 3.2 }
    ]
  },
  { 
    id: "f5", name: "Idli", category: "Breakfast", cuisine: "South Indian", meals: ["breakfast"], aliases: [],
    servingOptions: [
      { label: "1 medium", grams: 50, calories: 58, protein: 1.6, carbs: 12, fat: 0.1 }
    ]
  },
  { 
    id: "f6", name: "Paneer Butter Masala", category: "Curries", cuisine: "North Indian", meals: ["lunch", "dinner"], aliases: ["paneer makhani"],
    servingOptions: [
      { label: "1 cup", grams: 240, calories: 350, protein: 12, carbs: 15, fat: 28 }
    ]
  },
  { 
    id: "f7", name: "Whole Wheat Roti", category: "Breads", cuisine: "Indian", meals: ["lunch", "dinner"], aliases: ["chapati"],
    servingOptions: [
      { label: "1 medium", grams: 40, calories: 120, protein: 4, carbs: 24, fat: 1.5 }
    ]
  },
  { 
    id: "f8", name: "Roasted Almonds", category: "Nuts & Seeds", cuisine: "General", meals: ["snack"], aliases: ["badam"],
    servingOptions: [
      { label: "1 oz", grams: 28, calories: 164, protein: 6, carbs: 6, fat: 14 }
    ]
  },
  { 
    id: "f9", name: "Greek Yogurt", category: "Dairy", cuisine: "General", meals: ["breakfast", "snack"], aliases: ["curd"],
    servingOptions: [
      { label: "1 cup", grams: 170, calories: 100, protein: 17, carbs: 6, fat: 0.7 }
    ]
  },
  { 
    id: "f10", name: "Samosa", category: "Snacks", cuisine: "Indian", meals: ["snack"], aliases: [],
    servingOptions: [
      { label: "1 piece", grams: 85, calories: 260, protein: 4, carbs: 32, fat: 14 }
    ]
  },
  { 
    id: "f11", name: "Mixed Vegetables", category: "Vegetables", cuisine: "General", meals: ["lunch", "dinner"], aliases: ["mixed veg"],
    servingOptions: [
      { label: "1 cup (cooked)", grams: 150, calories: 65, protein: 3, carbs: 14, fat: 0.5 }
    ]
  },
  { 
    id: "f12", name: "Apple", category: "Fruits", cuisine: "General", meals: ["snack", "breakfast"], aliases: [],
    servingOptions: [
      { label: "1 medium", grams: 182, calories: 95, protein: 0.5, carbs: 25, fat: 0.3 }
    ]
  },
  { 
    id: "f13", name: "Black Coffee", category: "Drinks", cuisine: "General", meals: ["breakfast", "snack"], aliases: ["espresso"],
    servingOptions: [
      { label: "1 cup", grams: 240, calories: 2, protein: 0.3, carbs: 0, fat: 0 }
    ]
  },
  { 
    id: "f14", name: "Gulab Jamun", category: "Sweets", cuisine: "Indian", meals: ["other"], aliases: ["jamun"],
    servingOptions: [
      { label: "2 pieces", grams: 100, calories: 300, protein: 4, carbs: 45, fat: 12 }
    ]
  }
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Seed Exercises
  console.log(`Seeding ${exercises.length} exercises...`);
  for (const ex of exercises) {
    const imageUrl = exerciseImages[ex.image] || ex.image;
    const eq = ex.equipment || "barbell";
    await prisma.exercise.upsert({
      where: { id: ex.id },
      create: {
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: ex.secondaryMuscles || [],
        equipment: eq,
        difficulty: ex.difficulty,
        instructions: ex.instructions || [],
        tips: ex.tips || [],
        imageUrl: imageUrl,
        imageKey: ex.image,
        bodyweight: ex.bodyweight || false,
      },
      update: {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: ex.secondaryMuscles || [],
        equipment: eq,
        difficulty: ex.difficulty,
        instructions: ex.instructions || [],
        tips: ex.tips || [],
        imageUrl: imageUrl,
        imageKey: ex.image,
        bodyweight: ex.bodyweight || false,
      },
    });
  }
  console.log("✅ Exercises seeded.");

  // 2. Seed Foods
  console.log(`Seeding ${foods.length} foods...`);
  for (const food of foods) {
    const existing = await prisma.food.findUnique({ where: { id: food.id } });
    if (existing) {
      await prisma.foodServingOption.deleteMany({ where: { foodId: food.id } });
    }

    await prisma.food.upsert({
      where: { id: food.id },
      create: {
        id: food.id,
        name: food.name,
        category: food.category,
        cuisine: food.cuisine,
        meals: food.meals || [],
        aliases: food.aliases || [],
        servingOptions: {
          create: food.servingOptions.map((opt) => ({
            label: opt.label,
            grams: opt.grams,
            calories: opt.calories,
            protein: opt.protein,
            carbs: opt.carbs,
            fat: opt.fat,
          })),
        },
      },
      update: {
        name: food.name,
        category: food.category,
        cuisine: food.cuisine,
        meals: food.meals || [],
        aliases: food.aliases || [],
        servingOptions: {
          create: food.servingOptions.map((opt) => ({
            label: opt.label,
            grams: opt.grams,
            calories: opt.calories,
            protein: opt.protein,
            carbs: opt.carbs,
            fat: opt.fat,
          })),
        },
      },
    });
  }
  console.log("✅ Foods seeded.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

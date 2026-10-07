import prisma from "../config/database.js";

const CRAVING_PROFILES = {
  sweet: {
    title: "Sweet & Chocolatey",
    categories: ["Sweets", "Fruits", "Drinks", "Dairy"],
    keywords: ["chocolate", "sweet", "fruit", "honey", "jaggery", "halwa", "kheer", "laddu", "ice cream", "cake", "banana", "mango", "apple", "date", "raisin", "smoothie"],
    encouragement: "Zero guilt! Satisfies your sweet tooth while keeping your macros locked in.",
  },
  salty: {
    title: "Salty & Crunchy",
    categories: ["Snacks", "Nuts_and_Seeds"],
    keywords: ["salty", "crunchy", "chips", "popcorn", "mixture", "murukku", "namkeen", "peanut", "cashew", "almond", "seed", "fox nut", "makhana", "chana"],
    encouragement: "Crunchy satisfaction! Pure bliss without breaking your daily calorie streak.",
  },
  savory: {
    title: "Savory & Comfort",
    categories: ["Curries", "Breads", "Breakfast", "Protein"],
    keywords: ["savory", "spicy", "sambar", "paneer", "egg", "chicken", "dosa", "paratha", "roll", "toast", "tikka", "kebab", "soup", "masala"],
    encouragement: "Satisfying & wholesome! Fits right into your macro budget.",
  },
  creamy: {
    title: "Cold & Creamy",
    categories: ["Dairy", "Sweets"],
    keywords: ["creamy", "milk", "yogurt", "curd", "lassi", "cheese", "paneer", "butter", "shake", "smoothie", "pudding", "cream"],
    encouragement: "Rich & velvety treat! Perfect reward for staying on track.",
  },
  refreshing: {
    title: "Refreshing & Hydrating",
    categories: ["Drinks", "Fruits"],
    keywords: ["drink", "juice", "coconut", "lemonade", "water", "mint", "watermelon", "orange", "lime", "beverage", "tea", "coffee"],
    encouragement: "Ultra-refreshing boost! Rehydrates you while keeping calories minimal.",
  },
  high_protein: {
    title: "High Protein Emergency",
    categories: ["Protein", "Dairy"],
    keywords: ["protein", "whey", "chicken", "egg", "tofu", "tempeh", "fish", "prawns", "soya", "paneer", "sprouts"],
    encouragement: "Muscle-building rescue! Maximizes protein while respecting your energy limit.",
  },
};

export const rescueService = {
  async getRescueOptions({ craving, remainingCalories = 300, remainingProtein = 20, remainingCarbs = 40, remainingFat = 15 }) {
    const profile = CRAVING_PROFILES[craving] || CRAVING_PROFILES.sweet;
    const targetCals = Math.max(80, Math.min(Number(remainingCalories) || 300, 800));

    // Fetch foods matching categories or keywords
    const foods = await prisma.food.findMany({
      where: {
        isActive: true,
        OR: [
          { category: { in: profile.categories } },
          ...profile.keywords.map((kw) => ({ name: { contains: kw, mode: "insensitive" } })),
        ],
      },
      include: {
        servingOptions: true,
      },
      take: 80,
    });

    const candidates = [];

    for (const food of foods) {
      if (!food.servingOptions || food.servingOptions.length === 0) continue;

      for (const option of food.servingOptions) {
        const baseCals = Number(option.calories) || 1;
        const baseProtein = Number(option.protein) || 0;
        const baseCarbs = Number(option.carbs) || 0;
        const baseFat = Number(option.fat) || 0;
        const baseGrams = Number(option.grams) || 100;

        // Try multipliers: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x
        const multipliers = [1.0, 0.75, 0.5, 1.25, 1.5];
        for (const mult of multipliers) {
          const scaledCals = Math.round(baseCals * mult);
          if (scaledCals < 30 || scaledCals > targetCals + 60) continue;

          const scaledProtein = Math.round(baseProtein * mult * 10) / 10;
          const scaledCarbs = Math.round(baseCarbs * mult * 10) / 10;
          const scaledFat = Math.round(baseFat * mult * 10) / 10;
          const scaledGrams = Math.round(baseGrams * mult);

          // Calculate match score
          let score = 100;
          // Calorie proximity (ideal is 60-95% of remaining calories)
          const calRatio = scaledCals / targetCals;
          if (calRatio >= 0.5 && calRatio <= 0.95) {
            score += 40;
          } else if (calRatio <= 1.0) {
            score += 20;
          } else {
            score -= 30; // penalize overshooting
          }

          // Keyword match bonus
          const nameLower = food.name.toLowerCase();
          if (profile.keywords.some((kw) => nameLower.includes(kw))) {
            score += 30;
          }

          if (craving === "high_protein") {
            score += scaledProtein * 4;
          }

          let portionDesc = `${mult}x ${option.label}`;
          if (mult === 1) portionDesc = option.label;
          else if (mult === 0.5) portionDesc = `0.5x ${option.label}`;

          candidates.push({
            id: `${food.id}_${option.id}_${mult}`,
            foodId: food.id,
            foodName: food.name,
            category: food.category,
            servingLabel: portionDesc,
            servingGrams: scaledGrams,
            quantity: mult,
            calories: scaledCals,
            protein: scaledProtein,
            carbs: scaledCarbs,
            fat: scaledFat,
            score,
            reason: `${scaledCals} kcal • ${scaledProtein}g protein • Fits your target!`,
            encouragement: profile.encouragement,
          });
        }
      }
    }

    // Deduplicate by foodId (pick top option per food)
    const uniqueByFood = new Map();
    candidates.sort((a, b) => b.score - a.score);

    for (const cand of candidates) {
      if (!uniqueByFood.has(cand.foodId)) {
        uniqueByFood.set(cand.foodId, cand);
      }
      if (uniqueByFood.size >= 4) break;
    }

    const results = Array.from(uniqueByFood.values());

    return {
      craving,
      cravingTitle: profile.title,
      targetCalories: targetCals,
      options: results,
    };
  },
};

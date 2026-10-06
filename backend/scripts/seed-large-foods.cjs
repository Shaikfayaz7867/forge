const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categories = [
  "Breakfast", "Rice", "Curries", "Breads", "Snacks", "Dairy",
  "Protein", "Vegetables", "Fruits", "Nuts & Seeds", "Drinks", "Sweets"
];

const foodData = {
  "Breakfast": [
    { name: "Oats", cals: 389, p: 16.9, c: 66, f: 6.9 },
    { name: "Dosa", cals: 133, p: 3.2, c: 22, f: 3.2 },
    { name: "Idli", cals: 58, p: 1.6, c: 12, f: 0.1 },
    { name: "Poha", cals: 250, p: 4, c: 45, f: 6 },
    { name: "Upma", cals: 200, p: 5, c: 30, f: 7 },
    { name: "Pancakes", cals: 227, p: 6, c: 28, f: 9 },
    { name: "Waffles", cals: 291, p: 7, c: 32, f: 14 },
    { name: "Cereal with Milk", cals: 190, p: 6, c: 35, f: 2 },
    { name: "Avocado Toast", cals: 220, p: 5, c: 20, f: 12 },
    { name: "French Toast", cals: 229, p: 8, c: 25, f: 11 }
  ],
  "Rice": [
    { name: "White Rice (Cooked)", cals: 130, p: 2.7, c: 28, f: 0.3 },
    { name: "Brown Rice (Cooked)", cals: 111, p: 2.6, c: 23, f: 0.9 },
    { name: "Basmati Rice", cals: 121, p: 3.5, c: 25, f: 0.4 },
    { name: "Jeera Rice", cals: 150, p: 3, c: 26, f: 4 },
    { name: "Fried Rice", cals: 163, p: 4, c: 22, f: 6 },
    { name: "Biryani", cals: 200, p: 8, c: 24, f: 8 },
    { name: "Lemon Rice", cals: 160, p: 3, c: 28, f: 4 },
    { name: "Curd Rice", cals: 120, p: 3, c: 18, f: 3 },
    { name: "Pulao", cals: 170, p: 4, c: 25, f: 5 },
    { name: "Jasmine Rice", cals: 129, p: 2.8, c: 28, f: 0.2 }
  ],
  "Curries": [
    { name: "Paneer Butter Masala", cals: 350, p: 12, c: 15, f: 28 },
    { name: "Chicken Tikka Masala", cals: 290, p: 25, c: 10, f: 16 },
    { name: "Dal Makhani", cals: 270, p: 9, c: 30, f: 12 },
    { name: "Chana Masala", cals: 220, p: 8, c: 28, f: 9 },
    { name: "Palak Paneer", cals: 260, p: 14, c: 10, f: 20 },
    { name: "Mutton Curry", cals: 320, p: 22, c: 8, f: 22 },
    { name: "Aloo Gobi", cals: 150, p: 4, c: 18, f: 7 },
    { name: "Butter Chicken", cals: 330, p: 20, c: 12, f: 22 },
    { name: "Fish Curry", cals: 240, p: 18, c: 6, f: 15 },
    { name: "Mixed Veg Curry", cals: 160, p: 3, c: 15, f: 10 }
  ],
  "Breads": [
    { name: "Whole Wheat Roti", cals: 120, p: 4, c: 24, f: 1.5 },
    { name: "Naan", cals: 260, p: 8, c: 42, f: 6 },
    { name: "Garlic Naan", cals: 290, p: 9, c: 45, f: 8 },
    { name: "Paratha", cals: 220, p: 5, c: 30, f: 9 },
    { name: "Aloo Paratha", cals: 280, p: 6, c: 35, f: 12 },
    { name: "Puri", cals: 140, p: 3, c: 15, f: 8 },
    { name: "White Bread (Slice)", cals: 66, p: 2, c: 13, f: 0.8 },
    { name: "Brown Bread (Slice)", cals: 73, p: 3, c: 14, f: 1 },
    { name: "Sourdough Slice", cals: 110, p: 4, c: 20, f: 0.5 },
    { name: "Baguette Slice", cals: 75, p: 2.5, c: 14, f: 0.5 }
  ],
  "Snacks": [
    { name: "Samosa", cals: 260, p: 4, c: 32, f: 14 },
    { name: "Pakora", cals: 180, p: 5, c: 20, f: 10 },
    { name: "Bhel Puri", cals: 150, p: 3, c: 30, f: 2 },
    { name: "Pani Puri (6 pcs)", cals: 200, p: 4, c: 35, f: 5 },
    { name: "French Fries", cals: 311, p: 3.4, c: 41, f: 15 },
    { name: "Potato Chips", cals: 152, p: 2, c: 15, f: 10 },
    { name: "Nachos with Cheese", cals: 346, p: 7, c: 36, f: 19 },
    { name: "Popcorn (Buttered)", cals: 164, p: 2.5, c: 16, f: 10 },
    { name: "Pretzels", cals: 108, p: 3, c: 23, f: 1 },
    { name: "Trail Mix", cals: 131, p: 4, c: 12, f: 8 }
  ],
  "Dairy": [
    { name: "Greek Yogurt", cals: 100, p: 17, c: 6, f: 0.7 },
    { name: "Whole Milk", cals: 149, p: 8, c: 12, f: 8 },
    { name: "Skim Milk", cals: 83, p: 8, c: 12, f: 0.2 },
    { name: "Cheddar Cheese", cals: 113, p: 7, c: 0.4, f: 9 },
    { name: "Mozzarella Cheese", cals: 85, p: 6, c: 1, f: 6 },
    { name: "Butter", cals: 102, p: 0.1, c: 0, f: 11 },
    { name: "Ghee", cals: 112, p: 0, c: 0, f: 13 },
    { name: "Paneer", cals: 265, p: 18, c: 3, f: 20 },
    { name: "Curd (Plain Yogurt)", cals: 98, p: 11, c: 3, f: 4.3 },
    { name: "Cottage Cheese", cals: 98, p: 11, c: 3, f: 4.3 }
  ],
  "Protein": [
    { name: "Chicken Breast", cals: 165, p: 31, c: 0, f: 3.6 },
    { name: "Chicken Thigh", cals: 209, p: 26, c: 0, f: 10.9 },
    { name: "Salmon", cals: 208, p: 20, c: 0, f: 13 },
    { name: "Tuna (Canned)", cals: 116, p: 26, c: 0, f: 0.8 },
    { name: "Egg (Whole)", cals: 72, p: 6, c: 0.4, f: 4.8 },
    { name: "Egg White", cals: 17, p: 3.6, c: 0.2, f: 0.1 },
    { name: "Whey Protein Powder", cals: 120, p: 24, c: 3, f: 1.5 },
    { name: "Tofu", cals: 144, p: 16, c: 3, f: 9 },
    { name: "Tempeh", cals: 192, p: 19, c: 9, f: 11 },
    { name: "Lean Beef", cals: 250, p: 26, c: 0, f: 15 }
  ],
  "Vegetables": [
    { name: "Mixed Vegetables", cals: 65, p: 3, c: 14, f: 0.5 },
    { name: "Broccoli", cals: 55, p: 4, c: 11, f: 0.6 },
    { name: "Spinach", cals: 23, p: 3, c: 4, f: 0.4 },
    { name: "Carrots", cals: 41, p: 1, c: 10, f: 0.2 },
    { name: "Cauliflower", cals: 25, p: 2, c: 5, f: 0.3 },
    { name: "Bell Peppers", cals: 31, p: 1, c: 6, f: 0.3 },
    { name: "Green Beans", cals: 31, p: 2, c: 7, f: 0.2 },
    { name: "Mushrooms", cals: 22, p: 3, c: 3, f: 0.3 },
    { name: "Sweet Potato", cals: 86, p: 1.6, c: 20, f: 0.1 },
    { name: "Potato", cals: 77, p: 2, c: 17, f: 0.1 }
  ],
  "Fruits": [
    { name: "Apple", cals: 95, p: 0.5, c: 25, f: 0.3 },
    { name: "Banana", cals: 105, p: 1.3, c: 27, f: 0.4 },
    { name: "Orange", cals: 62, p: 1.2, c: 15, f: 0.2 },
    { name: "Strawberries", cals: 49, p: 1, c: 12, f: 0.5 },
    { name: "Blueberries", cals: 84, p: 1.1, c: 21, f: 0.5 },
    { name: "Mango", cals: 99, p: 1.4, c: 25, f: 0.6 },
    { name: "Pineapple", cals: 42, p: 0.5, c: 11, f: 0.1 },
    { name: "Grapes", cals: 62, p: 0.6, c: 16, f: 0.3 },
    { name: "Watermelon", cals: 30, p: 0.6, c: 8, f: 0.2 },
    { name: "Papaya", cals: 43, p: 0.5, c: 11, f: 0.1 }
  ],
  "Nuts & Seeds": [
    { name: "Roasted Almonds", cals: 164, p: 6, c: 6, f: 14 },
    { name: "Walnuts", cals: 185, p: 4.3, c: 3.9, f: 18.5 },
    { name: "Cashews", cals: 157, p: 5, c: 9, f: 12 },
    { name: "Peanuts", cals: 161, p: 7, c: 4.5, f: 14 },
    { name: "Pistachios", cals: 159, p: 6, c: 8, f: 13 },
    { name: "Chia Seeds", cals: 138, p: 4.7, c: 12, f: 8.7 },
    { name: "Flax Seeds", cals: 150, p: 5, c: 8, f: 12 },
    { name: "Pumpkin Seeds", cals: 151, p: 7, c: 5, f: 13 },
    { name: "Sunflower Seeds", cals: 164, p: 5.8, c: 5.8, f: 14 },
    { name: "Peanut Butter", cals: 188, p: 8, c: 6, f: 16 }
  ],
  "Drinks": [
    { name: "Black Coffee", cals: 2, p: 0.3, c: 0, f: 0 },
    { name: "Green Tea", cals: 0, p: 0, c: 0, f: 0 },
    { name: "Masala Chai", cals: 120, p: 3, c: 18, f: 4 },
    { name: "Orange Juice", cals: 112, p: 2, c: 26, f: 0.5 },
    { name: "Apple Juice", cals: 114, p: 0.2, c: 28, f: 0.3 },
    { name: "Protein Shake", cals: 150, p: 25, c: 5, f: 2 },
    { name: "Coke (Can)", cals: 140, p: 0, c: 39, f: 0 },
    { name: "Diet Coke", cals: 0, p: 0, c: 0, f: 0 },
    { name: "Coconut Water", cals: 46, p: 1.7, c: 9, f: 0.5 },
    { name: "Lemonade", cals: 99, p: 0.1, c: 26, f: 0 }
  ],
  "Sweets": [
    { name: "Gulab Jamun", cals: 300, p: 4, c: 45, f: 12 },
    { name: "Rasgulla", cals: 150, p: 3, c: 30, f: 2 },
    { name: "Jalebi", cals: 150, p: 1, c: 25, f: 5 },
    { name: "Chocolate Chip Cookie", cals: 148, p: 1.5, c: 20, f: 7 },
    { name: "Brownie", cals: 227, p: 3, c: 34, f: 9 },
    { name: "Ice Cream (Vanilla)", cals: 137, p: 2.3, c: 15.6, f: 7.3 },
    { name: "Donut", cals: 253, p: 3, c: 28, f: 14 },
    { name: "Milk Chocolate", cals: 150, p: 2, c: 17, f: 9 },
    { name: "Dark Chocolate", cals: 170, p: 2, c: 13, f: 12 },
    { name: "Cheesecake", cals: 321, p: 5.5, c: 25, f: 22 }
  ]
};

async function main() {
  console.log("Seeding large food database...");
  
  let counter = 100;
  for (const category of categories) {
    const items = foodData[category] || [];
    for (const item of items) {
      const foodId = `food-l-${counter++}`;
      
      const existing = await prisma.food.findUnique({ where: { id: foodId } });
      if (existing) {
        await prisma.foodServingOption.deleteMany({ where: { foodId: foodId } });
      }

      await prisma.food.upsert({
        where: { id: foodId },
        create: {
          id: foodId,
          name: item.name,
          category: category,
          cuisine: "General",
          meals: category === "Breakfast" ? ["breakfast"] : ["lunch", "dinner", "snack"],
          aliases: [],
          servingOptions: {
            create: [
              {
                label: "1 Serving",
                grams: 100,
                calories: item.cals,
                protein: item.p,
                carbs: item.c,
                fat: item.f,
              }
            ],
          },
        },
        update: {
          name: item.name,
          category: category,
          servingOptions: {
            create: [
              {
                label: "1 Serving",
                grams: 100,
                calories: item.cals,
                protein: item.p,
                carbs: item.c,
                fat: item.f,
              }
            ],
          },
        },
      });
    }
  }

  console.log("✅ 120 Foods successfully seeded.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

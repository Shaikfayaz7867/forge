const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categories = [
  "Breakfast",
  "Rice",
  "Curries",
  "Breads",
  "Snacks",
  "Dairy",
  "Protein",
  "Vegetables",
  "Fruits",
  "Nuts & Seeds",
  "Drinks",
  "Sweets",
];

const foodData = {
  // =========================================================
  // BREAKFAST - 20
  // =========================================================
  Breakfast: [
    { name: "Oats", cals: 389, p: 16.9, c: 66, f: 6.9 },
    { name: "Dosa", cals: 133, p: 3.2, c: 22, f: 3.2 },
    { name: "Idli", cals: 58, p: 1.6, c: 12, f: 0.1 },
    { name: "Poha", cals: 250, p: 4, c: 45, f: 6 },
    { name: "Upma", cals: 200, p: 5, c: 30, f: 7 },
    { name: "Pancakes", cals: 227, p: 6, c: 28, f: 9 },
    { name: "Waffles", cals: 291, p: 7, c: 32, f: 14 },
    { name: "Cereal with Milk", cals: 190, p: 6, c: 35, f: 2 },
    { name: "Avocado Toast", cals: 220, p: 5, c: 20, f: 12 },
    { name: "French Toast", cals: 229, p: 8, c: 25, f: 11 },
    { name: "Masala Dosa", cals: 168, p: 4, c: 28, f: 5 },
    { name: "Pesarattu", cals: 145, p: 7, c: 22, f: 3 },
    { name: "Uttapam", cals: 180, p: 5, c: 30, f: 4 },
    { name: "Ven Pongal", cals: 220, p: 6, c: 32, f: 8 },
    { name: "Rava Dosa", cals: 170, p: 4, c: 25, f: 6 },
    { name: "Egg Omelette", cals: 154, p: 10.6, c: 1.1, f: 11.6 },
    { name: "Boiled Eggs", cals: 155, p: 13, c: 1.1, f: 11 },
    { name: "Vegetable Sandwich", cals: 180, p: 6, c: 27, f: 5 },
    { name: "Breakfast Burrito", cals: 290, p: 13, c: 32, f: 12 },
    { name: "Granola with Yogurt", cals: 220, p: 9, c: 30, f: 7 },
  ],

  // =========================================================
  // RICE - 20
  // =========================================================
  Rice: [
    { name: "White Rice (Cooked)", cals: 130, p: 2.7, c: 28, f: 0.3 },
    { name: "Brown Rice (Cooked)", cals: 111, p: 2.6, c: 23, f: 0.9 },
    { name: "Basmati Rice", cals: 121, p: 3.5, c: 25, f: 0.4 },
    { name: "Jeera Rice", cals: 150, p: 3, c: 26, f: 4 },
    { name: "Fried Rice", cals: 163, p: 4, c: 22, f: 6 },
    { name: "Biryani", cals: 200, p: 8, c: 24, f: 8 },
    { name: "Lemon Rice", cals: 160, p: 3, c: 28, f: 4 },
    { name: "Curd Rice", cals: 120, p: 3, c: 18, f: 3 },
    { name: "Pulao", cals: 170, p: 4, c: 25, f: 5 },
    { name: "Jasmine Rice", cals: 129, p: 2.8, c: 28, f: 0.2 },
    { name: "Tomato Rice", cals: 165, p: 3, c: 29, f: 4 },
    { name: "Coconut Rice", cals: 190, p: 4, c: 28, f: 7 },
    { name: "Tamarind Rice", cals: 180, p: 4, c: 31, f: 5 },
    { name: "Methi Rice", cals: 165, p: 4, c: 27, f: 5 },
    { name: "Vegetable Rice", cals: 155, p: 4, c: 28, f: 3 },
    { name: "Egg Fried Rice", cals: 190, p: 8, c: 24, f: 7 },
    { name: "Chicken Fried Rice", cals: 210, p: 12, c: 24, f: 8 },
    { name: "Chicken Biryani", cals: 240, p: 12, c: 28, f: 9 },
    { name: "Mutton Biryani", cals: 290, p: 13, c: 27, f: 14 },
    { name: "Khichdi", cals: 140, p: 5, c: 24, f: 3 },
  ],

  // =========================================================
  // CURRIES - 20
  // =========================================================
  Curries: [
    { name: "Paneer Butter Masala", cals: 350, p: 12, c: 15, f: 28 },
    { name: "Chicken Tikka Masala", cals: 290, p: 25, c: 10, f: 16 },
    { name: "Dal Makhani", cals: 270, p: 9, c: 30, f: 12 },
    { name: "Chana Masala", cals: 220, p: 8, c: 28, f: 9 },
    { name: "Palak Paneer", cals: 260, p: 14, c: 10, f: 20 },
    { name: "Mutton Curry", cals: 320, p: 22, c: 8, f: 22 },
    { name: "Aloo Gobi", cals: 150, p: 4, c: 18, f: 7 },
    { name: "Butter Chicken", cals: 330, p: 20, c: 12, f: 22 },
    { name: "Fish Curry", cals: 240, p: 18, c: 6, f: 15 },
    { name: "Mixed Veg Curry", cals: 160, p: 3, c: 15, f: 10 },
    { name: "Rajma Curry", cals: 190, p: 9, c: 29, f: 4 },
    { name: "Dal Tadka", cals: 180, p: 8, c: 24, f: 6 },
    { name: "Egg Curry", cals: 210, p: 12, c: 8, f: 14 },
    { name: "Kadai Paneer", cals: 290, p: 14, c: 12, f: 22 },
    { name: "Kadai Chicken", cals: 250, p: 24, c: 9, f: 14 },
    { name: "Chicken Curry", cals: 240, p: 23, c: 7, f: 14 },
    { name: "Mushroom Masala", cals: 180, p: 6, c: 12, f: 12 },
    { name: "Bhindi Masala", cals: 140, p: 3, c: 14, f: 8 },
    { name: "Baingan Bharta", cals: 130, p: 3, c: 14, f: 7 },
    { name: "Malai Kofta", cals: 300, p: 9, c: 18, f: 22 },
  ],

  // =========================================================
  // BREADS - 20
  // =========================================================
  Breads: [
    { name: "Whole Wheat Roti", cals: 120, p: 4, c: 24, f: 1.5 },
    { name: "Naan", cals: 260, p: 8, c: 42, f: 6 },
    { name: "Garlic Naan", cals: 290, p: 9, c: 45, f: 8 },
    { name: "Paratha", cals: 220, p: 5, c: 30, f: 9 },
    { name: "Aloo Paratha", cals: 280, p: 6, c: 35, f: 12 },
    { name: "Puri", cals: 140, p: 3, c: 15, f: 8 },
    { name: "White Bread (Slice)", cals: 66, p: 2, c: 13, f: 0.8 },
    { name: "Brown Bread (Slice)", cals: 73, p: 3, c: 14, f: 1 },
    { name: "Sourdough Slice", cals: 110, p: 4, c: 20, f: 0.5 },
    { name: "Baguette Slice", cals: 75, p: 2.5, c: 14, f: 0.5 },
    { name: "Missi Roti", cals: 140, p: 5, c: 22, f: 4 },
    { name: "Bajra Roti", cals: 120, p: 3, c: 22, f: 2 },
    { name: "Jowar Roti", cals: 120, p: 3, c: 23, f: 1.5 },
    { name: "Ragi Roti", cals: 130, p: 3, c: 24, f: 2 },
    { name: "Methi Paratha", cals: 230, p: 6, c: 30, f: 9 },
    { name: "Paneer Paratha", cals: 290, p: 10, c: 32, f: 13 },
    { name: "Lachha Paratha", cals: 300, p: 6, c: 35, f: 15 },
    { name: "Kulcha", cals: 250, p: 7, c: 40, f: 7 },
    { name: "Tandoori Roti", cals: 110, p: 4, c: 22, f: 1 },
    { name: "Multigrain Bread", cals: 85, p: 4, c: 14, f: 1.5 },
  ],

  // =========================================================
  // SNACKS - 20
  // =========================================================
  Snacks: [
    { name: "Samosa", cals: 260, p: 4, c: 32, f: 14 },
    { name: "Pakora", cals: 180, p: 5, c: 20, f: 10 },
    { name: "Bhel Puri", cals: 150, p: 3, c: 30, f: 2 },
    { name: "Pani Puri (6 pcs)", cals: 200, p: 4, c: 35, f: 5 },
    { name: "French Fries", cals: 311, p: 3.4, c: 41, f: 15 },
    { name: "Potato Chips", cals: 152, p: 2, c: 15, f: 10 },
    { name: "Nachos with Cheese", cals: 346, p: 7, c: 36, f: 19 },
    { name: "Popcorn (Buttered)", cals: 164, p: 2.5, c: 16, f: 10 },
    { name: "Pretzels", cals: 108, p: 3, c: 23, f: 1 },
    { name: "Trail Mix", cals: 131, p: 4, c: 12, f: 8 },
    { name: "Vada Pav", cals: 290, p: 7, c: 38, f: 12 },
    { name: "Dhokla", cals: 160, p: 7, c: 25, f: 4 },
    { name: "Kachori", cals: 250, p: 5, c: 30, f: 12 },
    { name: "Aloo Tikki", cals: 180, p: 4, c: 25, f: 8 },
    { name: "Veg Cutlet", cals: 190, p: 4, c: 22, f: 9 },
    { name: "Corn Chaat", cals: 120, p: 4, c: 22, f: 2 },
    { name: "Roasted Makhana", cals: 110, p: 4, c: 16, f: 3 },
    { name: "Roasted Chickpeas", cals: 164, p: 9, c: 27, f: 3 },
    { name: "Spring Rolls", cals: 180, p: 4, c: 24, f: 8 },
    { name: "Chicken Nuggets", cals: 296, p: 15, c: 18, f: 18 },
  ],

  // =========================================================
  // DAIRY - 20
  // =========================================================
  Dairy: [
    { name: "Greek Yogurt", cals: 100, p: 17, c: 6, f: 0.7 },
    { name: "Whole Milk", cals: 149, p: 8, c: 12, f: 8 },
    { name: "Skim Milk", cals: 83, p: 8, c: 12, f: 0.2 },
    { name: "Cheddar Cheese", cals: 113, p: 7, c: 0.4, f: 9 },
    { name: "Mozzarella Cheese", cals: 85, p: 6, c: 1, f: 6 },
    { name: "Butter", cals: 102, p: 0.1, c: 0, f: 11 },
    { name: "Ghee", cals: 112, p: 0, c: 0, f: 13 },
    { name: "Paneer", cals: 265, p: 18, c: 3, f: 20 },
    { name: "Curd (Plain Yogurt)", cals: 98, p: 11, c: 3, f: 4.3 },
    { name: "Cottage Cheese", cals: 98, p: 11, c: 3, f: 4.3 },
    { name: "Low Fat Milk", cals: 102, p: 8.5, c: 12, f: 2.5 },
    { name: "Buttermilk", cals: 40, p: 3.3, c: 4.8, f: 0.9 },
    { name: "Lassi", cals: 90, p: 4, c: 12, f: 3 },
    { name: "Mango Lassi", cals: 130, p: 4, c: 20, f: 4 },
    { name: "Milkshake", cals: 180, p: 7, c: 25, f: 6 },
    { name: "Cream Cheese", cals: 99, p: 2, c: 2, f: 10 },
    { name: "Feta Cheese", cals: 75, p: 4, c: 1, f: 6 },
    { name: "Parmesan Cheese", cals: 110, p: 10, c: 1, f: 7 },
    { name: "Ricotta Cheese", cals: 174, p: 11, c: 3, f: 13 },
    { name: "Kefir", cals: 63, p: 3.5, c: 4.5, f: 3.5 },
  ],

  // =========================================================
  // PROTEIN - 20
  // =========================================================
  Protein: [
    { name: "Chicken Breast", cals: 165, p: 31, c: 0, f: 3.6 },
    { name: "Chicken Thigh", cals: 209, p: 26, c: 0, f: 10.9 },
    { name: "Salmon", cals: 208, p: 20, c: 0, f: 13 },
    { name: "Tuna (Canned)", cals: 116, p: 26, c: 0, f: 0.8 },
    { name: "Egg (Whole)", cals: 72, p: 6, c: 0.4, f: 4.8 },
    { name: "Egg White", cals: 17, p: 3.6, c: 0.2, f: 0.1 },
    { name: "Whey Protein Powder", cals: 120, p: 24, c: 3, f: 1.5 },
    { name: "Tofu", cals: 144, p: 16, c: 3, f: 9 },
    { name: "Tempeh", cals: 192, p: 19, c: 9, f: 11 },
    { name: "Lean Beef", cals: 250, p: 26, c: 0, f: 15 },
    { name: "Turkey Breast", cals: 135, p: 29, c: 0, f: 1.8 },
    { name: "Prawns", cals: 99, p: 24, c: 0.2, f: 0.3 },
    { name: "Sardines", cals: 208, p: 25, c: 0, f: 11 },
    { name: "Rohu Fish", cals: 97, p: 17, c: 0, f: 3 },
    { name: "Chicken Liver", cals: 167, p: 24, c: 1, f: 6 },
    { name: "Turkey Mince", cals: 176, p: 27, c: 0, f: 8 },
    { name: "Soy Chunks", cals: 345, p: 52, c: 33, f: 0.5 },
    { name: "Edamame", cals: 121, p: 12, c: 9, f: 5 },
    { name: "Seitan", cals: 141, p: 25, c: 12, f: 2 },
    { name: "Black Beans", cals: 132, p: 8.9, c: 24, f: 0.5 },
  ],

  // =========================================================
  // VEGETABLES - 20
  // =========================================================
  Vegetables: [
    { name: "Mixed Vegetables", cals: 65, p: 3, c: 14, f: 0.5 },
    { name: "Broccoli", cals: 55, p: 4, c: 11, f: 0.6 },
    { name: "Spinach", cals: 23, p: 3, c: 4, f: 0.4 },
    { name: "Carrots", cals: 41, p: 1, c: 10, f: 0.2 },
    { name: "Cauliflower", cals: 25, p: 2, c: 5, f: 0.3 },
    { name: "Bell Peppers", cals: 31, p: 1, c: 6, f: 0.3 },
    { name: "Green Beans", cals: 31, p: 2, c: 7, f: 0.2 },
    { name: "Mushrooms", cals: 22, p: 3, c: 3, f: 0.3 },
    { name: "Sweet Potato", cals: 86, p: 1.6, c: 20, f: 0.1 },
    { name: "Potato", cals: 77, p: 2, c: 17, f: 0.1 },
    { name: "Tomato", cals: 18, p: 0.9, c: 3.9, f: 0.2 },
    { name: "Cucumber", cals: 15, p: 0.7, c: 3.6, f: 0.1 },
    { name: "Onion", cals: 40, p: 1.1, c: 9.3, f: 0.1 },
    { name: "Cabbage", cals: 25, p: 1.3, c: 6, f: 0.1 },
    { name: "Beetroot", cals: 43, p: 1.6, c: 10, f: 0.2 },
    { name: "Brinjal", cals: 25, p: 1, c: 6, f: 0.2 },
    { name: "Okra", cals: 33, p: 1.9, c: 7, f: 0.2 },
    { name: "Green Peas", cals: 81, p: 5.4, c: 14, f: 0.4 },
    { name: "Bottle Gourd", cals: 15, p: 0.6, c: 3.4, f: 0.1 },
    { name: "Drumstick", cals: 37, p: 2.1, c: 8, f: 0.2 },
  ],

  // =========================================================
  // FRUITS - 20
  // =========================================================
  Fruits: [
    { name: "Apple", cals: 95, p: 0.5, c: 25, f: 0.3 },
    { name: "Banana", cals: 105, p: 1.3, c: 27, f: 0.4 },
    { name: "Orange", cals: 62, p: 1.2, c: 15, f: 0.2 },
    { name: "Strawberries", cals: 49, p: 1, c: 12, f: 0.5 },
    { name: "Blueberries", cals: 84, p: 1.1, c: 21, f: 0.5 },
    { name: "Mango", cals: 99, p: 1.4, c: 25, f: 0.6 },
    { name: "Pineapple", cals: 42, p: 0.5, c: 11, f: 0.1 },
    { name: "Grapes", cals: 62, p: 0.6, c: 16, f: 0.3 },
    { name: "Watermelon", cals: 30, p: 0.6, c: 8, f: 0.2 },
    { name: "Papaya", cals: 43, p: 0.5, c: 11, f: 0.1 },
    { name: "Guava", cals: 68, p: 2.6, c: 14, f: 1 },
    { name: "Pomegranate", cals: 83, p: 1.7, c: 19, f: 1.2 },
    { name: "Kiwi", cals: 61, p: 1.1, c: 15, f: 0.5 },
    { name: "Pear", cals: 101, p: 0.6, c: 27, f: 0.2 },
    { name: "Peach", cals: 59, p: 1.4, c: 14, f: 0.4 },
    { name: "Plum", cals: 46, p: 0.7, c: 11, f: 0.3 },
    { name: "Cherries", cals: 63, p: 1.1, c: 16, f: 0.2 },
    { name: "Muskmelon", cals: 34, p: 0.8, c: 8, f: 0.2 },
    { name: "Custard Apple", cals: 94, p: 2.1, c: 23, f: 0.6 },
    { name: "Dragon Fruit", cals: 57, p: 1.1, c: 13, f: 0.1 },
  ],

  // =========================================================
  // NUTS & SEEDS - 20
  // =========================================================
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
    { name: "Peanut Butter", cals: 188, p: 8, c: 6, f: 16 },
    { name: "Hazelnuts", cals: 178, p: 4.2, c: 4.7, f: 17 },
    { name: "Macadamia Nuts", cals: 204, p: 2.2, c: 4, f: 21 },
    { name: "Brazil Nuts", cals: 187, p: 4, c: 3.3, f: 19 },
    { name: "Pine Nuts", cals: 191, p: 3.9, c: 3.7, f: 19 },
    { name: "Sesame Seeds", cals: 160, p: 5, c: 7, f: 14 },
    { name: "Hemp Seeds", cals: 166, p: 9.5, c: 2.6, f: 14.6 },
    { name: "Poppy Seeds", cals: 159, p: 5.2, c: 8, f: 12.5 },
    { name: "Mixed Nuts", cals: 180, p: 5, c: 7, f: 16 },
    { name: "Almond Butter", cals: 180, p: 6, c: 6, f: 16 },
    { name: "Cashew Butter", cals: 170, p: 5, c: 9, f: 14 },
  ],

  // =========================================================
  // DRINKS - 20
  // =========================================================
  Drinks: [
    { name: "Black Coffee", cals: 2, p: 0.3, c: 0, f: 0 },
    { name: "Green Tea", cals: 0, p: 0, c: 0, f: 0 },
    { name: "Masala Chai", cals: 120, p: 3, c: 18, f: 4 },
    { name: "Orange Juice", cals: 112, p: 2, c: 26, f: 0.5 },
    { name: "Apple Juice", cals: 114, p: 0.2, c: 28, f: 0.3 },
    { name: "Protein Shake", cals: 150, p: 25, c: 5, f: 2 },
    { name: "Coke (Can)", cals: 140, p: 0, c: 39, f: 0 },
    { name: "Diet Coke", cals: 0, p: 0, c: 0, f: 0 },
    { name: "Coconut Water", cals: 46, p: 1.7, c: 9, f: 0.5 },
    { name: "Lemonade", cals: 99, p: 0.1, c: 26, f: 0 },
    { name: "Milk Tea", cals: 90, p: 3, c: 12, f: 3 },
    { name: "Black Tea", cals: 2, p: 0, c: 0.5, f: 0 },
    { name: "Filter Coffee", cals: 80, p: 2, c: 10, f: 3 },
    { name: "Cold Coffee", cals: 120, p: 4, c: 18, f: 4 },
    { name: "Mango Smoothie", cals: 150, p: 5, c: 28, f: 3 },
    { name: "Banana Smoothie", cals: 180, p: 6, c: 32, f: 4 },
    { name: "Strawberry Smoothie", cals: 140, p: 5, c: 24, f: 3 },
    { name: "Buttermilk", cals: 40, p: 3, c: 5, f: 1 },
    { name: "Tender Coconut Water", cals: 45, p: 1.5, c: 9, f: 0.5 },
    { name: "Tomato Juice", cals: 41, p: 2, c: 9, f: 0.2 },
  ],

  // =========================================================
  // SWEETS - 20
  // =========================================================
  Sweets: [
    { name: "Gulab Jamun", cals: 300, p: 4, c: 45, f: 12 },
    { name: "Rasgulla", cals: 150, p: 3, c: 30, f: 2 },
    { name: "Jalebi", cals: 150, p: 1, c: 25, f: 5 },
    { name: "Chocolate Chip Cookie", cals: 148, p: 1.5, c: 20, f: 7 },
    { name: "Brownie", cals: 227, p: 3, c: 34, f: 9 },
    { name: "Ice Cream (Vanilla)", cals: 137, p: 2.3, c: 15.6, f: 7.3 },
    { name: "Donut", cals: 253, p: 3, c: 28, f: 14 },
    { name: "Milk Chocolate", cals: 150, p: 2, c: 17, f: 9 },
    { name: "Dark Chocolate", cals: 170, p: 2, c: 13, f: 12 },
    { name: "Cheesecake", cals: 321, p: 5.5, c: 25, f: 22 },
    { name: "Kaju Katli", cals: 140, p: 3, c: 18, f: 6 },
    { name: "Mysore Pak", cals: 180, p: 3, c: 18, f: 11 },
    { name: "Motichoor Laddu", cals: 185, p: 3, c: 28, f: 7 },
    { name: "Besan Laddu", cals: 190, p: 5, c: 22, f: 9 },
    { name: "Rasmalai", cals: 180, p: 7, c: 20, f: 8 },
    { name: "Gajar Halwa", cals: 190, p: 4, c: 25, f: 8 },
    { name: "Kheer", cals: 150, p: 4, c: 22, f: 5 },
    { name: "Payasam", cals: 160, p: 3, c: 25, f: 5 },
    { name: "Soan Papdi", cals: 160, p: 3, c: 24, f: 6 },
    { name: "Carrot Cake", cals: 250, p: 3, c: 35, f: 10 },
  ],
};

// =========================================================
// SEED FUNCTION
// =========================================================

async function main() {
  console.log("🌱 Seeding food database...");

  let counter = 100;
  let totalFoods = 0;

  for (const category of categories) {
    const items = foodData[category] || [];

    console.log(`\n📂 ${category}: ${items.length} foods`);

    for (const item of items) {
      const foodId = `food-l-${counter++}`;

      await prisma.food.upsert({
        where: {
          id: foodId,
        },

        create: {
          id: foodId,
          name: item.name,
          category: category,
          cuisine: "General",
          meals:
            category === "Breakfast"
              ? ["breakfast"]
              : ["lunch", "dinner", "snack"],
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
              },
            ],
          },
        },

        update: {
          name: item.name,
          category: category,
          cuisine: "General",
          meals:
            category === "Breakfast"
              ? ["breakfast"]
              : ["lunch", "dinner", "snack"],
          aliases: [],

          servingOptions: {
            deleteMany: {},

            create: [
              {
                label: "1 Serving",
                grams: 100,
                calories: item.cals,
                protein: item.p,
                carbs: item.c,
                fat: item.f,
              },
            ],
          },
        },
      });

      totalFoods++;
    }
  }

  console.log("\n====================================");
  console.log(`✅ ${totalFoods} foods successfully seeded.`);
  console.log(`📊 ${categories.length} categories`);
  console.log(`🍽️ 20 foods per category`);
  console.log("====================================");
}

// =========================================================
// RUN
// =========================================================

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);

    await prisma.$disconnect();

    process.exit(1);
  });
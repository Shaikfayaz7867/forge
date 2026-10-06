import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { MEALS } from "@/data/constants";
import type { Food, FoodLogEntry, Macros, MealType, ServingOption } from "./types";
import { uid } from "./ids";
import { nowTime } from "./dates";



export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { ...EMPTY_MACROS },
  );
}

export function scaleServing(serving: ServingOption, quantity: number): Macros {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: Math.round(serving.calories * quantity),
    protein: r1(serving.protein * quantity),
    carbs: r1(serving.carbs * quantity),
    fat: r1(serving.fat * quantity),
  };
}

export function buildEntry(
  food: Food,
  serving: ServingOption,
  quantity: number,
  meal: MealType,
  date: string,
  time: string = nowTime(),
): FoodLogEntry {
  return {
    id: uid("food"),
    date,
    time,
    meal,
    foodId: food.id,
    foodName: food.name,
    servingLabel: serving.label,
    servingGrams: serving.grams,
    quantity,
    ...scaleServing(serving, quantity),
  };
}

/** Default meal for the current time of day. */
export function mealForTime(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 19) return "snack";
  if (h >= 19 && h < 23) return "dinner";
  return "other";
}

export const mealLabel = (m: MealType) => MEALS.find((x) => x.id === m)?.label ?? m;

/* ---------------------------------- Search ---------------------------------- */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

interface Indexed {
  food: Food;
  name: string;
  aliases: string[];
  meta: string;
}

let cachedFoods: Food[] | null = null;
let cachedIndex: Indexed[] = [];

function getIndex(): Indexed[] {
  const currentFoods = getForgeState().foods;
  if (currentFoods !== cachedFoods) {
    cachedFoods = currentFoods;
    cachedIndex = currentFoods.map((food) => ({
      food,
      name: normalize(food.name),
      aliases: (food.aliases ?? []).map(normalize),
      meta: normalize(`${food.category} ${food.cuisine} ${food.meals.join(" ")}`),
    }));
  }
  return cachedIndex;
}

function scoreText(q: string, text: string): number {
  if (!text) return 0;
  if (text === q) return 100;
  if (text.startsWith(q)) return 80;
  if (text.split(" ").some((w) => w.startsWith(q))) return 60;
  if (text.includes(q)) return 40;
  return 0;
}

function scoreFood(q: string, item: Indexed): number {
  const nameScore = scoreText(q, item.name);
  const aliasScore = Math.max(0, ...item.aliases.map((a) => scoreText(q, a))) * 0.95;
  let best = Math.max(nameScore, aliasScore);
  if (best === 0) {
    // Multi-word queries: every token must appear somewhere in name/aliases/meta.
    const tokens = q.split(" ");
    const hay = `${item.name} ${item.aliases.join(" ")} ${item.meta}`;
    if (tokens.length > 1 && tokens.every((t) => hay.includes(t))) best = 30;
    else if (scoreText(q, item.meta) >= 60) best = 20;
  }
  // Shorter names win ties, so "rice" ranks Steamed Rice above Tamarind Rice.
  return best > 0 ? best - item.name.length * 0.05 : 0;
}

export function searchFoods(query: string, limit = 40): Food[] {
  const q = normalize(query);
  if (!q) return (getForgeState().foods).slice(0, limit);
  return getIndex()
    .map((item) => ({ item, score: scoreFood(q, item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item.food);
}

/* ------------------------------- Smart input ------------------------------- */

export type ParsedItem =
  | {
      ok: true;
      raw: string;
      food: Food;
      serving: ServingOption;
      quantity: number;
      macros: Macros;
    }
  | { ok: false; raw: string; query: string; reason: "not_found" | "invalid_quantity" };

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, quarter: 0.25,
};

const UNIT_WORDS = ["cup", "cups", "bowl", "bowls", "plate", "plates", "piece", "pieces", "pcs", "pc", "slice", "slices", "glass", "glasses", "tbsp", "tsp", "scoop", "scoops", "serving", "servings"];

function findServing(food: Food, unitWord: string | null): ServingOption {
  if (unitWord) {
    const singular = unitWord.replace(/(es|s)$/, "");
    const match = food.servingOptions.find((s) => s.label.toLowerCase().includes(singular));
    if (match) return match;
  }
  return food.servingOptions[0];
}

function per100(food: Food): ServingOption | undefined {
  return food.servingOptions.find((s) => s.grams === 100) ?? food.servingOptions[0];
}

export function parseSmartLine(raw: string): ParsedItem | null {
  const line = normalize(raw.replace(/(\d),(\d)/g, "$1.$2"));
  if (!line) return null;

  let quantity = 1;
  let grams: number | null = null;
  let unitWord: string | null = null;
  let rest = line;

  const gramMatch = rest.match(/^(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|ml|kg|l)\b\s*(?:of\s+)?(.*)$/);
  const numMatch = rest.match(/^(\d+(?:\.\d+)?)\s*(?:x\s*)?(.*)$/);
  const wordMatch = rest.match(/^([a-z]+)\s+(.*)$/);

  if (gramMatch) {
    const value = parseFloat(gramMatch[1]);
    const unit = gramMatch[2];
    grams = unit === "kg" || unit === "l" ? value * 1000 : value;
    rest = gramMatch[3];
  } else if (numMatch) {
    quantity = parseFloat(numMatch[1]);
    rest = numMatch[2];
  } else if (wordMatch && NUMBER_WORDS[wordMatch[1]] !== undefined) {
    quantity = NUMBER_WORDS[wordMatch[1]];
    rest = wordMatch[2];
  }

  const unitMatch = rest.match(new RegExp(`^(${UNIT_WORDS.join("|")})\\s+(?:of\\s+)?(.*)$`));
  if (unitMatch) {
    unitWord = unitMatch[1];
    rest = unitMatch[2];
  }

  const query = rest.trim();
  if (!query) return { ok: false, raw, query: raw, reason: "not_found" };
  if (!(quantity > 0) || quantity > 50 || (grams !== null && (!(grams > 0) || grams > 5000))) {
    return { ok: false, raw, query, reason: "invalid_quantity" };
  }

  const [food] = searchFoods(query, 1);
  // Require a reasonably strong match so "pizza" doesn't silently become "Pazham".
  if (!food || scoreFood(query, getIndex().find((i) => i.food.id === food.id)!) < 35) {
    return { ok: false, raw, query, reason: "not_found" };
  }

  if (grams !== null) {
    const base = per100(food)!;
    const qty = grams / base.grams;
    return { ok: true, raw, food, serving: base, quantity: Math.round(qty * 100) / 100, macros: scaleServing(base, qty) };
  }
  const serving = findServing(food, unitWord);
  return { ok: true, raw, food, serving, quantity, macros: scaleServing(serving, quantity) };
}

/** Parses free text like "2 idli, 3 eggs\n150g chicken breast and 1 banana". */
export function parseSmartInput(text: string): ParsedItem[] {
  return text
    .split(/\n|,|;|\band\b|\+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseSmartLine)
    .filter((x): x is ParsedItem => x !== null);
}

export function formatServing(entry: Pick<FoodLogEntry, "quantity" | "servingLabel" | "servingGrams">): string {
  if (entry.servingGrams === 100 && /^100\s?(g|ml)$/i.test(entry.servingLabel)) {
    const unit = entry.servingLabel.toLowerCase().includes("ml") ? "ml" : "g";
    return `${Math.round(entry.quantity * 100)}${unit}`;
  }
  const q = Number.isInteger(entry.quantity) ? entry.quantity : entry.quantity.toFixed(1);
  return `${q} × ${entry.servingLabel}`;
}

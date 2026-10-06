import type { HeightUnit, WeightUnit } from "./types";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export const kgToLb = (kg: number) => Number(kg) / KG_PER_LB;
export const lbToKg = (lb: number) => Number(lb) * KG_PER_LB;
export const cmToIn = (cm: number) => Number(cm) / CM_PER_IN;
export const inToCm = (inch: number) => Number(inch) * CM_PER_IN;

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cmToIn(cm);
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}

export const ftInToCm = (ft: number, inch: number) => inToCm(ft * 12 + inch);

export const round = (n: number, digits = 1) => {
  const num = Number(n);
  if (isNaN(num)) return 0;
  const f = 10 ** digits;
  return Math.round(num * f) / f;
};

/** Convert a stored kg value into the display unit. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  const num = Number(kg);
  const safeKg = isNaN(num) ? 0 : num;
  return round(unit === "kg" ? safeKg : kgToLb(safeKg), 1);
}

/** Convert a value typed in the display unit back to kg for storage. */
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  const num = Number(value);
  const safeVal = isNaN(num) ? 0 : num;
  return unit === "kg" ? safeVal : lbToKg(safeVal);
}

export function formatWeight(kg: number, unit: WeightUnit, digits = 1): string {
  if (kg == null || Number.isNaN(Number(kg))) return "—";
  const v = unit === "kg" ? Number(kg) : kgToLb(kg);
  return `${v.toFixed(digits).replace(/\.0$/, "")} ${unit === "kg" ? "kg" : "lb"}`;
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  const num = Number(cm);
  const safeCm = isNaN(num) ? 0 : num;
  if (unit === "cm") return `${Math.round(safeCm)} cm`;
  const { ft, inch } = cmToFtIn(safeCm);
  return `${ft}′ ${inch}″`;
}

/** Body measurements: cm when the height unit is cm, inches otherwise. */
export function formatLength(cm: number, unit: HeightUnit): string {
  const num = Number(cm);
  const safeCm = isNaN(num) ? 0 : num;
  return unit === "cm" ? `${round(safeCm, 1)} cm` : `${round(cmToIn(safeCm), 1)}″`;
}

export const lengthUnitLabel = (unit: HeightUnit) => (unit === "cm" ? "cm" : "in");
export const toDisplayLength = (cm: number, unit: HeightUnit) => {
  const num = Number(cm);
  const safeCm = isNaN(num) ? 0 : num;
  return round(unit === "cm" ? safeCm : cmToIn(safeCm), 1);
};
export const fromDisplayLength = (v: number, unit: HeightUnit) => {
  const num = Number(v);
  const safeV = isNaN(num) ? 0 : num;
  return unit === "cm" ? safeV : inToCm(safeV);
};

/** Training volume (stored in kg) in the display unit. */
export function formatVolume(kg: number, unit: WeightUnit): string {
  const num = Number(kg);
  const safeKg = isNaN(num) ? 0 : num;
  return `${formatNumber(unit === "kg" ? safeKg : kgToLb(safeKg))} ${unit}`;
}

export const toDisplayVolume = (kg: number, unit: WeightUnit) => {
  const num = Number(kg);
  const safeKg = isNaN(num) ? 0 : num;
  return Math.round(unit === "kg" ? safeKg : kgToLb(safeKg));
};

export function formatNumber(n: number, digits = 0): string {
  const num = Number(n);
  const safeNum = isNaN(num) ? 0 : num;
  return safeNum.toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function calculateIngredientCost(
  price: number,
  quantity: number,
  unit: string,
  pieceWeightKg: number | null,
  servings: number
): number {
  let result: number;

  if (unit === "piece" && pieceWeightKg) {
    result = price * quantity * pieceWeightKg * servings;
  } else {
    result = price * quantity * servings;
  }

  return Math.round(result * 100) / 100;
}
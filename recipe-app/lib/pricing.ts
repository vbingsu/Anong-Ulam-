export function calculateIngredientCost(
  price: number,
  quantity: number,
  unit: string,
  pieceWeightKg: number | null,
  servings: number
): number {
  const safePrice = Number(price) || 0;
  const safeQty = Number(quantity) || 0;
  const safeServings = Math.max(1, Number(servings) || 1);
  let result: number;

  if (unit === "piece" && pieceWeightKg) {
    result = safePrice * safeQty * (Number(pieceWeightKg) || 0) * safeServings;
  } else {
    result = safePrice * safeQty * safeServings;
  }

  const rounded = Math.round(result * 100) / 100;
  return isNaN(rounded) ? 0 : rounded;
}
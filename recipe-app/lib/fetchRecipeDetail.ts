import { supabase } from "@/lib/supabase";
import { calculateIngredientCost } from "@/lib/pricing";

export type IngredientRow = {
  name: string;
  unit: string;
  price: number;
  is_pantry_staple: boolean;
  quantity: number;
  recipeUnit: string;
  pieceWeightKg: number | null;
  isAvailable: boolean;
};

export type RecipeDetail = {
  id: number;
  name: string;
  instructions: string | null;
  prep_time: string | null;
  ingredientRows: IngredientRow[];
  costToCook: number;
};

export async function fetchRecipeDetail({
  recipeId,
  servings,
  haveIngredients,
}: {
  recipeId: number;
  servings: number;
  haveIngredients: string[];
}): Promise<RecipeDetail | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      id,
      name,
      instructions,
      prep_time,
      recipe_ingredients (
        quantity,
        unit,
        ingredients ( name, unit, price, is_pantry_staple, piece_weight_kg )
      )
    `)
    .eq("id", recipeId)
    .single();

  if (error || !data) {
    console.error("Error fetching recipe:", error?.message);
    return null;
  }

  const ingredientRows: IngredientRow[] = data.recipe_ingredients.map((ri) => {
    const ing = Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients;
    const isAvailable = ing.is_pantry_staple || haveIngredients.includes(ing.name);

    return {
      name: ing.name,
      unit: ing.unit,
      price: ing.price,
      is_pantry_staple: ing.is_pantry_staple,
      quantity: ri.quantity,
      recipeUnit: ri.unit,
      pieceWeightKg: ing.piece_weight_kg,
      isAvailable,
    };
  });

  const costToCook = ingredientRows
    .filter((row) => !row.isAvailable)
    .reduce(
      (sum, row) =>
        sum + calculateIngredientCost(row.price, row.quantity, row.recipeUnit, row.pieceWeightKg, servings),
      0
    );

  return {
    id: data.id,
    name: data.name,
    instructions: data.instructions,
    prep_time: data.prep_time,
    ingredientRows,
    costToCook,
  };
}
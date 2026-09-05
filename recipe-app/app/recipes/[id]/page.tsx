"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { poppins } from "../../fonts";
import { Clock, Users, PhilippinePeso, CircleCheck, Circle } from "lucide-react";
import { calculateIngredientCost } from "@/lib/pricing";

type IngredientRow = {
  name: string;
  unit: string;
  price: number;
  is_pantry_staple: boolean;
  quantity: number;
  recipeUnit: string;
  pieceWeightKg: number | null;
  isAvailable: boolean;
};

type RecipeDetail = {
  id: number;
  name: string;
  instructions: string | null;
  prep_time: string | null;
  ingredientRows: IngredientRow[];
  costToCook: number;
};

export default function RecipeDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const recipeId = params.id as string;
  const servings = Number(searchParams.get("servings") || 1);
  const haveIngredients = (searchParams.get("have") || "")
    .split(",")
    .filter(Boolean);

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipe() {
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

      if (error) {
        console.error("Error fetching recipe:", error.message);
        setLoading(false);
        return;
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
            sum +
            calculateIngredientCost(row.price, row.quantity, row.recipeUnit, row.pieceWeightKg, servings),
          0
        );

      setRecipe({
        id: data.id,
        name: data.name,
        instructions: data.instructions,
        prep_time: data.prep_time,
        ingredientRows,
        costToCook,
      });
      setLoading(false);
    }

    fetchRecipe();
  }, [recipeId, servings, haveIngredients]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-300">
        <p className={`text-sm text-neutral-500 ${poppins.className}`}>Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-300">
        <p className={`text-sm text-neutral-500 ${poppins.className}`}>Recipe not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-300 py-6">
      <div
        className="relative overflow-hidden shadow-2xl rounded-[2.5rem]"
        style={{ width: "390px", minHeight: "844px", backgroundColor: "#5C6B3D" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-1">
          <button onClick={() => router.back()} className={`text-2xl`} style={{ color: "#F5EFE0" }}>
            ←
          </button>
          <p className={`text-xl font-semibold ${poppins.className}`} style={{ color: "#F5EFE0" }}>
            {recipe.name}
          </p>
        </div>

        {/* Meta row */}
        <div className={`flex gap-4 px-5 pt-2 pb-4 text-xs items-center ${poppins.className}`} style={{ color: "#D8CFC0" }}>
          {recipe.prep_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {recipe.prep_time}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {servings}
          </span>
          <span className="flex items-center gap-1 ml-auto font-semibold" style={{ color: "#E7C27D" }}>
            <PhilippinePeso className="w-3.5 h-3.5" /> {recipe.costToCook.toFixed(2)} to cook
          </span>
        </div>

        {/* Ingredients card */}
        <div className="rounded-2xl p-4 mx-4 mb-3.5" style={{ backgroundColor: "#F5EFE0", color: "#3D2E1F" }}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2.5 ${poppins.className}`} style={{ color: "#7A6A56" }}>
            Ingredients
          </p>
          {recipe.ingredientRows.map((row) => {
            const rowCost = calculateIngredientCost(
              row.price,
              row.quantity,
              row.recipeUnit,
              row.pieceWeightKg,
              servings
            );

            return (
              <div key={row.name} className="flex items-center gap-2 py-1.5">
                {row.isAvailable ? (
                  <CircleCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#C1603A" }} />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "#C1603A" }} />
                )}
                <span className={`text-sm ${poppins.className}`} style={row.isAvailable ? {} : { color: "#B5A98F" }}>
                  {row.name}{" "}
                  <span style={{ color: "#7A6A56" }}>
                    · {row.quantity * servings} {row.recipeUnit}
                  </span>
                  {row.is_pantry_staple && (
                    <span className="text-xs ml-1" style={{ color: "#B5A98F" }}>
                      (pantry item)
                    </span>
                  )}
                  {!row.isAvailable && (
                    <span className={`text-sm font-medium ${poppins.className}`} style={{ color: "#C1603A" }}>
                      {" "}· ₱{rowCost.toFixed(2)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Instructions card */}
        {recipe.instructions && (
          <div className="rounded-2xl p-4 mx-4 mb-5" style={{ backgroundColor: "#F5EFE0", color: "#3D2E1F" }}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2.5 ${poppins.className}`} style={{ color: "#7A6A56" }}>
              Instructions
            </p>
            {recipe.instructions.split("\n").filter(Boolean).map((step, index) => (
              <div key={index} className="flex gap-2.5 mb-3 last:mb-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: "#5C6B3D", color: "#F5EFE0" }}
                >
                  {index + 1}
                </div>
                <p className={`text-sm leading-relaxed ${poppins.className}`}>{step}</p>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 pb-6">
          <button
            onClick={() => router.back()}
            className={`w-full rounded-full py-3 text-sm font-semibold ${poppins.className} cursor-pointer`}
            style={{ backgroundColor: "#C1603A", color: "#F5EFE0" }}
          >
            Back to results
          </button>
        </div>
      </div>
    </div>
  );
}
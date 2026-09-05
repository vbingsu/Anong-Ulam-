"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { moreSugar, poppins } from "../fonts";
import { Users, Clock } from "lucide-react";
import Link from "next/link";
import { calculateIngredientCost } from "@/lib/pricing";

type RecipeResult = {
  id: number;
  name: string;
  prep_time: string | null;
  haveList: string[];
  missingList: { name: string; price: number }[];
  costToCook: number;
};

export default function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const budget = Number(searchParams.get("budget") || 0);
  const servings = Number(searchParams.get("servings") || 1);
  const haveIngredients = (searchParams.get("have") || "")
    .split(",")
    .filter(Boolean);

  const [results, setResults] = useState<RecipeResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndMatch() {
      const { data, error } = await supabase.from("recipes").select(`
        id,
        name,
        prep_time,
        recipe_ingredients (
          quantity,
          unit,
          ingredients ( name, price, is_pantry_staple, piece_weight_kg )
        )
      `);

      if (error) {
        console.error("Error fetching recipes:", error.message);
        setLoading(false);
        return;
      }

      const matched: RecipeResult[] = data.map((recipe) => {
        const haveList: string[] = [];
        const missingList: { name: string; price: number }[] = [];

        recipe.recipe_ingredients.forEach((ri) => {
          const ingredient = Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients;
          const ingredientName = ingredient.name;

          if (ingredient.is_pantry_staple || haveIngredients.includes(ingredientName)) {
            haveList.push(ingredientName);
          } else {
            missingList.push({
              name: ingredientName,
              price: calculateIngredientCost(ingredient.price, ri.quantity, ri.unit, ingredient.piece_weight_kg, servings),
            });
          }
        });

        const costToCook = missingList.reduce((sum, item) => sum + item.price, 0);

        return {
          id: recipe.id,
          name: recipe.name,
          prep_time: recipe.prep_time,
          haveList,
          missingList,
          costToCook,
        };
      });

      const withinBudget = matched
        .filter((r) => r.costToCook <= budget)
        .sort((a, b) => a.costToCook - b.costToCook);

      setResults(withinBudget);
      setLoading(false);
    }

    fetchAndMatch();
  }, [budget, servings, haveIngredients]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-300 py-6">
      <div
        className="relative overflow-hidden shadow-2xl rounded-[2.5rem]"
        style={{ width: "390px", minHeight: "844px", backgroundColor: "#5C6B3D" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <button onClick={() => router.push("/")} className={`text-2xl text-[#F5EFE0]`}>
            ←
          </button>
          <div>
            <p className={`text-xl font-semibold ${poppins.className}`} style={{ color: "#F5EFE0" }}>
              Here&apos;s what you can cook
            </p>
            <p className={`text-sm`} style={{ color: "#D8CFC0" }}>
              {loading
                ? "Finding recipes..."
                : `${results.length} recipe${results.length !== 1 ? "s" : ""} fit your ₱${budget} budget`}
            </p>
          </div>
        </div>

        <p className={`text-sm px-5 pb-4 text-justify`} style={{ color: "#B8C29A" }}>
          Common pantry items (cooking oil, soy sauce, vinegar, salt, and pepper) are assumed available and are not included in the final cost.
        </p>

        {/* Recipe cards */}
        <div className="px-4 pb-8 space-y-3">
          {loading ? (
            <p className={`text-sm text-white/80 px-2`}>Loading...</p>
          ) : results.length === 0 ? (
            <p className={`text-sm text-white/80 px-2`}>
              No recipes fit that budget with your current ingredients yet — try raising your budget or adding more ingredients you have.
            </p>
          ) : (
            results.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: "#F5EFE0", color: "#3D2E1F" }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`font-semibold text-lg`}>{recipe.name}</p>
                    <p className={`text-sm flex items-center gap-1`} style={{ color: "#7A6A56" }}>
                      <Clock className="w-3.5 h-3.5" />
                      {recipe.prep_time && <span>{recipe.prep_time} ·</span>}
                      <Users className="w-3.5 h-3.5" />
                      {servings}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs`} style={{ color: "#7A6A56" }}>
                      cook for
                    </p>
                    <p className={`text-lg font-bold`} style={{ color: "#C1603A" }}>
                      ₱{recipe.costToCook.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {recipe.haveList.map((name) => (
                    <span
                      key={name}
                      className={`text-xs px-2.5 py-1 rounded-full`}
                      style={{ backgroundColor: "#5C6B3D", color: "#F5EFE0" }}
                    >
                      ✓ {name}
                    </span>
                  ))}
                  {recipe.missingList.map((item) => (
                    <span
                      key={item.name}
                      className={`text-xs px-2.5 py-1 rounded-full border`}
                      style={{ borderColor: "#B5A98F", color: "#7A6A56" }}
                    >
                      + {item.name}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/recipes/${recipe.id}?have=${encodeURIComponent(haveIngredients.join(","))}&servings=${servings}`}
                  className={`w-full block text-center rounded-full py-2 text-sm font-semibold`}
                  style={{ backgroundColor: "#C1603A", color: "#F5EFE0" }}
                >
                  View recipe
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { poppins } from "../fonts";
import { Users, Clock, ArrowLeft } from "lucide-react";
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

function RecipeCard({
  recipe,
  servings,
  haveIngredients,
  budget,
  dimmed = false,
}: {
  recipe: RecipeResult;
  servings: number;
  haveIngredients: string[];
  budget: number;
  dimmed?: boolean;
}) {
  const shortfall = recipe.costToCook - budget;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "#F5EFE0", color: "#3D2E1F", opacity: dimmed ? 0.7 : 1 }}
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
            Estimated cost:
          </p>
          <p className={`text-lg font-bold`} style={{ color: "#C1603A" }}>
            ₱{recipe.costToCook.toFixed(2)}
          </p>
          {dimmed && shortfall > 0 && (
            <p className={`text-xs`} style={{ color: "#B5745C" }}>
              ₱{shortfall.toFixed(2)} short
            </p>
          )}
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
        style={
          dimmed
            ? { backgroundColor: "transparent", border: "1px solid #C1603A", color: "#C1603A" }
            : { backgroundColor: "#C1603A", color: "#F5EFE0" }
        }
      >
        View recipe
      </Link>
    </div>
  );
}

export default function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawBudget = Number(searchParams.get("budget"));
  const budget = !isNaN(rawBudget) && rawBudget >= 0 ? rawBudget : 0;

  const rawServings = Number(searchParams.get("servings"));
  const servings = !isNaN(rawServings) && rawServings >= 1 ? Math.floor(rawServings) : 1;
  const haveIngredients = (searchParams.get("have") || "")
    .split(",")
    .filter(Boolean);

  const [affordable, setAffordable] = useState<RecipeResult[]>([]);
  const [closeCalls, setCloseCalls] = useState<RecipeResult[]>([]);
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

      const overBudget = matched
        .filter((r) => r.costToCook > budget)
        .sort((a, b) => a.costToCook - b.costToCook);

      setAffordable(withinBudget);
      setCloseCalls(overBudget);
      setLoading(false);
    }

    fetchAndMatch();
  }, [budget, servings, haveIngredients]);

  return (
    <main className="min-h-dvh flex items-start justify-center bg-neutral-200 sm:bg-neutral-300 sm:py-6">
      <div
        className="w-full sm:max-w-[420px] min-h-dvh sm:min-h-[844px] flex flex-col sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative"
        style={{ backgroundColor: "#5C6B3D" }}
      >
        {/* Sticky Header */}
        <header
          className="sticky top-0 z-20 px-4 sm:px-5 pt-5 pb-3.5 flex items-center gap-3 backdrop-blur-md shadow-sm"
          style={{ backgroundColor: "rgba(92, 107, 61, 0.96)" }}
        >
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-full text-[#F5EFE0] hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className={`text-lg sm:text-xl font-semibold ${poppins.className}`} style={{ color: "#F5EFE0" }}>
              Here&apos;s what you can cook
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: "#D8CFC0" }}>
              {loading
                ? "Finding recipes..."
                : `${affordable.length} recipe${affordable.length !== 1 ? "s" : ""} fit your ₱${budget} budget`}
            </p>
          </div>
        </header>

        <p className="text-xs sm:text-sm px-5 pt-2 pb-3 text-justify leading-relaxed" style={{ color: "#D4DEBC" }}>
          Common pantry items (cooking oil, soy sauce, vinegar, salt, and pepper) are assumed available and are not included in the final cost.
        </p>

        {/* Recipe cards */}
        <div className="flex-1 px-4 pb-8 space-y-3">
          {loading ? (
            <p className={`text-sm text-white/80 px-2`}>Loading...</p>
          ) : affordable.length === 0 && closeCalls.length === 0 ? (
            <p className={`text-sm text-white/80 px-2`}>
              No recipes fit that budget with your current ingredients yet — try raising your budget or adding more ingredients you have.
            </p>
          ) : (
            <>
              {affordable.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  servings={servings}
                  haveIngredients={haveIngredients}
                  budget={budget}
                />
              ))}

              {closeCalls.length > 0 && (
                <>
                  <p className={`text-xs ${poppins.className} px-1 pt-2`} style={{ color: "#D4DEBC" }}>
                    A little out of reach for now
                  </p>
                  {closeCalls.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      servings={servings}
                      haveIngredients={haveIngredients}
                      budget={budget}
                      dimmed
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
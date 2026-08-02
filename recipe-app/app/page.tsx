"use client";

import { useState } from "react";

// Temporary hardcoded list — this will come from your Supabase
// ingredients table once that's connected. For now, mock data lets
// us build and test the UI without waiting on the database.
const COMMON_INGREDIENTS = [
  "Chicken", "Rice", "Eggs", "Garlic", "Onion",
  "Soy Sauce", "Cooking Oil", "Pork", "Tomato", "Potato",
];

export default function Home() {
  const [budget, setBudget] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [haveIngredients, setHaveIngredients] = useState<string[]>([]);

  function toggleIngredient(name: string) {
    setHaveIngredients((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name) // already selected -> remove it
        : [...prev, name]                       // not selected -> add it
    );
  }

  const filteredCommon = COMMON_INGREDIENTS.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Anong Ulam?</h1>

      {/* Budget input */}
      <div>
        <label className="block font-medium mb-1">Your budget (₱)</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="e.g. 150"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Search bar */}
      <div>
        <label className="block font-medium mb-1">Search ingredients</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search..."
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Quick-tap common ingredients */}
      <div>
        <p className="font-medium mb-2">Tap what you already have:</p>
        <div className="flex flex-wrap gap-2">
          {filteredCommon.map((item) => {
            const isSelected = haveIngredients.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  isSelected
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected summary */}
      {haveIngredients.length > 0 && (
        <div className="text-sm text-gray-600">
          You have: {haveIngredients.join(", ")}
        </div>
      )}
    </main>
  );
}
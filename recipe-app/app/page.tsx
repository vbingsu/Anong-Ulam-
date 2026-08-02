"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  price: number;
};

export default function Home() {
  const [budget, setBudget] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [haveIngredients, setHaveIngredients] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIngredients() {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching ingredients:", error.message);
      } else {
        setIngredients(data);
      }
      setLoading(false);
    }

    fetchIngredients();
  }, []);

  function toggleIngredient(name: string) {
    setHaveIngredients((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  }

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Anong Ulam?</h1>

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

      <div>
        <p className="font-medium mb-2">Tap what you already have:</p>
        {loading ? (
          <p className="text-sm text-gray-500">Loading ingredients...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredIngredients.map((item) => {
              const isSelected = haveIngredients.includes(item.name);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleIngredient(item.name)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    isSelected
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {item.name} (₱{item.price}/{item.unit})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {haveIngredients.length > 0 && (
        <div className="text-sm text-gray-600">
          You have: {haveIngredients.join(", ")}
        </div>
      )}
    </main>
  );
}
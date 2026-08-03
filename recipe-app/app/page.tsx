"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { moreSugar, poppins } from "./fonts";
import { Search, PhilippinePeso} from "lucide-react";

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
  const [showFullList, setShowFullList] = useState(false);

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

  const haveText = haveIngredients.join(", ");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-300 py-6">
      <div
        className="relative overflow-hidden shadow-2xl rounded-[2.5rem]"
        style={{ width: "390px", height: "844px", backgroundColor: "#F5EFE0" }}
      >
        {/* Header */}
        <div className="text-center pt-10 pb-6 px-6" style={{ height: "160px" }}>
          <h1 className={`text-5xl font-bold mb-2 mt-10  ${moreSugar.className}`} style={{ color: "#3d2e1f" }}>
            Anong Ulam?
          </h1>
          <Image
            src="/logo.svg"
            alt="Anong Ulam logo"
            width={120}
            height={120}
            unoptimized
            className="mx-auto mb-2"
          />
        </div>

        {/* Green sheet — no longer scrolls itself, content inside is static now */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-[2.5rem] flex flex-col px-6 pt-8"
          style={{ height: "585px", backgroundColor: "#5C6B3D" }}
        >
          <label className={`block text-white ${poppins.className} font-medium mb-2`}>
            My Budget
          </label>
          <div className="relative mb-4">
            <PhilippinePeso className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0"
              className="w-full rounded-full pl-10 pr-4 py-3 outline-none"
              style={{ backgroundColor: "#F5FBE8" }}
            />
          </div>

          <label className={`block text-white font-medium mb-2 ${poppins.className}`}>
            My available ingredients
          </label>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="search ingredients..."
              className="w-full rounded-full pl-10 pr-4 py-3 outline-none"
              style={{ backgroundColor: "#F5FBE8" }}
            />
          </div>

          {/* Scrollable ingredients box — its own distinct area now */}
          <div
            className="h-37 overflow-y-auto rounded-2xl p-3 mb-4 ingredients-scroll"
            style={{ backgroundColor: "#4d5933" }}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-white/80">Loading ingredients...</p>
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-white/80 text-center">
                  No ingredient matched &quot;{searchTerm}&quot;.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredIngredients.map((item) => {
                  const isSelected = haveIngredients.includes(item.name);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleIngredient(item.name)}
                      className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-colors"
                      style={
                        isSelected
                          ? { backgroundColor: "#F5FBE8", color: "#3F6212" }
                          : {
                              backgroundColor: "transparent",
                              color: "#F5FBE8",
                              border: "1.5px solid #F5FBE8",
                            }
                      }
                    >
                      {isSelected && "✓ "}
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed footer zone: "have" summary + button */}
          <div className="pb-8 pt-1">
              <div
                className="relative mb-4"
                onMouseEnter={() => setShowFullList(true)}
                onMouseLeave={() => setShowFullList(false)}
              >
                <p
                  onClick={() => setShowFullList((prev) => !prev)}
                  className="text-sm text-white/90 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
                  title={haveText || "None"}
                >
                  I already have: {haveText || "None"}
                </p>

                {showFullList && haveIngredients.length > 0 && (
                  <div
                    className="absolute bottom-full left-0 mb-2 rounded-lg px-3 py-2 text-sm shadow-lg z-10"
                    style={{ backgroundColor: "#F5FBE8", color: "#3D2E1F", width: "calc(100% - 0px)" }}
                  >
                    {haveText}
                  </div>
                )}
              </div>

            <button
              className="w-full rounded-full py-4 font-bold text-white text-lg"
              style={{ backgroundColor: "#C1603A" }}
            >
              Find my Ulam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
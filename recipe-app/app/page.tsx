"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { moreSugar, poppins } from "./fonts";
import { Search, PhilippinePeso } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [servings, setServings] = useState("");
  const router = useRouter();

  function handleFindUlam() {
    const params = new URLSearchParams({
      budget: budget || "0",
      servings: servings || "1",
      have: haveIngredients.join(","),
    });
    router.push(`/results?${params.toString()}`);
  }

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
    <main className="min-h-dvh flex items-start justify-center bg-neutral-200 sm:bg-neutral-300 sm:py-6">
      <div
        className="w-full sm:max-w-[420px] min-h-dvh sm:min-h-[844px] flex flex-col sm:rounded-[2.5rem] shadow-2xl relative"
        style={{ backgroundColor: "#F5EFE0" }}
      >
        {/* Header — same title-then-logo order and centering as before */}
        <header className="flex-shrink-0 text-center pt-16 sm:pt-10 sm:pb-6 px-6">
          <h1 className={`text-5xl font-bold mb-2 ${moreSugar.className}`} style={{ color: "#3d2e1f" }}>
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
        </header>

        {/* Green sheet — flex-1 fills remaining space */}
        <section
          className="flex-1 flex flex-col rounded-t-[2.5rem] px-6 pt-8 pb-6 overflow-hidden min-h-0"
          style={{ backgroundColor: "#5C6B3D" }}
        >
          <div className="flex-shrink-0 flex gap-3 mb-4">
            <div className="flex-1">
              <label className={`block text-white ${poppins.className} font-medium mb-2 pl-1`}>
                My Budget
              </label>
              <div className="relative">
                <PhilippinePeso className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*(\.\d{0,2})?$/.test(val)) {
                      setBudget(val);
                    }
                  }}
                  placeholder="150"
                  className="w-full rounded-full pl-10 pr-4 py-3 outline-none"
                  style={{ backgroundColor: "#F5FBE8" }}
                />
              </div>
            </div>

            <div className="w-24">
              <label className={`block text-white ${poppins.className} font-medium mb-2 pl-1`}>
                People
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={servings}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*$/.test(val)) {
                    setServings(val);
                  }
                }}
                placeholder="1"
                className="w-full rounded-full px-4 py-3 outline-none text-center"
                style={{ backgroundColor: "#F5FBE8" }}
              />
            </div>
          </div>

          <div className="flex-shrink-0 mb-4">
            <label className={`block text-white font-medium mb-2 ${poppins.className} pl-1`}>
              Ingredients I Already Have
            </label>
            <div className="relative">
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
          </div>

          {/* Scrollable ingredients box — the ONLY scrollable area on this page */}
          <div
            className="h-38 overflow-y-auto rounded-2xl p-3 mb-4 ingredients-scroll"
            style={{ backgroundColor: "#434D2D" }}
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
                      className={`px-4 py-2 rounded-full ${poppins.className} text-sm font-medium flex items-center gap-1 transition-colors cursor-pointer active:scale-95`}
                      style={
                        isSelected
                          ? { backgroundColor: "#F5FBE8", color: "#3F6212" }
                          : {
                              backgroundColor: "rgba(255, 255, 255, 0.10)",
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
          <footer className="flex-shrink-0 pt-1">
            <div
              className="relative mb-4"
              onMouseEnter={() => setShowFullList(true)}
              onMouseLeave={() => setShowFullList(false)}
            >
              <div className="flex items-center justify-between">
                <p
                  onClick={() => setShowFullList((prev) => !prev)}
                  className={`text-sm ${poppins.className} text-white/90 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer flex-1`}
                  title={haveText || "None"}
                >
                  I already have: {haveText || "None"}
                </p>

                {haveIngredients.length > 0 && (
                  <button
                    onClick={() => setHaveIngredients([])}
                    className={`text-sm ${poppins.className} text-white/60 underline ml-3 shrink-0 cursor-pointer hover:text-white`}
                  >
                    Clear
                  </button>
                )}
              </div>

              {showFullList && haveIngredients.length > 0 && (
                <div
                  className="absolute bottom-full left-0 mb-2 rounded-lg px-3 py-2 text-sm shadow-lg z-10"
                  style={{ backgroundColor: "#F5FBE8", color: "#3D2E1F", width: "100%" }}
                >
                  {haveText}
                </div>
              )}
            </div>

            <button
              onClick={handleFindUlam}
              className={`w-full rounded-full py-4 font-bold text-white text-lg ${poppins.className} cursor-pointer active:scale-[0.98] transition-transform shadow-md`}
              style={{ backgroundColor: "#C1603A" }}
            >
              Find my Ulam
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
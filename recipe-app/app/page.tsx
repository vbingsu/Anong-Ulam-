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
    <main
      className="min-h-dvh flex items-center justify-center bg-[#E7E0D0] lg:h-dvh lg:p-0 lg:overflow-hidden"
      style={{ backgroundColor: "#E7E0D0" }}
    >
      <div
        className="w-full sm:max-w-[420px] min-h-dvh sm:min-h-[844px] flex flex-col relative overflow-hidden shadow-2xl lg:max-w-none lg:min-h-0 lg:h-dvh lg:shadow-none lg:grid lg:grid-cols-[0.75fr_1.25fr] lg:rounded-none"
        style={{ backgroundColor: "#F5EFE0" }}
      >
        {/* Desktop brand panel — now cream, matching the mobile header's palette */}
        <aside
          className="hidden lg:flex flex-col justify-between p-12 xl:p-14 lg:shadow-[4px_0_16px_rgba(0,0,0,0.08)] lg:relative z-10"
          style={{ backgroundColor: "#F5EFE0" }}
        >
          <div>
            <Image
              src="/logo.svg"
              alt="Anong Ulam logo"
              width={150}
              height={150}
              unoptimized
              className="mb-7"
            />
            <h1
              className={`text-6xl xl:text-7xl font-bold leading-[0.95] ${moreSugar.className}`}
              style={{ color: "#3D2E1F" }}
            >
              Anong
              <br />
              Ulam?
            </h1>
            <div className="w-16 h-1 rounded-full my-8" style={{ backgroundColor: "#C1603A" }} />
            <p className={`max-w-md text-xl leading-relaxed ${poppins.className}`} style={{ color: "#7A6A56" }}>
              Find something affordable, filling, and delicious with whatever budget and ingredients you have.
            </p>
          </div>

          <div className={`text-sm leading-relaxed ${poppins.className}`} style={{ color: "#9C8E77" }}>
            <p className="font-medium" style={{ color: "#3D2E1F" }}>
              Budget-friendly meals, made simple.
            </p>
            <p className="mt-1">Start with your budget. We&apos;ll handle the ulam.</p>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="flex-shrink-0 text-center pt-16 sm:pt-10 sm:pb-6 px-6 lg:hidden">
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

        {/* Form / ingredient area */}
        <section
          className="flex-1 flex flex-col rounded-t-[2.5rem] px-6 pt-8 pb-6 overflow-hidden min-h-0 lg:rounded-none lg:px-10 xl:px-14 lg:pt-12 lg:pb-12 lg:h-full"
          style={{ backgroundColor: "#5C6B3D" }}
        >
          <div className="hidden lg:block flex-shrink-0 mb-8">
            <p className={`text-sm uppercase tracking-[0.16em] font-semibold ${poppins.className}`} style={{ color: "#E4EACF" }}>
              Let&apos;s find your ulam
            </p>
            <h2 className={`text-3xl xl:text-4xl font-semibold mt-2 ${poppins.className}`} style={{ color: "#F5FBE8" }}>
              What are we working with?
            </h2>
          </div>

          <div className="flex-shrink-0 grid grid-cols-[1fr_6rem] gap-3 mb-5 lg:grid-cols-2 lg:gap-5 lg:mb-8">
            <div>
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
                  className={`w-full rounded-xl lg:rounded-2xl pl-10 pr-4 py-3.5 outline-none ${poppins.className}`}
                  style={{ backgroundColor: "#F5FBE8" }}
                />
              </div>
            </div>

            <div>
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
                className={`w-full rounded-xl lg:rounded-2xl px-4 py-3.5 outline-none text-center ${poppins.className}`}
                style={{ backgroundColor: "#F5FBE8" }}
              />
            </div>
          </div>

          <div className="flex-shrink-0 mb-4 lg:mb-5">
            <div className="flex items-end justify-between mb-2">
              <label className={`block text-white font-medium ${poppins.className} pl-1`}>
                Ingredients I Already Have
              </label>
              <span className={`hidden lg:block text-xs ${poppins.className}`} style={{ color: "rgba(245,251,232,0.65)" }}>
                Select all that apply
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ingredients..."
                className={`w-full rounded-xl lg:rounded-2xl pl-10 pr-4 py-3.5 outline-none ${poppins.className}`}
                style={{ backgroundColor: "#F5FBE8" }}
              />
            </div>
          </div>

          {/* Scrollable ingredients area — the only thing that scrolls */}
          <div
            className="h-39 lg:flex-1 lg:min-h-0 overflow-y-auto rounded-2xl lg:rounded-3xl p-3.5 lg:p-5 mb-4 lg:mb-6 ingredients-scroll"
            style={{ backgroundColor: "#434D2D" }}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className={`text-sm ${poppins.className}`} style={{ color: "rgba(255,255,255,0.8)" }}>
                  Loading ingredients...
                </p>
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className={`text-sm text-center ${poppins.className}`} style={{ color: "rgba(255,255,255,0.8)" }}>
                  No ingredient matched &quot;{searchTerm}&quot;.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap content-start gap-2.5 lg:gap-2.5">
                {filteredIngredients.map((item) => {
                  const isSelected = haveIngredients.includes(item.name);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleIngredient(item.name)}
                      className={`px-3.5 py-2 lg:px-3.5 lg:py-2 rounded-lg ${poppins.className} text-sm font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95`}
                      style={
                        isSelected
                          ? { backgroundColor: "#F5FBE8", color: "#3F6212" }
                          : {
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#F5FBE8",
                              border: "1px solid rgba(245,251,232,0.55)",
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

          {/* Summary + CTA — anchored, never scrolls off */}
          <footer className="flex-shrink-0 pt-1 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-6">
            <div
              className="relative mb-4 lg:mb-0 lg:min-w-0"
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
                  className="absolute bottom-full left-0 mb-2 rounded-xl px-3 py-2 text-sm shadow-lg z-10"
                  style={{ backgroundColor: "#F5FBE8", color: "#3D2E1F", width: "100%" }}
                >
                  {haveText}
                </div>
              )}
            </div>

            <button
              onClick={handleFindUlam}
              className={`w-full lg:w-auto lg:min-w-52 rounded-xl lg:rounded-2xl py-4 px-7 font-bold text-white text-lg ${poppins.className} cursor-pointer active:scale-[0.98] transition-transform shadow-md`}
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
import io
import re
import pandas as pd
import requests
from bs4 import BeautifulSoup
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

load_dotenv()

supabase_url = os.environ["SUPABASE_URL"]
supabase_key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(supabase_url, supabase_key)


def update_supabase_prices(df: pd.DataFrame, da_reported_date: str | None):
    updated_count = 0
    skipped_count = 0

    for _, row in df.iterrows():
        ingredient_name = row["Commodity"]
        price = row["final_price"]

        if pd.isna(price):
            print(f"Skipping {ingredient_name} — no price data.")
            skipped_count += 1
            continue

        result = (
            supabase.table("ingredients")
            .update({
                "price": round(float(price), 2),
                "last_updated": datetime.now().isoformat(),
                "da_reported_date": da_reported_date,
            })
            .eq("name", ingredient_name)
            .execute()
        )

        if not result.data:
            print(f"⚠ No matching ingredient found in Supabase for: {ingredient_name}")
        else:
            print(f"Updated {ingredient_name}: ₱{price}")
            updated_count += 1

    print(f"\nDone. {updated_count} updated, {skipped_count} skipped.")


def fetch_market_headers(commodity_id: int, region_id: str = "030000000") -> list[str]:
    """Fetch the actual market column names for a given commodity category.
    Market order/count differs per category, so this must be fetched fresh
    each time rather than assumed to be fixed."""
    url = "http://www.bantaypresyo.da.gov.ph/tbl_price_get_comm_header_veg.php"

    headers = {
        "Accept": "text/html, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "http://www.bantaypresyo.da.gov.ph",
        "Referer": "http://www.bantaypresyo.da.gov.ph/tbl_veg.php",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/151.0.0.0 Safari/537.36"
        ),
        "X-Requested-With": "XMLHttpRequest",
    }

    payload = {"commodity": commodity_id, "region": region_id}

    response = requests.post(url, data=payload, headers=headers)
    response.raise_for_status()

    tables = pd.read_html(io.StringIO(f"<table>{response.text}</table>"))

    if not tables:
        raise ValueError(f"No header table found for commodity_id={commodity_id}")

    # pandas treats <th> cells as column headers, not data rows —
    # so the market names ARE the columns, not a row inside the table.
    header_row = tables[0].columns.tolist()
    return [str(h).strip() for h in header_row]


def find_malolos_column_indices(commodity_id: int, region_id: str = "030000000") -> tuple[int, int]:
    """Dynamically locate which column indices correspond to the two Malolos markets,
    since this shifts depending on the commodity category."""
    headers = fetch_market_headers(commodity_id=commodity_id, region_id=region_id)

    market1_idx = next(
        (i for i, h in enumerate(headers) if "malolos city public market" in h.lower()), None
    )
    market2_idx = next(
        (i for i, h in enumerate(headers) if "city of malolos public market" in h.lower()), None
    )

    if market1_idx is None or market2_idx is None:
        raise ValueError(
            f"Could not find Malolos columns for commodity_id={commodity_id}. "
            f"Available headers: {headers}"
        )

    return market1_idx, market2_idx


def fetch_commodity_prices(commodity_id: int, region_id: str = "030000000"):
    url = "http://www.bantaypresyo.da.gov.ph/tbl_price_get_comm_price_veg.php"

    headers = {
        "Accept": "text/html, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "http://www.bantaypresyo.da.gov.ph",
        "Referer": "http://www.bantaypresyo.da.gov.ph/tbl_veg.php",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/151.0.0.0 Safari/537.36"
        ),
        "X-Requested-With": "XMLHttpRequest",
    }

    payload = {"commodity": commodity_id, "region": region_id}

    response = requests.post(url, data=payload, headers=headers)
    response.raise_for_status()

    tables = pd.read_html(io.StringIO(f"<table>{response.text}</table>"))
    if not tables:
        raise ValueError("No tabular data found in the response.")

    df = tables[0]

    # Dynamically find the right columns for THIS specific category,
    # instead of assuming a fixed position across all categories.
    market1_idx, market2_idx = find_malolos_column_indices(commodity_id, region_id)

    df = df.iloc[:, [0, 1, market1_idx, market2_idx]]
    df.columns = [
        "Commodity",
        "Specification",
        "Malolos City Public Market",
        "City of Malolos Public Market",
    ]

    return df


def fetch_last_updated_date(page_url: str = "http://www.bantaypresyo.da.gov.ph/tbl_veg.php") -> str | None:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/151.0.0.0 Safari/537.36"
        ),
    }

    response = requests.get(page_url, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    date_span = soup.find("span", id="get_date")

    return date_span.get_text(strip=True) if date_span else None

def parse_da_date(date_str: str | None) -> str | None:
    """Convert DA's 'September 03, 2026' format into ISO format (2026-09-03)
    that Postgres's date type expects."""
    if not date_str:
        return None
    parsed = datetime.strptime(date_str, "%B %d, %Y")
    return parsed.date().isoformat()


def compute_average_price(row):
    market1 = row["Malolos City Public Market"]
    market2 = row["City of Malolos Public Market"]

    if pd.isna(market1) and pd.isna(market2):
        return None
    elif pd.isna(market1):
        result = market2
    elif pd.isna(market2):
        result = market1
    else:
        result = (market1 + market2) / 2

    return round(result, 2)

# Maps YOUR ingredient name -> the ONE specific DA commodity name
# you've decided best represents what people typically buy.
# Anything not listed here is disregarded for now.
COMMODITY_NAME_MAP = {
    # Highland Vegetables
    "Cabbage": "Cabbage (Scorpio)",
    "Carrot": "Carrots",
    "Potato": "White Potato",
    "Sayote": "Chayote",
    "Habichuelas (Baguio Bean)": "Habichuelas (Baguio Bean)",
    "Pechay Baguio": "Pechay (Baguio)",
    "Broccoli": "Broccoli",
    "Cauliflower": "Cauliflower",
    "Bell Pepper": "Bell Pepper (Red)",

    # Lowland Vegetables
    "Tomato": "Tomato",
    "Eggplant": "Eggplant",
    "Sitaw": "Sitao",
    "Pechay Tagalog": "Pechay (Native)",
    "Ampalaya": "Ampalaya",
    "Kalabasa": "Squash",

    # Meat & Poultry
    "Chicken": "Whole Chicken",
    "Pork": "Pork Belly (Liempo)",
    "Beef": "Beef Brisket",
    "Eggs": "Chicken Egg (White, Medium)",

    # Fish
    "Bangus": "Bangus (Medium)",
    "Galunggong": "Galunggong(Local)",
    "Tilapia": "Tilapia",
    "Pusit": "Squid (Pusit Bisaya)",
    "Salmon Head": "Salmon Head",

    # Legumes
    "Munggo": "Mungbean",

    # Corn
    "Mais": "Corn (Yellow)",

    # Spices
    "Garlic": "Garlic(Imported)",
    "Red Onion": "Red Onion",
    "White Onion": "White Onion",
    "Siling Labuyo": "Chili (Red)",
    "Luya": "Ginger",
}


def map_chosen_varieties(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only the specific DA commodity entries chosen as representative."""
    reverse_map = {da_name: canonical for canonical, da_name in COMMODITY_NAME_MAP.items()}

    df = df.copy()
    df["canonical_name"] = df["Commodity"].map(reverse_map)
    df = df.dropna(subset=["canonical_name"])

    return df[["canonical_name", "average_price"]].rename(
        columns={"canonical_name": "Commodity", "average_price": "final_price"}
    )


def get_malolos_prices(commodity_id: int, region_id: str = "030000000"):
    """Fetch, clean, average, and map Malolos prices for a given commodity category."""
    df = fetch_commodity_prices(commodity_id=commodity_id, region_id=region_id)

    df["average_price"] = df.apply(compute_average_price, axis=1)
    df = df.dropna(subset=["average_price"])

    return map_chosen_varieties(df)


COMMODITY_IDS = {
    "rice": 1,
    "corn": 2,
    "legumes": 3,
    "fish": 4,
    "fruits": 5,
    "highland_vegetables": 6,
    "lowland_vegetables": 7,
    "meat_and_poultry": 8,
    "spices": 9,
    "other_commodities": 10,
}


def get_all_prices(categories: list[str] | None = None) -> pd.DataFrame:
    """Fetch and combine prices across multiple commodity categories.

    Pass a list of category names (keys from COMMODITY_IDS) to limit which
    categories are fetched, or leave as None to fetch all of them.
    """
    selected = categories or list(COMMODITY_IDS.keys())
    all_dfs = []

    for category in selected:
        commodity_id = COMMODITY_IDS[category]
        print(f"Fetching {category} (commodity_id={commodity_id})...")
        try:
            df = get_malolos_prices(commodity_id=commodity_id)
            df["category"] = category
            all_dfs.append(df)
        except Exception as e:
            print(f"⚠ Failed to fetch {category}: {e}")

    if not all_dfs:
        return pd.DataFrame(columns=["Commodity", "final_price", "category"])

    return pd.concat(all_dfs, ignore_index=True)


if __name__ == "__main__":
    da_updated_date_raw = fetch_last_updated_date()
    da_updated_date = parse_da_date(da_updated_date_raw)
    print(f"DA data as of: {da_updated_date}")

    all_prices = get_all_prices(categories=[
        "meat_and_poultry", "highland_vegetables", "lowland_vegetables",
        "fish", "legumes", "corn", "spices"
    ])

    print("\n--- Final Combined Prices ---")
    print(all_prices.to_string(index=False))

    print("\n--- Updating Supabase ---")
    update_supabase_prices(all_prices, da_updated_date)
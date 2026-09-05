from bs4 import BeautifulSoup
import requests

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

print (fetch_last_updated_date())
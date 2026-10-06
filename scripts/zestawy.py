"""Zestawy „praca wzorcowa + przewodnik kierunkowy" w aws-lambda/products.json.

Zestaw to zwykły produkt wieloplikowy (`files`): pliki pracy + ZIP ebooka kierunku.
Lambdy (create-checkout, webhook-handler, get-download) obsługują go bez zmian w kodzie.

Uruchamiać po każdym dodaniu pracy albo ebooka kierunkowego, a potem przeładować
trzy lambdy (update-function-code z nową kopią products.json). Skrypt jest
idempotentny: usuwa wszystkie `zestaw-*` i buduje je od nowa z danych źródłowych.

    python scripts/zestawy.py
"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS = os.path.join(ROOT, "aws-lambda", "products.json")
PRACE = os.path.join(ROOT, "src", "data", "prace.json")
EBOOKI = os.path.join(ROOT, "src", "data", "ebooki.json")

CENA_ZESTAWU = 7900  # grosze; praca 59 zł + przewodnik 49 zł = 108 zł


def main():
    dane = json.load(io.open(PRODUCTS, encoding="utf-8"))
    prace = {p["productId"]: p for p in json.load(io.open(PRACE, encoding="utf-8"))}
    ebooki = json.load(io.open(EBOOKI, encoding="utf-8"))["kierunki"]

    produkty = [p for p in dane["products"] if not p["id"].startswith("zestaw-")]
    # ebook kierunkowy po nazwie pliku na S3 == slug landingu w /sklep/
    po_s3 = {
        os.path.splitext(os.path.basename(p["s3Key"]))[0]: p
        for p in produkty
        if p.get("category") == "Ebook kierunkowy"
    }

    zestawy = []
    for p in produkty:
        if p.get("category") != "Praca wzorcowa" or p["id"] not in prace:
            continue
        kier = prace[p["id"]]["kierunek"]
        landing = ebooki.get(kier, {}).get("href", "").strip("/").split("/")[-1]
        ebook = po_s3.get(landing)
        if not ebook:
            print(f"pomijam {p['id']}: brak ebooka kierunkowego dla {kier}")
            continue
        zestawy.append({
            "id": f"zestaw-{p['id']}",
            "name": f"Zestaw: {p['name'].replace(' (wzór, PDF + Word)', '')} + przewodnik „{ebook['name']}”",
            "price": CENA_ZESTAWU,
            "currency": "pln",
            "files": [{**f, "label": f"Praca – {f['label']}"} for f in p["files"]] + [{
                "s3Key": ebook["s3Key"],
                "fileName": ebook["fileName"],
                "label": "Przewodnik (PDF + EPUB, ZIP)",
            }],
            "emailSubject": "🎓 Twój zestaw: praca wzorcowa + przewodnik",
            "category": "Zestaw",
            "pracaId": p["id"],
            "ebookId": ebook["id"],
        })

    dane["products"] = produkty + zestawy
    with io.open(PRODUCTS, "w", encoding="utf-8", newline="\n") as f:
        json.dump(dane, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"zestawów: {len(zestawy)}")


if __name__ == "__main__":
    main()

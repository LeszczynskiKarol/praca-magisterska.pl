// Ebooki ze sklepu — mapa kierunek (slug z /tematy/) → landing ebooka kierunkowego.
//
// Źródłem jest `ebooki.json`, bo ten sam plik czyta `.wzory-src/promo-kierunek.py`
// przy składaniu PDF-ów wzorów. Nowy ebook kierunkowy = nowy wpis w JSON-ie,
// inaczej nie pojawi się ani w bloku po pobraniu wzoru, ani w PDF-ie.
import dane from "./ebooki.json";

export type Ebook = { href: string; tytul: string; cena: number };

export const EBOOK_OGOLNY: Ebook & { stron: number } = {
  href: dane._ogolny.href,
  tytul: dane._ogolny.tytul,
  cena: dane._ogolny.cena,
  stron: dane._ogolny.stron,
};

const KIERUNKOWE = dane.kierunki as Record<string, { href: string; tytul: string }>;

export function ebookKierunku(kierunek: string): Ebook | null {
  const e = KIERUNKOWE[kierunek];
  return e ? { ...e, cena: dane._cenaKierunkowy } : null;
}

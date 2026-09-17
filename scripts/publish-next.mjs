// Publikuje jeden przewodnik z kolejki .publish-queue/pending (najniższy numer w nazwie folderu).
// Element kolejki: folder NNN-slug z plikami item.json i index.astro.txt (gotowy landing).
// Skrypt: kopiuje landing do src/pages/sklep/<landingSlug>/, dodaje kartę w sklepie,
// dodaje baner EbookKierunkowyCTA na stronie tematu i przykładowej pracy, przenosi folder do done/.
// Zapisuje published=true|false i name do GITHUB_OUTPUT (jeśli jest ustawione).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PENDING = path.join(ROOT, ".publish-queue", "pending");
const DONE = path.join(ROOT, ".publish-queue", "done");

function output(key, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) fs.appendFileSync(file, `${key}=${value}\n`);
  console.log(`${key}=${value}`);
}

// Pliki mogą mieć końce linii CRLF (kopia na Windows) albo LF (GitHub Actions).
// Czytamy zawsze jako LF i zapisujemy z tym samym końcem linii, który był w pliku.
const eolOf = new Map();

function read(p) {
  const raw = fs.readFileSync(p, "utf8");
  eolOf.set(p, raw.includes("\r\n") ? "\r\n" : "\n");
  return raw.replace(/\r\n/g, "\n");
}

function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const eol = eolOf.get(p) || "\n";
  fs.writeFileSync(p, eol === "\n" ? s : s.replace(/\n/g, eol), "utf8");
}

function insertCard(card) {
  const p = path.join(ROOT, "src/pages/sklep/index.astro");
  let s = read(p);
  if (s.includes(`href: "${card.href}"`)) {
    console.log("karta już jest w sklepie, pomijam");
    return;
  }
  const start = s.indexOf("const kierunkowe = [");
  if (start < 0) throw new Error("brak tablicy kierunkowe w sklep/index.astro");
  const end = s.indexOf("\n];", start);
  if (end < 0) throw new Error("brak końca tablicy kierunkowe");
  const fields = ["id", "kierunek", "icon", "subtitle", "desc", "href", "gradient", "border", "badge"];
  const body = fields
    .map((f) => {
      if (card[f] === undefined) throw new Error(`karta: brak pola ${f}`);
      return `    ${f}: ${JSON.stringify(card[f])},`;
    })
    .join("\n");
  const block = `\n  {\n${body}\n  },`;
  s = s.slice(0, end) + block + s.slice(end);
  write(p, s);
}

function ctaBlock(cta) {
  return (
    `  <EbookKierunkowyCTA\n` +
    `    kierunek=${JSON.stringify(cta.kierunek)}\n` +
    (cta.productName ? `    productName=${JSON.stringify(cta.productName)}\n` : "") +
    `    icon=${JSON.stringify(cta.icon)}\n` +
    `    landingHref=${JSON.stringify(cta.landingHref)}\n` +
    `  />\n`
  );
}

function addImport(s, afterImportLine, importLine) {
  if (s.includes(importLine)) return s;
  const i = s.indexOf(afterImportLine);
  if (i < 0) throw new Error(`brak linii importu: ${afterImportLine}`);
  const j = i + afterImportLine.length;
  return s.slice(0, j) + "\n" + importLine + s.slice(j);
}

function insertCtas(cta) {
  // strona tematu: baner po WzorPracyCTA (pierwsze wystąpienie bez variant="bottom")
  const tp = path.join(ROOT, "src/pages/tematy", cta.tematDir, "index.astro");
  let t = read(tp);
  if (t.includes(`landingHref=${JSON.stringify(cta.landingHref)}`)) {
    console.log("baner na stronie tematu już jest, pomijam");
  } else {
    t = addImport(
      t,
      'import WzorPracyCTA from "../../../components/WzorPracyCTA.astro";',
      'import EbookKierunkowyCTA from "../../../components/EbookKierunkowyCTA.astro";'
    );
    const re = /^  <WzorPracyCTA (?![^\n]*variant=)[^\n]*\/>\n/m;
    const m = t.match(re);
    if (!m) throw new Error(`brak WzorPracyCTA w ${tp}`);
    const at = m.index + m[0].length;
    t = t.slice(0, at) + "\n" + ctaBlock(cta) + t.slice(at);
    write(tp, t);
  }

  // przykładowa praca: baner przed nagłówkiem „Co wyróżnia…”
  const pp = path.join(ROOT, "src/pages/tematy", cta.tematDir, "przykladowa-praca", "index.astro");
  let w = read(pp);
  if (w.includes(`landingHref=${JSON.stringify(cta.landingHref)}`)) {
    console.log("baner na stronie przykładowej pracy już jest, pomijam");
  } else {
    w = addImport(
      w,
      'import InfoBox from "../../../../components/InfoBox.astro";',
      'import EbookKierunkowyCTA from "../../../../components/EbookKierunkowyCTA.astro";'
    );
    const h = `  <h2>${cta.h2}</h2>`;
    const at = w.indexOf(h);
    if (at < 0) throw new Error(`brak nagłówka ${h} w ${pp}`);
    w = w.slice(0, at) + ctaBlock(cta) + "\n" + w.slice(at);
    write(pp, w);
  }
}

function main() {
  if (!fs.existsSync(PENDING)) {
    output("published", "false");
    return;
  }
  const items = fs
    .readdirSync(PENDING, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  if (items.length === 0) {
    console.log("kolejka pusta");
    output("published", "false");
    return;
  }
  const dir = path.join(PENDING, items[0]);
  const item = JSON.parse(read(path.join(dir, "item.json")));
  const landingSrc = path.join(dir, "index.astro.txt");
  const landingDst = path.join(ROOT, "src/pages/sklep", item.landingSlug, "index.astro");

  if (!fs.existsSync(landingDst)) write(landingDst, read(landingSrc));
  else console.log("landing już istnieje, pomijam kopiowanie");
  insertCard(item.card);
  insertCtas(item.cta);

  fs.mkdirSync(DONE, { recursive: true });
  fs.renameSync(dir, path.join(DONE, items[0]));
  const log = path.join(ROOT, ".publish-queue", "log.md");
  fs.appendFileSync(log, `- ${new Date().toISOString().slice(0, 10)}: ${item.name} (${items[0]})\n`);

  output("published", "true");
  output("name", item.name);
  output("remaining", String(items.length - 1));
}

main();

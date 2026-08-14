import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Stripe from "stripe";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsConfig = JSON.parse(
  readFileSync(join(__dirname, "products.json"), "utf8")
);

// Produkt ma albo jeden plik (`s3Key` + `fileName` — tak są opisane ebooki),
// albo listę plików (`files` — prace wzorcowe sprzedawane jako PDF + DOCX).
// Normalizujemy do listy, żeby dalej był jeden przypadek zamiast dwóch.
const PRODUCT_FILES = Object.fromEntries(
  productsConfig.products.map((p) => [
    p.id,
    {
      name: p.name,
      files: p.files?.length
        ? p.files
        : [{ s3Key: p.s3Key, fileName: p.fileName }],
    },
  ])
);

// Do 2026-08 lambda podawała każdemu plikowi `application/pdf`. Przy pakiecie
// PDF + DOCX oznaczałoby to, że Word pobiera się jako PDF i nie chce otworzyć.
const TYPY = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  zip: "application/zip",
  epub: "application/epub+zip",
};

function typMime(nazwaPliku) {
  const ext = String(nazwaPliku).split(".").pop()?.toLowerCase();
  return TYPY[ext] || "application/octet-stream";
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-central-1" });

const ALLOWED_ORIGINS = [
  "https://www.praca-magisterska.pl",
  "https://www.licencjackie.pl",
  "https://licencjackie.pl",
  "https://dev.torweb.pl",
  "http://localhost:4321",
];

function getCorsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export const handler = async (event) => {
  const headers = getCorsHeaders(event);

  if (
    event.httpMethod === "OPTIONS" ||
    event.requestContext?.http?.method === "OPTIONS"
  ) {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { sessionId } = JSON.parse(event.body);

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Brak session ID" }),
      };
    }

    // Pobierz sesję ze Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Sprawdź czy opłacona
    if (session.payment_status !== "paid") {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Płatność nie została zrealizowana" }),
      };
    }

    const productId = session.metadata?.productId;
    const product = PRODUCT_FILES[productId];

    if (!product) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Nieznany produkt" }),
      };
    }

    // Presigned URL na każdy plik pakietu (ważny 24h)
    const downloads = await Promise.all(
      product.files.map(async (plik) => ({
        fileName: plik.fileName,
        label: plik.label || plik.fileName.split(".").pop()?.toUpperCase(),
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: plik.s3Key,
            ResponseContentDisposition: `attachment; filename="${plik.fileName}"`,
            ResponseContentType: typMime(plik.fileName),
          }),
          { expiresIn: 24 * 60 * 60 }
        ),
      }))
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        // `downloads` to format docelowy; `downloadUrl`/`fileName` zostają dla
        // strony sukcesu, która czyta pojedynczy link — bez tego każdy dotąd
        // sprzedany ebook przestałby się pobierać w chwili wgrania tej wersji.
        downloads,
        downloadUrl: downloads[0]?.url,
        fileName: downloads[0]?.fileName,
        productName: product.name,
      }),
    };
  } catch (error) {
    console.error("Get download error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Błąd serwera" }),
    };
  }
};

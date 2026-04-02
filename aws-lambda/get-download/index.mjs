import Stripe from "stripe";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-central-1" });

const PRODUCT_FILES = {
  "ebook-pisanie-pracy-licencjackiej": {
    s3Key: "ebooks/poradnik-praca-licencjacka.pdf",
    fileName: "Jak-napisac-prace-licencjacka.pdf",
    name: "Jak napisać pracę licencjacką",
  },
  "ebook-pisanie-pracy-magisterskiej": {
    s3Key: "ebooks/poradnik-praca-magisterska.pdf",
    fileName: "Jak-napisac-prace-magisterska.pdf",
    name: "Jak napisać pracę magisterską od A do Z",
  },
};

const ALLOWED_ORIGINS = [
  "https://www.praca-magisterska.pl",
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

    // Generuj presigned URL (ważny 24h)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: product.s3Key,
      ResponseContentDisposition: `attachment; filename="${product.fileName}"`,
      ResponseContentType: "application/pdf",
    });

    const downloadUrl = await getSignedUrl(s3, command, {
      expiresIn: 24 * 60 * 60,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        downloadUrl,
        productName: product.name,
        fileName: product.fileName,
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

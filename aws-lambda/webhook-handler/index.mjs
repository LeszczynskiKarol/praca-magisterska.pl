import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsConfig = JSON.parse(
  readFileSync(join(__dirname, "products.json"), "utf8")
);

// Jak w get-download: ebook ma jeden `s3Key`, praca wzorcowa listę `files`
// (PDF + DOCX). Normalizujemy do listy, żeby mail dostał komplet linków.
const PRODUCT_FILES = Object.fromEntries(
  productsConfig.products.map((p) => [
    p.id,
    p.files?.length ? p.files : [{ s3Key: p.s3Key, fileName: p.fileName }],
  ])
);

const PRODUCT_NAMES = Object.fromEntries(
  productsConfig.products.map((p) => [p.id, p.name])
);

const PRODUCT_EMAIL_SUBJECTS = Object.fromEntries(
  productsConfig.products.map((p) => [p.id, p.emailSubject])
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const s3 = new S3Client({ region: process.env.AWS_REGION });
const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION,
});
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

const ORDERS_TABLE = process.env.ORDERS_TABLE || "praca-magisterska-orders";

// Stripe wysyła dla jednej sesji więcej niż jedno zdarzenie (completed +
// async_payment_succeeded, retransmisje) — mail wolno wysłać tylko temu
// wywołaniu, które jako pierwsze zapisze sesję w tabeli zamówień.
async function claimSession(session, productId, customerEmail) {
  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: ORDERS_TABLE,
        Item: {
          sessionId: { S: session.id },
          productId: { S: productId },
          customerEmail: { S: customerEmail },
          amountTotal: { N: String(session.amount_total ?? 0) },
          currency: { S: session.currency || "pln" },
          createdAt: { S: new Date().toISOString() },
        },
        ConditionExpression: "attribute_not_exists(sessionId)",
      })
    );
    return true;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw err;
  }
}

async function releaseSession(sessionId) {
  await dynamo.send(
    new DeleteItemCommand({
      TableName: ORDERS_TABLE,
      Key: { sessionId: { S: sessionId } },
    })
  );
}

// ─── Raportowanie konwersji do seo-panelu ────────────────────────────────
//
// Panel NIGDY nie bierze konwersji z GA4 (ga4.service.ts wpisuje twarde 0) —
// jedynym źródłem prawdy jest webhook /api/webhook/conversion. Bez tego
// wywołania sprzedaż nie pojawia się w panelu w ogóle: 2026-08-01 poszła
// realna transakcja 39 zł, a panel do 2026-08-02 pokazywał 0 konwersji.
//
// Endpoint panelu robi UPSERT po (integrationId, date) i NADPISUJE wartość,
// więc nie wolno wysyłać "1" per zdarzenie — druga sprzedaż tego samego dnia
// cofnęłaby licznik do 1. Wysyłamy sumę całego dnia, przeliczoną z tabeli
// zamówień. Dzięki temu wywołanie jest idempotentne i odporne na retransmisje
// Stripe'a.
//
// Doba liczona wg Europe/Warsaw, bo taką strefę ma property GA4 — inaczej
// zamówienia z godzin 00:00–02:00 lądowałyby w panelu na poprzednim dniu.

function warsawDate(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

async function notifySeoPanel() {
  const url = process.env.SEO_PANEL_WEBHOOK_URL;
  const apiKey = process.env.SEO_PANEL_API_KEY;
  const integrationId = process.env.SEO_PANEL_INTEGRATION_ID;

  // Brak konfiguracji = funkcja nieaktywna. Celowo cicho, żeby lambda
  // działała tak jak dotąd, dopóki zmienne nie zostaną ustawione.
  if (!url || !apiKey || !integrationId) return;

  const today = warsawDate(new Date().toISOString());

  let orders = 0;
  let revenueGrosze = 0;
  let startKey;
  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: ORDERS_TABLE,
        ExclusiveStartKey: startKey,
      })
    );
    for (const item of page.Items || []) {
      const createdAt = item.createdAt?.S;
      if (!createdAt || warsawDate(createdAt) !== today) continue;
      orders += 1;
      revenueGrosze += Number(item.amountTotal?.N || 0);
    }
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      integrationId,
      date: today,
      orders,
      revenue: revenueGrosze / 100,
    }),
  });

  if (!res.ok) {
    throw new Error(`seo-panel ${res.status}: ${await res.text()}`);
  }
  console.log(
    `seo-panel: ${today} orders=${orders} revenue=${revenueGrosze / 100}`
  );
}

// ─── Serwerowe zdarzenie `purchase` do GA4 (Measurement Protocol) ────────
//
// Zdarzenie po stronie przegladarki (sklep/sukces.astro) odpala sie tylko
// wtedy, gdy kupujacy wroci ze Stripe'a na strone sukcesu i ma zgode na
// analitykę. W praktyce zawodzi: w GA4 za 30 dni bylo add_to_cart=2,
// begin_checkout=2 i purchase=0 przy jednej realnej sprzedazy (2026-08-01).
// Tutaj wysylamy je z serwera, gdzie platnosc jest faktem.
//
// client_id pochodzi z ciasteczka _ga zebranego na stronie sklepu i
// przekazanego przez metadata Stripe'a — dzieki temu GA4 doklei zakup do
// tej samej sesji i zrodla ruchu, zamiast tworzyc nowego uzytkownika.
//
// transaction_id jest taki sam jak w zdarzeniu przegladarkowym (id sesji
// Stripe), wiec GA4 odfiltruje duplikat, gdyby zadzialaly oba.

async function sendGa4Purchase(session, productId) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const clientId = session.metadata?.gaClientId;
  if (!clientId) {
    console.warn("GA4: brak gaClientId w metadanych sesji — pomijam purchase");
    return;
  }

  const value = (session.amount_total ?? 0) / 100;
  const currency = (session.currency || "pln").toUpperCase();

  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
      measurementId
    )}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: "purchase",
            params: {
              transaction_id: session.id,
              currency,
              value,
              items: [
                {
                  item_id: productId,
                  item_name: PRODUCT_NAMES[productId] || productId,
                  price: value,
                  quantity: 1,
                },
              ],
            },
          },
        ],
      }),
    }
  );

  // Measurement Protocol zwraca 204 i NIE raportuje bledow walidacji —
  // realne problemy widac tylko w GA4 DebugView / raporcie realtime.
  if (!res.ok) {
    throw new Error(`GA4 MP ${res.status}: ${await res.text()}`);
  }
  console.log(`GA4 purchase wyslany: ${session.id} ${value} ${currency}`);
}

export const handler = async (event) => {
  const sig =
    event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Webhook signature verification failed" }),
    };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    if (session.payment_status === "paid") {
      await handleSuccessfulPayment(session);
    }
  }

  if (stripeEvent.type === "checkout.session.async_payment_succeeded") {
    const session = stripeEvent.data.object;
    await handleSuccessfulPayment(session);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

async function handleSuccessfulPayment(session) {
  const productId = session.metadata.productId;
  const customerEmail =
    session.customer_details?.email || session.customer_email;

  if (!productId || !customerEmail) {
    console.error("Missing productId or customerEmail");
    return;
  }

  const pliki = PRODUCT_FILES[productId];
  if (!pliki?.length) {
    console.error("Unknown product:", productId);
    return;
  }

  const claimed = await claimSession(session, productId, customerEmail);
  if (!claimed) {
    console.log(`Session ${session.id} already fulfilled, skipping`);
    return;
  }

  try {
    const linki = await Promise.all(
      pliki.map(async (plik) => ({
        fileName: plik.fileName,
        label: plik.label || plik.fileName?.split(".").pop()?.toUpperCase(),
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: plik.s3Key,
          }),
          { expiresIn: 7 * 24 * 60 * 60 }
        ),
      }))
    );

    await sendDownloadEmail(customerEmail, productId, linki, session);

    console.log(`Email sent to ${customerEmail} for product ${productId}`);

    // Raport do panelu dopiero PO zrealizowaniu zamówienia i w osobnym
    // try/catch — awaria panelu nie może zwolnić rezerwacji sesji ani
    // wywołać retransmisji Stripe'a, bo ebook jest już wysłany.
    try {
      await notifySeoPanel();
    } catch (e) {
      console.error("seo-panel notify failed (bez wpływu na zamówienie):", e.message);
    }

    try {
      await sendGa4Purchase(session, productId);
    } catch (e) {
      console.error("GA4 purchase failed (bez wpływu na zamówienie):", e.message);
    }
  } catch (error) {
    console.error("Error handling payment:", error);
    // Zwalniamy rezerwację, żeby retransmisja Stripe mogła dokończyć wysyłkę.
    await releaseSession(session.id).catch((e) =>
      console.error("Failed to release session claim:", e)
    );
    throw error;
  }
}

async function sendDownloadEmail(email, productId, linki, session) {
  const productName = PRODUCT_NAMES[productId];
  const subjectPrefix = PRODUCT_EMAIL_SUBJECTS[productId] || "📚 Twój ebook jest gotowy do pobrania";
  const amountPaid = (session.amount_total / 100).toFixed(2);

  // Jeden plik czyta się jak dotąd („Pobierz"); pakiet dostaje przycisk na
  // format, żeby kupujący nie musiał zgadywać, który link jest który.
  const jedenPlik = linki.length === 1;
  const przyciski = linki
    .map(
      (p) =>
        `<a href="${p.url}" class="button">📥 Pobierz${jedenPlik ? "" : " " + p.label}</a>`
    )
    .join("&nbsp;&nbsp;");
  const linkiTekst = linki
    .map((p) => (jedenPlik ? p.url : `${p.label}: ${p.url}`))
    .join("\n\n");

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #7c3aed; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎓 Dziękujemy za zakup!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Praca-Magisterska.pl</p>
    </div>
    <div class="content">
      <p>Cześć!</p>
      <p>Dziękujemy za zakup: <strong>${productName}</strong>!</p>
      <p><strong>Kwota:</strong> ${amountPaid} PLN</p>

      <p>${jedenPlik ? "Kliknij poniższy przycisk, aby pobrać plik:" : "Pliki do pobrania — w obu formatach:"}</p>

      <p style="text-align: center;">
        ${przyciski}
      </p>

      <div class="warning">
        <strong>⚠️ Ważne:</strong> Link do pobrania jest ważny przez 7 dni.
        Zapisz plik na swoim urządzeniu po pobraniu.
      </div>

      <p>Jeśli masz jakiekolwiek pytania, odpowiedz na tego maila - chętnie pomożemy!</p>

      <p>Powodzenia w pisaniu pracy! 📚</p>

      <p style="margin-top: 30px;">
        Pozdrawiamy,<br>
        <strong>Zespół Praca-Magisterska.pl</strong>
      </p>
    </div>
    <div class="footer">
      <p>Praca-Magisterska.pl - Twój przewodnik po pracy dyplomowej</p>
      <p><a href="https://www.praca-magisterska.pl" style="color: #6366f1;">www.praca-magisterska.pl</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
Dziękujemy za zakup!

Zakupiony produkt: ${productName}
Kwota: ${amountPaid} PLN

${jedenPlik ? "Kliknij poniższy link, aby pobrać plik:" : "Pliki do pobrania:"}
${linkiTekst}

WAŻNE: ${jedenPlik ? "Link jest ważny" : "Linki są ważne"} przez 7 dni. Zapisz ${jedenPlik ? "plik" : "pliki"} po pobraniu.

Jeśli masz pytania, odpowiedz na tego maila.

Powodzenia w pisaniu pracy!

Pozdrawiamy,
Zespół Praca-Magisterska.pl
https://www.praca-magisterska.pl
  `;

  const command = new SendEmailCommand({
    Source: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `${subjectPrefix} - ${productName}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  await ses.send(command);
}

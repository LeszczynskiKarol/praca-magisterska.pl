import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const s3 = new S3Client({ region: process.env.AWS_REGION });
const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION,
});

const PRODUCT_FILES = {
  "ebook-pisanie-pracy-licencjackiej": "ebooks/poradnik-praca-licencjacka.pdf",
  "ebook-pisanie-pracy-magisterskiej": "ebooks/poradnik-praca-magisterska.pdf",
};

const PRODUCT_NAMES = {
  "ebook-pisanie-pracy-licencjackiej":
    "Jak napisać pracę licencjacką - Kompletny Poradnik",
  "ebook-pisanie-pracy-magisterskiej":
    "Jak napisać pracę magisterską od A do Z",
};

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

  const s3Key = PRODUCT_FILES[productId];
  if (!s3Key) {
    console.error("Unknown product:", productId);
    return;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, {
      expiresIn: 7 * 24 * 60 * 60,
    });

    await sendDownloadEmail(customerEmail, productId, downloadUrl, session);

    console.log(`Email sent to ${customerEmail} for product ${productId}`);
  } catch (error) {
    console.error("Error handling payment:", error);
    throw error;
  }
}

async function sendDownloadEmail(email, productId, downloadUrl, session) {
  const productName = PRODUCT_NAMES[productId];
  const amountPaid = (session.amount_total / 100).toFixed(2);

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
      <p>Dziękujemy za zakup ebooka <strong>${productName}</strong>!</p>
      <p><strong>Kwota:</strong> ${amountPaid} PLN</p>
      
      <p>Kliknij poniższy przycisk, aby pobrać swój ebook:</p>
      
      <p style="text-align: center;">
        <a href="${downloadUrl}" class="button">📥 Pobierz Ebook</a>
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

Kliknij poniższy link, aby pobrać swój ebook:
${downloadUrl}

WAŻNE: Link jest ważny przez 7 dni. Zapisz plik po pobraniu.

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
        Data: `📚 Twój ebook jest gotowy do pobrania - ${productName}`,
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

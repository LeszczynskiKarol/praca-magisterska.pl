import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  "ebook-pisanie-pracy-licencjackiej": {
    name: "Jak napisać pracę licencjacką - Kompletny Poradnik",
    price: 2900,
    currency: "pln",
  },
  "ebook-pisanie-pracy-magisterskiej": {
    name: "Jak napisać pracę magisterską od A do Z",
    price: 3900,
    currency: "pln",
  },
};

const ALLOWED_ORIGINS = [
  "https://www.praca-magisterska.pl",
  "https://www.licencjackie.pl",
  "https://licencjackie.pl",
  "https://dev.torweb.pl",
];

// Strony sukcesu/anulowania per domena. praca-magisterska zostaje na env (jak było),
// licencjackie.pl ma własne /ebook/sukces i /ebook/anulowano.
const SITE_REDIRECTS = {
  "https://www.licencjackie.pl": {
    success: "https://www.licencjackie.pl/ebook/sukces",
    cancel: "https://www.licencjackie.pl/ebook/anulowano",
  },
  "https://licencjackie.pl": {
    success: "https://www.licencjackie.pl/ebook/sukces",
    cancel: "https://www.licencjackie.pl/ebook/anulowano",
  },
};

function getOrigin(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function getRedirects(origin) {
  return (
    SITE_REDIRECTS[origin] || {
      success: process.env.SUCCESS_URL,
      cancel: process.env.CANCEL_URL,
    }
  );
}

function getCorsHeaders(event) {
  const allowedOrigin = getOrigin(event);
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export const handler = async (event) => {
  if (
    event.httpMethod === "OPTIONS" ||
    event.requestContext?.http?.method === "OPTIONS"
  ) {
    return { statusCode: 200, headers: getCorsHeaders(event), body: "" };
  }

  try {
    const { productId, customerEmail } = JSON.parse(event.body);

    if (!productId || !PRODUCTS[productId]) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: "Nieprawidłowy produkt" }),
      };
    }

    const product = PRODUCTS[productId];
    const redirects = getRedirects(getOrigin(event));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "blik", "revolut_pay"],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: `Ebook PDF - ${product.name}`,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${redirects.success}?session_id={CHECKOUT_SESSION_ID}&productId=${productId}`,
      cancel_url: redirects.cancel,
      customer_email: customerEmail || undefined,
      metadata: { productId },
      billing_address_collection: "auto",
      invoice_creation: { enabled: true },
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: "Błąd serwera" }),
    };
  }
};

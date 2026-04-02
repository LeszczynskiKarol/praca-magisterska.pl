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
  "https://dev.torweb.pl",
];

function getCorsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "blik"],
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
      success_url: `${process.env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&productId=${productId}`,
      cancel_url: process.env.CANCEL_URL,
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

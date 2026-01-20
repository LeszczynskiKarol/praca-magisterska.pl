import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Produkty - w produkcji możesz trzymać w DynamoDB lub S3
const PRODUCTS = {
  'ebook-pisanie-pracy-licencjackiej': {
    name: 'Kompletny Poradnik Pisania Pracy Licencjackiej',
    price: 4900, // w groszach
    currency: 'pln',
  },
  'ebook-metodologia-badan': {
    name: 'Metodologia Badań w Pracy Dyplomowej',
    price: 3900,
    currency: 'pln',
  },
  'ebook-pakiet-kompletny': {
    name: 'Pakiet Kompletny - Wszystkie Ebooki',
    price: 6900,
    currency: 'pln',
  },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.licencjackie.pl',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    const { productId, customerEmail } = JSON.parse(event.body);

    // Walidacja
    if (!productId || !PRODUCTS[productId]) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Nieprawidłowy produkt' }),
      };
    }

    const product = PRODUCTS[productId];

    // Tworzenie Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: `Ebook - ${product.name}`,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.CANCEL_URL,
      customer_email: customerEmail || undefined,
      metadata: {
        productId: productId,
      },
      // Opcjonalnie: zbieranie adresu do faktury
      billing_address_collection: 'auto',
      // Automatyczne generowanie faktury
      invoice_creation: {
        enabled: true,
      },
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Błąd serwera' }),
    };
  }
};

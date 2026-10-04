import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const municipality = typeof body.municipality === "string" ? body.municipality : "";
    const tasks = Number.isFinite(body.tasks) ? body.tasks : 0;

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: 690,
          product_data: {
            name: "Trasloco Zero Pensieri — Piano completo",
            description: "Piano personalizzato per il tuo trasferimento."
          }
        },
        quantity: 1
      }],
      metadata: {
        municipality,
        tasks: String(tasks)
      },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      billing_address_collection: "auto"
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout error", error);
    return Response.json({ error: "Impossibile avviare il pagamento." }, { status: 500 });
  }
};

export const config = {
  path: "/api/create-checkout-session"
};

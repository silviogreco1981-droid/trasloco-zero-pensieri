import Stripe from "stripe";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const secretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return Response.json({ error: "STRIPE_SECRET_KEY non configurata." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const municipality = body?.municipality || "";

    const stripe = new Stripe(secretKey);
    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: "Trasloco Zero Pensieri — Piano completo"
          },
          unit_amount: 690
        },
        quantity: 1
      }],
      metadata: {
        municipality: String(municipality).slice(0, 100)
      },
      success_url: origin + "/?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/",
      billing_address_collection: "auto"
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Impossibile creare il checkout." }, { status: 500 });
  }
};

export const config = {
  path: "/api/create-checkout-session"
};

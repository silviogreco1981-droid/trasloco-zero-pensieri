import Stripe from "stripe";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const secretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  const sessionId = new URL(req.url).searchParams.get("session_id");

  if (!secretKey || !sessionId) {
    return Response.json({ paid: false }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return Response.json({
      paid: session.payment_status === "paid"
    });
  } catch (error) {
    console.error(error);
    return Response.json({ paid: false }, { status: 400 });
  }
};

export const config = {
  path: "/api/verify-checkout-session"
};

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

type Data =
  | { sessionId: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { priceId, customerId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Le priceId est requis.' });
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancelled`,
    };

    if (customerId) {
      params.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(params);

    res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Erreur create-subscription-session :', err);
    res
      .status(500)
      .json({ error: 'Erreur lors de la création de la session d’abonnement' });
  }
}

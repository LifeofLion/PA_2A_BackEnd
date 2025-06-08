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
    const { priceId, quantity } = req.body;
    // priceId : ID du prix Stripe (exemple : price_1AbCdEfGhIjKlMn)
    // quantity : nombre d’unités (exemple 1)

    if (!priceId) {
      return res.status(400).json({ error: 'Le priceId est requis.' });
    }

    // 1) Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: quantity || 1,
        },
      ],
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancelled`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Erreur create-checkout-session :', err);
    res.status(500).json({ error: 'Erreur lors de la création de la session Checkout' });
  }
}
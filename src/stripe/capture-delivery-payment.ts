import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

type Data = { success: true } | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { paymentIntentId } = req.body
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId requis' })
    }

    await stripe.paymentIntents.capture(paymentIntentId)

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Erreur capture-delivery-payment :', err)
    return res
      .status(500)
      .json({ error: 'Impossible de capturer le PaymentIntent' })
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

type Data = { clientSecret: string } | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { customerId, amount, currency, delivererAccountId } = req.body
    if (!customerId || !amount || !currency || !delivererAccountId) {
      return res
        .status(400)
        .json({ error: 'customerId, amount, currency et delivererAccountId requis' })
    }

    const pi = await stripe.paymentIntents.create({
      amount,                  
      currency,               
      customer: customerId,    
      capture_method: 'manual',
      payment_method_types: ['card'],
      transfer_data: {
        destination: delivererAccountId, 
      },
      metadata: {
        type: 'delivery_payment',
      },
    })

    return res.status(200).json({ clientSecret: pi.client_secret! })
  } catch (err: any) {
    console.error('Erreur initiate-delivery-payment :', err)
    return res
      .status(500)
      .json({ error: 'Impossible de créer le PaymentIntent' })
  }
}

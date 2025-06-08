import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

// Instanciation du client Stripe (côté serveur) à partir de la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

type Data = 
  | { url: string }
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // On n’autorise que la méthode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { customerId } = req.body
    if (!customerId) {
      return res.status(400).json({ error: 'Le paramètre customerId est requis' })
    }

    // Création d’une session du Customer Portal pour ce customer
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      // Quand l’utilisateur quitte le Portal, Stripe le renvoie ici :
      return_url: `${req.headers.origin}/account`,
    })

    // On renvoie à l’utilisateur l’URL du Customer Portal
    return res.status(200).json({ url: session.url! })
  } catch (err: any) {
    console.error('Erreur create-portal-session :', err)
    return res
      .status(500)
      .json({ error: 'Impossible de créer la session du Customer Portal' })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Livraison from '#models/livraison'
import Colis from '#models/colis'
import Annonce from '#models/annonce'
import { livraisonValidator } from '#validators/create_livraison'
import { DateTime } from 'luxon'

export default class LivraisonsController {
  async create({ request, response }: HttpContext) {
    const annonceId = request.param('id')
    const annonce = await Annonce.findOrFail(annonceId)

    // Update annonce state to pending when a livreur accepts it
    annonce.state = 'pending'
    await annonce.save()

    const payload = await request.validateUsing(livraisonValidator)
    const livraison = await Livraison.create({
      livreurId: payload.livreur_id ?? null,
      pickupLocation: payload.pickup_location,
      dropoffLocation: payload.dropoff_location,
      status: payload.status ?? 'scheduled',
    })

    // Get all colis associated with this annonce
    const colisList = await Colis.query().where('annonce_id', annonceId)

    // Update colis status to in_transit
    for (const colis of colisList) {
      colis.status = 'in_transit'
      await colis.save()
    }

    // Link the colis to this livraison
    await livraison.related('colis').saveMany(colisList)
    await livraison.load('colis')

    return response.created({
      livraison: livraison.serialize(),
    })
  }

  async show({ request, response }: HttpContext) {
    const livraison = await Livraison.query()
      .where('id', request.param('id'))
      .preload('livreur')
      .preload('colis')
      .firstOrFail()
    return response.ok({ livraison: livraison.serialize() })
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(livraisonValidator)
    const livraison = await Livraison.findOrFail(request.param('id'))

    livraison.merge({
      livreurId: payload.livreur_id ?? livraison.livreurId,
      pickupLocation: payload.pickup_location ?? livraison.pickupLocation,
      dropoffLocation: payload.dropoff_location ?? livraison.dropoffLocation,
      status: payload.status ?? livraison.status,
    })
    await livraison.save()
    await livraison.load('colis')
    await livraison.load('historique')
    return response.ok({ livraison: livraison.serialize() })
  }
}

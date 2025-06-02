import type { HttpContext } from '@adonisjs/core/http'
import Livraison from '#models/livraison'
import Annonce from '#models/annonce'
import Client from '#models/client'
import { livraisonValidator } from '#validators/create_livraison'
import { DateTime } from 'luxon'
import Ws from '#services/ws'
import { userSockets } from '#controllers/messages_controller'
import db from '@adonisjs/lucid/services/db'

export default class LivraisonsController {
  async create({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const data = await request.validateUsing(livraisonValidator)

      const annonce = await Annonce.findOrFail(request.param('id'))

      // Récupérer le client depuis l'utilisateur de l'annonce
      const client = await Client.query().where('id', annonce.utilisateurId).first()

      const clientId = client?.id || null

      const livraison = await Livraison.create(
        {
          livreurId: data.livreur_id ?? null,
          pickupLocation: data.pickup_location,
          dropoffLocation: data.dropoff_location,
          clientId: clientId,
          status: 'scheduled',
        },
        { client: trx }
      )

      await annonce.load('colis' as any)

      const colisIds = annonce.colis.map((colis) => colis.id)

      await livraison.related('colis').attach(colisIds, trx)

      await livraison.load('colis' as any)

      await trx.commit()

      // Notifier les livreurs disponibles via WebSocket
      await livraison.notifyNewDelivery()

      return response.created({
        message: 'Livraison créée avec succès',
        data: livraison,
      })
    } catch (error) {
      await trx.rollback()
      console.error('Erreur création livraison:', error)
      return response.badRequest({
        message: 'Erreur lors de la création de la livraison',
        error: error.message,
      })
    }
  }

  async show({ request, response }: HttpContext) {
    const id = Number.parseInt(request.param('id'))
    if (Number.isNaN(id)) {
      return response.badRequest({ error: 'ID de livraison invalide' })
    }

    const livraison = await Livraison.query()
      .where('id', id)
      .preload('livreur')
      .preload('colis')
      .firstOrFail()
    return response.ok({ livraison: livraison.serialize() })
  }

  async update({ request, response }: HttpContext) {
    const id = Number.parseInt(request.param('id'))
    if (Number.isNaN(id)) {
      return response.badRequest({ error: 'ID de livraison invalide' })
    }

    const payload = await request.validateUsing(livraisonValidator)
    const livraison = await Livraison.findOrFail(id)

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

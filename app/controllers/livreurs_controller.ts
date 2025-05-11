import type { HttpContext } from '@adonisjs/core/http'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import Livreur from '#models/livreur'
import Utilisateurs from '#models/utilisateurs'
import Annonce from '#models/annonce'
import Livraison from '#models/livraison'
import Colis from '#models/colis'
import { livreurValidator } from '#validators/add_livreur'

export default class LivreursController {
  async add({ request, response }: HttpContext) {
    try {
      const { utilisateur_id } = await request.validateUsing(livreurValidator)

      const livreurAlreadyLinked = await Livreur.findBy('id', utilisateur_id)
      if (livreurAlreadyLinked) {
        return response.badRequest({ message: 'Utilisateurs already has a Livreur account' })
      }

      const livreur = await Livreur.create({
        id: utilisateur_id,
        availability_status: 'available',
        rating: null,
      })

      return response.created({
        message: 'Livreur created successfully',
        livreur: livreur.serialize(),
      })
    } catch (error) {
      return response.badRequest({ message: 'Invalid data', error_code: error })
    }
  }

  async getProfile({ request, response }: HttpContext) {
    try {
      const client = await Livreur.findOrFail(request.param('id'))
      const user = await Utilisateurs.findOrFail(request.param('id'))
      const { password: _, ...userData } = user.serialize()
      const { id: __, ...clientData } = client.serialize()
      return response.ok({ user: userData, client: clientData })
    } catch (error) {
      return response.notFound({ message: 'Client Profile not found', error_code: error })
    }
  }

  async updateProfile({ request, response }: HttpContext) {
    try {
      const livreur = await Livreur.findOrFail(request.param('id'))
      livreur.merge(request.body())
      await livreur.save()
      const { password: _, ...livreurData } = livreur.serialize()
      return response.ok(livreurData)
    } catch (error) {
      return response.badRequest({ message: 'Wrong Parametters', error_code: error })
    }
  }

  /**
   * Accept an annonce and create a livraison
   * This is the key method for implementing the announcement flow
   */
  async acceptAnnonce({ request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')
      const annonceId = request.param('annonce_id')
      const { pickup_location, dropoff_location } = request.body()

      // Verify the livreur exists
      const livreur = await Livreur.findOrFail(livreurId)

      // Verify the annonce exists and is open
      const annonce = await Annonce.findOrFail(annonceId)
      if (annonce.state !== 'open') {
        return response.badRequest({
          message: 'This annonce is not available for acceptance',
          current_state: annonce.state,
        })
      }

      // Update annonce state to pending
      annonce.state = 'pending'
      await annonce.save()

      // Create a new livraison
      const livraison = await Livraison.create({
        livreurId: livreurId,
        pickupLocation: pickup_location,
        dropoffLocation: dropoff_location,
        status: 'scheduled',
      })

      // Get all colis associated with this annonce
      const colisList = await Colis.query().where('annonce_id', annonceId)

      // Update colis status to in_transit
      for (const colis of colisList) {
        colis.status = 'in_transit'
        colis.warehouseId = null // Remove from warehouse when in transit
        await colis.save()
      }

      // Link the colis to this livraison
      await livraison.related('colis').saveMany(colisList)

      // Update livreur availability status
      livreur.availability_status = 'busy'
      await livreur.save()

      // Load relationships for response
      await livraison.load('colis')
      await livraison.load('livreur')

      return response.created({
        message: 'Annonce accepted successfully',
        livraison: livraison.serialize(),
        tracking_numbers: colisList.map((colis) => colis.trackingNumber),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Failed to accept annonce',
        error_code: error,
      })
    }
  }

  /**
   * Get all available annonces for a livreur
   */
  async getAvailableAnnonces({ response }: HttpContext) {
    try {
      const annonces = await Annonce.query()
        .where('state', 'open')
        .preload('utilisateur' as ExtractModelRelations<Annonce>)
        .preload('colis')
        .preload('services')
        .orderBy('created_at', 'desc')

      return response.ok({
        annonces: annonces.map((annonce) => annonce.serialize()),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Failed to fetch available annonces',
        error_code: error,
      })
    }
  }

  /**
   * Get all livraisons for a specific livreur
   */
  async getLivraisons({ request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')

      // Verify the livreur exists
      await Livreur.findOrFail(livreurId)

      const livraisons = await Livraison.query()
        .where('livreur_id', livreurId)
        .preload('colis')
        .preload('historique')
        .orderBy('created_at', 'desc')

      return response.ok({
        livraisons: livraisons.map((livraison) => livraison.serialize()),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Failed to fetch livraisons',
        error_code: error,
      })
    }
  }
}

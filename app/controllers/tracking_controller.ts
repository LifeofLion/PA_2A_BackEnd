import type { HttpContext } from '@adonisjs/core/http'
import LivreurPosition from '#models/livreur_position'
import Livraison from '#models/livraison'
import { DateTime } from 'luxon'

export default class TrackingController {
  /**
   * Récupérer l'historique des positions d'un livreur
   */
  async getLivreurPositions({ request, response }: HttpContext) {
    try {
      const livreurId = request.param('livreur_id')
      const startDate = request.qs().start_date
      const endDate = request.qs().end_date
      const livraisonId = request.qs().livraison_id

      let query = LivreurPosition.query()
        .where('livreur_id', livreurId)
        .orderBy('created_at', 'desc')

      if (startDate) {
        const startDateTime = DateTime.fromISO(startDate).toSQL()
        if (startDateTime) {
          query = query.where('created_at', '>=', startDateTime)
        }
      }

      if (endDate) {
        const endDateTime = DateTime.fromISO(endDate).toSQL()
        if (endDateTime) {
          query = query.where('created_at', '<=', endDateTime)
        }
      }

      if (livraisonId) {
        query = query.where('livraison_id', livraisonId)
      }

      const positions = await query.limit(1000)

      return response.ok({
        positions: positions.map((pos) => pos.serialize()),
        count: positions.length,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération des positions',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer la dernière position d'un livreur
   */
  async getLastPosition({ request, response }: HttpContext) {
    try {
      const livreurId = request.param('livreur_id')

      const lastPosition = await LivreurPosition.query()
        .where('livreur_id', livreurId)
        .orderBy('created_at', 'desc')
        .first()

      if (!lastPosition) {
        return response.notFound({
          message: 'Aucune position trouvée pour ce livreur',
        })
      }

      return response.ok({
        position: lastPosition.serialize(),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération de la position',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer le tracking d'une livraison spécifique
   */
  async getLivraisonTracking({ request, response, auth }: HttpContext) {
    try {
      const livraisonId = request.param('livraison_id')
      const user = auth.user!

      // Vérifier que l'utilisateur a accès à cette livraison
      const livraison = await Livraison.query()
        .where('id', livraisonId)
        .preload('client')
        .preload('livreur')
        .firstOrFail()

      // Vérifier les permissions
      const isClient = livraison.clientId === user.id
      const isLivreur = livraison.livreurId === user.id
      const isAdmin = await user.related('admin').query().first()

      if (!isClient && !isLivreur && !isAdmin) {
        return response.forbidden({
          message: "Vous n'avez pas accès à cette livraison",
        })
      }

      // Récupérer l'historique des positions
      const positions = await LivreurPosition.query()
        .where('livraison_id', livraisonId)
        .orderBy('created_at', 'asc')

      return response.ok({
        livraison: {
          id: livraison.id,
          status: livraison.status,
          pickupLocation: livraison.pickupLocation,
          dropoffLocation: livraison.dropoffLocation,
        },
        tracking: positions.map((pos) => ({
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
          speed: pos.speed,
          heading: pos.heading,
          timestamp: pos.createdAt.toISO(),
        })),
        count: positions.length,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération du tracking',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer les positions actuelles de tous les livreurs actifs (admin)
   */
  async getActiveLivreurs({ response, auth }: HttpContext) {
    try {
      // Vérifier que c'est un admin
      const user = auth.user!
      const isAdmin = await user.related('admin').query().first()

      if (!isAdmin) {
        return response.forbidden({
          message: 'Accès réservé aux administrateurs',
        })
      }

      // Récupérer la dernière position de chaque livreur actif
      const subQuery = LivreurPosition.query()
        .select('livreur_id')
        .max('created_at as max_created_at')
        .groupBy('livreur_id')

      const activePositions = await LivreurPosition.query()
        .whereIn(['livreur_id', 'created_at'], subQuery)
        .where('created_at', '>', DateTime.now().minus({ minutes: 30 }).toSQL())
        .preload('livreur', (query) => {
          query.preload('user' as any)
        })

      return response.ok({
        positions: activePositions.map((pos) => ({
          livreur: {
            id: pos.livreur.id,
            name: pos.livreur.user
              ? `${pos.livreur.user.first_name} ${pos.livreur.user.last_name}`
              : 'Inconnu',
            availability: pos.livreur.availabilityStatus,
          },
          location: {
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
            speed: pos.speed,
            heading: pos.heading,
            timestamp: pos.createdAt.toISO(),
          },
          livraison: pos.livraisonId
            ? {
                id: pos.livraisonId,
                status: 'in_progress',
              }
            : null,
        })),
        count: activePositions.length,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération des positions actives',
        error: error.message,
      })
    }
  }
}

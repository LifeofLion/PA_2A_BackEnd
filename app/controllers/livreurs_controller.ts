import type { HttpContext } from '@adonisjs/core/http'
import Livreur from '#models/livreur'
import Utilisateurs from '#models/utilisateurs'
import Livraison from '#models/livraison'
import HistoriqueLivraison from '#models/historique_livraison'
import { livreurValidator } from '#validators/add_livreur'
import { DateTime } from 'luxon'

export default class LivreursController {
  async add({ request, response }: HttpContext) {
    try {
      const { utilisateur_id: utilisateurId } = await request.validateUsing(livreurValidator)

      const livreurAlreadyLinked = await Livreur.findBy('id', utilisateurId)
      if (livreurAlreadyLinked) {
        return response.badRequest({ message: 'Utilisateurs already has a Livreur account' })
      }

      const livreur = await Livreur.create({
        id: utilisateurId,
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
      const { password, ...userData } = user.serialize()
      const { id, ...clientData } = client.serialize()
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
      const { password, ...livreurData } = livreur.serialize()
      return response.ok(livreurData)
    } catch (error) {
      return response.badRequest({ message: 'Wrong Parametters', error_code: error })
    }
  }

  /**
   * Récupérer toutes les livraisons d'un livreur
   */
  async getLivraisons({ auth, request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')
      const status = request.input('status')
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Vérifier que le livreur existe
      await Livreur.findOrFail(livreurId)

      let query = Livraison.query()
        .where('livreur_id', livreurId)
        .preload('colis', (colisQuery) => {
          colisQuery.preload('annonce', (annonceQuery) => {
            annonceQuery.preload('utilisateur' as any)
          })
        })
        .preload('historique')

      // Filtrer par statut si fourni
      if (status) {
        query = query.where('status', status)
      }

      const livraisons = await query.orderBy('created_at', 'desc').paginate(page, limit)

      return response.ok({
        livraisons: livraisons.serialize(),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération des livraisons',
        error_code: error,
      })
    }
  }

  /**
   * Récupérer les livraisons disponibles (non assignées)
   */
  async getAvailableLivraisons({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      const livraisons = await Livraison.query()
        .whereNull('livreur_id')
        .where('status', 'scheduled')
        .preload('colis', (colisQuery) => {
          colisQuery.preload('annonce', (annonceQuery) => {
            annonceQuery.preload('utilisateur' as any)
          })
        })
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok({
        livraisons: livraisons.serialize(),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération des livraisons disponibles',
        error_code: error,
      })
    }
  }

  /**
   * Accepter une livraison
   */
  async acceptLivraison({ auth, request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')
      const livraisonId = request.param('livraisonId')

      // Vérifier que le livreur existe
      const livreur = await Livreur.findOrFail(livreurId)

      // Vérifier que la livraison existe et n'est pas déjà assignée
      const livraison = await Livraison.findOrFail(livraisonId)

      if (livraison.livreurId) {
        return response.conflict({
          message: 'Cette livraison est déjà assignée à un autre livreur',
        })
      }

      // Assigner la livraison au livreur
      livraison.livreurId = livreur.id
      livraison.status = 'in_progress'
      await livraison.save()

      // Créer un historique
      await HistoriqueLivraison.create({
        livraisonId: livraison.id,
        status: 'in_progress',
        remarks: `Livraison acceptée par le livreur ${livreurId}`,
      })

      await livraison.load('colis')
      await livraison.load('historique')

      return response.ok({
        message: 'Livraison acceptée avec succès',
        livraison: livraison.serialize(),
      })
    } catch (error) {
      return response.badRequest({
        message: "Erreur lors de l'acceptation de la livraison",
        error_code: error,
      })
    }
  }

  /**
   * Mettre à jour le statut d'une livraison
   */
  async updateLivraisonStatus({ auth, request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')
      const livraisonId = request.param('livraisonId')
      const { status, remarks } = request.body()

      // Vérifier que le livreur existe
      await Livreur.findOrFail(livreurId)

      // Vérifier que la livraison existe et appartient au livreur
      const livraison = await Livraison.findOrFail(livraisonId)

      if (livraison.livreurId !== Number(livreurId)) {
        return response.forbidden({
          message: "Vous n'êtes pas autorisé à modifier cette livraison",
        })
      }

      // Valider le statut
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return response.badRequest({
          message: 'Statut invalide',
        })
      }

      // Mettre à jour le statut
      const oldStatus = livraison.status
      livraison.status = status
      await livraison.save()

      // Créer un historique
      await HistoriqueLivraison.create({
        livraisonId: livraison.id,
        status: status,
        remarks: remarks || `Statut changé de ${oldStatus} à ${status}`,
      })

      // Si la livraison est terminée, mettre à jour les colis
      if (status === 'completed') {
        await livraison.load('colis')
        for (const coli of livraison.colis) {
          coli.status = 'delivered'
          coli.locationType = 'client_address'
          await coli.save()
        }
      }

      await livraison.load('colis')
      await livraison.load('historique')

      return response.ok({
        message: 'Statut de la livraison mis à jour',
        livraison: livraison.serialize(),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la mise à jour du statut',
        error_code: error,
      })
    }
  }

  /**
   * Obtenir les statistiques du livreur
   */
  async getStats({ request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')

      // Vérifier que le livreur existe
      const livreur = await Livreur.findOrFail(livreurId)

      // Compter les livraisons par statut
      const livraisonsCount = await Livraison.query()
        .where('livreur_id', livreurId)
        .count('* as total')

      const completedCount = await Livraison.query()
        .where('livreur_id', livreurId)
        .where('status', 'completed')
        .count('* as total')

      const inProgressCount = await Livraison.query()
        .where('livreur_id', livreurId)
        .where('status', 'in_progress')
        .count('* as total')

      const cancelledCount = await Livraison.query()
        .where('livreur_id', livreurId)
        .where('status', 'cancelled')
        .count('* as total')

      // Calculer les revenus (si applicable)
      const totalRevenue = await Livraison.query()
        .where('livreur_id', livreurId)
        .where('status', 'completed')
        .count('* as total') // À adapter selon votre logique de calcul des revenus

      return response.ok({
        stats: {
          totalLivraisons: Number(livraisonsCount[0].$extras.total),
          completedLivraisons: Number(completedCount[0].$extras.total),
          inProgressLivraisons: Number(inProgressCount[0].$extras.total),
          cancelledLivraisons: Number(cancelledCount[0].$extras.total),
          rating: livreur.rating,
          availabilityStatus: livreur.availability_status,
          // totalRevenue: totalRevenue, // À implémenter selon votre logique
        },
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la récupération des statistiques',
        error_code: error,
      })
    }
  }

  /**
   * Mettre à jour le statut de disponibilité du livreur
   */
  async updateAvailability({ request, response }: HttpContext) {
    try {
      const livreurId = request.param('id')
      const { availability_status: availabilityStatus } = request.body()

      const livreur = await Livreur.findOrFail(livreurId)

      // Valider le statut
      const validStatuses = ['available', 'busy', 'offline']
      if (!validStatuses.includes(availabilityStatus)) {
        return response.badRequest({
          message: 'Statut de disponibilité invalide',
        })
      }

      livreur.availability_status = availabilityStatus
      await livreur.save()

      return response.ok({
        message: 'Statut de disponibilité mis à jour',
        livreur: livreur.serialize(),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur lors de la mise à jour du statut de disponibilité',
        error_code: error,
      })
    }
  }
}

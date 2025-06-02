import type { HttpContext } from '@adonisjs/core/http'
import Annonce from '#models/annonce'
import Service from '#models/service'

export default class AnnonceServicesController {
  /**
   * Attribuer des services à une annonce
   */
  async attachServices({ request, response }: HttpContext) {
    try {
      const annonceId = request.param('id')
      const { service_ids } = request.body()

      const annonce = await Annonce.findOrFail(annonceId)

      // Ajouter les services à l'annonce
      await annonce.related('services').attach(service_ids)

      // Recharger l'annonce avec ses services
      await annonce.load('services')

      return response.ok({ annonce: annonce.serialize() })
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to attach services', error })
    }
  }

  /**
   * Retirer des services d'une annonce
   */
  async detachServices({ request, response }: HttpContext) {
    try {
      const annonceId = request.param('id')
      const { service_ids } = request.body()

      const annonce = await Annonce.findOrFail(annonceId)

      // Retirer les services de l'annonce
      await annonce.related('services').detach(service_ids)

      // Recharger l'annonce avec ses services
      await annonce.load('services')

      return response.ok({ annonce: annonce.serialize() })
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to detach services', error })
    }
  }

  /**
   * Récupérer tous les services d'une annonce
   */
  async getServices({ request, response }: HttpContext) {
    try {
      const annonceId = request.param('id')

      const annonce = await Annonce.query().where('id', annonceId).preload('services').firstOrFail()

      return response.ok({ services: annonce.services })
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to get services', error })
    }
  }
}

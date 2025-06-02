import type { HttpContext } from '@adonisjs/core/http'
import Prestataire from '#models/prestataire'
import Utilisateurs from '#models/utilisateurs'
import { prestataireValidator } from '#validators/add_prestataire'

export default class PrestatairesController {
  async add({ request, response }: HttpContext) {
    try {
      const { utilisateur_id, service_type } = await request.validateUsing(prestataireValidator)

      const prestataireAlreadyLinked = await Prestataire.findBy('id', utilisateur_id)
      if (prestataireAlreadyLinked) {
        return response.badRequest({ message: 'Utilisateurs already has a Prestataire account' })
      }

      const prestataire = await Prestataire.create({
        id: utilisateur_id,
        service_type: service_type || null,
        rating: null,
      })

      return response.created({
        message: 'Prestataire created successfully',
        prestataire: prestataire.serialize(),
      })
    } catch (error) {
      return response.badRequest({ message: 'Invalid data', error_code: error })
    }
  }

  async getProfile({ request, response }: HttpContext) {
    try {
      const prestataire = await Prestataire.findOrFail(request.param('id'))
      const user = await Utilisateurs.findOrFail(request.param('id'))
      const { password: _, ...userData } = user.serialize()
      const { id: __, ...prestataireData } = prestataire.serialize()
      return response.ok({ user: userData, prestataire: prestataireData })
    } catch (error) {
      return response.notFound({ message: 'Prestataire Profile not found', error_code: error })
    }
  }

  async updateProfile({ request, response }: HttpContext) {
    try {
      const prestataire = await Prestataire.findOrFail(request.param('id'))
      prestataire.merge(request.body())
      await prestataire.save()
      const { password: _, ...prestataireData } = prestataire.serialize()
      return response.ok(prestataireData)
    } catch (error) {
      return response.badRequest({ message: 'Wrong Parametters', error_code: error })
    }
  }
}

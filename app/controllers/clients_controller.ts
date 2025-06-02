import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import Utilisateurs from '#models/utilisateurs'
import { clientValidator } from '#validators/add_client'

export default class ClientController {
  async add({ request, response }: HttpContext) {
    try {
      const { utilisateur_id } = await request.validateUsing(clientValidator)

      const clientAlreadyLinked = await Client.findBy('id', utilisateur_id)
      if (clientAlreadyLinked) {
        return response.badRequest({ message: 'Utilisateurs already has a Client account' })
      }

      const client = await Client.create({
        id: utilisateur_id,
        loyalty_points: 0,
        preferred_payment_method: null,
      })

      return response.created({
        message: 'Client created successfully',
        client: client.serialize(),
      })
    } catch (error) {
      return response.badRequest({ message: 'Invalid data', error_code: error })
    }
  }

  async getProfile({ request, response }: HttpContext) {
    try {
      const client = await Client.findOrFail(request.param('id'))
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
      const client = await Client.findOrFail(request.param('id'))
      client.merge(request.body())
      await client.save()
      const { password: _, ...clientData } = client.serialize()
      return response.ok(clientData)
    } catch (error) {
      return response.badRequest({ message: 'Wrong Parametters', error_code: error })
    }
  }
}

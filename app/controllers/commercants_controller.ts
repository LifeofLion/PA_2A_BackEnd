import type { HttpContext } from '@adonisjs/core/http'
import Commercant from '#models/commercant'
import Utilisateurs from '#models/utilisateurs'
import { commercantValidator } from '#validators/add_commercant'
import { DateTime } from 'luxon'

export default class CommercantsController {
  async add({ request, response }: HttpContext) {
    try {
      const {
        utilisateur_id,
        store_name,
        business_address,
        contact_number,
        contract_start_date,
        contract_end_date,
      } = await request.validateUsing(commercantValidator)

      const commercantAlreadyLinked = await Commercant.findBy('id', utilisateur_id)
      if (commercantAlreadyLinked) {
        return response.badRequest({ message: 'Utilisateurs already has a Commercant account' })
      }

      const commercant = await Commercant.create({
        id: utilisateur_id,
        store_name: store_name,
        business_address: business_address || null,
        verification_state: 'pending',
        contact_number: contact_number,
        contract_start_date: DateTime.fromJSDate(contract_start_date),
        contract_end_date: DateTime.fromJSDate(contract_end_date),
      })

      return response.created({
        message: 'Commercant created successfully',
        commercant: commercant.serialize(),
      })
    } catch (error) {
      return response.badRequest({ message: 'Invalid data', error_code: error })
    }
  }

  async getProfile({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      const user = await Utilisateurs.findOrFail(request.param('id'))
      const { password: _, ...userData } = user.serialize()
      const { id: __, ...commercantData } = commercant.serialize()
      return response.ok({ user: userData, commercant: commercantData })
    } catch (error) {
      return response.notFound({ message: 'Commercant Profile not found', error_code: error })
    }
  }

  async updateProfile({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      commercant.merge(request.body())
      await commercant.save()
      const { password: _, ...commercantData } = commercant.serialize()
      return response.ok(commercantData)
    } catch (error) {
      return response.badRequest({ message: 'Wrong Parametters', error_code: error })
    }
  }

  async verfiy({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      commercant.verification_state = 'verified'
      commercant.contract_start_date = DateTime.now()
      commercant.contract_end_date = DateTime.now().plus({ years: 1 })
      await commercant.save()
      return response.ok({ message: 'Commercant verified successfully', commercant: commercant.serialize() })
    } catch (error) {
      return response.badRequest({ message: 'Error verifying commercant', error_code: error })
    }
  }

  async reject({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      commercant.verification_state = 'rejected'
      await commercant.save()
      return response.ok({ message: 'Commercant rejected successfully', commercant: commercant.serialize() })
    } catch (error) {
      return response.badRequest({ message: 'Error rejecting commercant', error_code: error })
    }
  }

  async getUnverified({ response }: HttpContext) {
    try {
      const commercants = await Commercant.query().where('verification_state', 'pending')
      return response.ok({ commercants: commercants.map((commercant) => commercant.serialize()) })
    } catch (error) {
      return response.badRequest({ message: 'Error fetching unverified commercants', error: error })
    }
  }

  async getVerified({ response }: HttpContext) {
    try {
      const commercants = await Commercant.query().where('verification_state', 'verified')
      return response.ok({ commercants: commercants.map((commercant) => commercant.serialize()) })
    } catch (error) {
      return response.badRequest({ message: 'Error fetching verified commercants', error: error })
    }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Commercant from '#models/commercant'
import Utilisateurs from '#models/utilisateurs'
import { commercantValidator } from '#validators/add_commercant'
import { DateTime } from 'luxon'

export default class CommercantsController {
  async add({ request, response }: HttpContext) {
    console.log('🟡 ENTRÉE CONTROLLER COMMERCANT')
    console.log('🟡 REQUEST BODY:', request.body())
    console.log('🟡 REQUEST HEADERS:', request.headers())

    try {
      console.log('🟡 AVANT VALIDATION...')
      const {
        utilisateur_id: utilisateurId,
        store_name: storeName,
        business_address: businessAddress,
        contact_number: contactNumber,
        contract_start_date: contractStartDate,
        contract_end_date: contractEndDate,
      } = await request.validateUsing(commercantValidator)

      console.log('🟡 VALIDATION RÉUSSIE, données extraites:', {
        utilisateurId,
        storeName,
        businessAddress,
        contactNumber,
        contractStartDate,
        contractEndDate,
      })

      const commercantAlreadyLinked = await Commercant.find(utilisateurId)
      if (commercantAlreadyLinked) {
        console.log('🟡 Commercant déjà existant')
        return response.badRequest({ message: 'Utilisateur already has a Commercant account' })
      }

      console.log('🟡 CRÉATION DU COMMERCANT...')
      const commercant = await Commercant.create({
        id: utilisateurId,
        storeName: storeName,
        businessAddress: businessAddress || null,
        verificationState: 'pending',
        contactNumber: contactNumber,
        contractStartDate: DateTime.fromISO(contractStartDate),
        contractEndDate: DateTime.fromISO(contractEndDate),
      })

      console.log('🟡 COMMERCANT CRÉÉ AVEC SUCCÈS:', commercant.serialize())
      return response.created({
        message: 'Commercant created successfully',
        commercant: commercant.serialize(),
      })
    } catch (error) {
      console.error('🔴 ERREUR DANS CONTROLLER:', error)
      console.error('🔴 ERREUR MESSAGE:', error.message)
      console.error('🔴 ERREUR STACK:', error.stack)
      return response.badRequest({ message: 'Invalid data', error_code: error })
    }
  }

  async getProfile({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      const user = await Utilisateurs.findOrFail(request.param('id'))
      const { password, ...userData } = user.serialize()
      const { id, ...commercantData } = commercant.serialize()
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
      const { password, ...commercantData } = commercant.serialize()
      return response.ok(commercantData)
    } catch (error) {
      return response.badRequest({ message: 'Wrong Parameters', error_code: error })
    }
  }

  async verify({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      commercant.verificationState = 'verified'
      commercant.contractStartDate = DateTime.now()
      commercant.contractEndDate = DateTime.now().plus({ years: 1 })
      await commercant.save()
      return response.ok({
        message: 'Commercant verified successfully',
        commercant: commercant.serialize(),
      })
    } catch (error) {
      return response.badRequest({ message: 'Error verifying commercant', error_code: error })
    }
  }

  async reject({ request, response }: HttpContext) {
    try {
      const commercant = await Commercant.findOrFail(request.param('id'))
      commercant.verificationState = 'rejected'
      await commercant.save()
      return response.ok({
        message: 'Commercant rejected successfully',
        commercant: commercant.serialize(),
      })
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

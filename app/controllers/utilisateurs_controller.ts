import type { HttpContext } from '@adonisjs/core/http'
import { userUpdateValidator } from '#validators/user_put'
import { checkPasswordValidator } from '#validators/check_password'
import Utilisateurs from '#models/utilisateurs'

export default class UtilisateursController {
  async getIndex({ response }: HttpContext) {
    try {
      const users = await Utilisateurs.all()
      console.log('Utilisateurs trouvés:', users.length, users)
      return response.ok(users.map((user) => user.serialize()))
    } catch (error) {
      console.error('Erreur dans getIndex:', error)
      return response.notFound({ message: 'Utilisateurs not found' })
    }
  }

  async get({ request, response }: HttpContext) {
    try {
      const user = await Utilisateurs.findOrFail(request.param('id'))
      return response.ok(user.serialize())
    } catch (error) {
      return response.notFound({ message: 'Utilisateurs not found' })
    }
  }

  async getRecent({ response }: HttpContext) {
    try {
      const users = await Utilisateurs.query()
        .select('id', 'first_name', 'last_name', 'address', 'created_at')
        .preload('admin')
        .preload('livreur') 
        .preload('prestataire')
        .orderBy('createdAt', 'desc')
        .limit(5)

      if (!users || users.length === 0) {
        return response.notFound({ message: 'No recent users found' })
      }

      const usersWithRoles = users.map(user => {
        let role = 'client' 
        
        if (user.$preloaded.admin) role = 'admin'
        else if (user.$preloaded.livreur) role = 'livreur'
        else if (user.$preloaded.prestataire) role = 'prestataire'

        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          address: user.address,
          role: role,
          created_at: user.createdAt
        }
      })

      return response.ok(usersWithRoles)
    } catch (error) {
      console.error('Error in getRecent:', error)
      return response.internalServerError({ 
        message: 'An error occurred while fetching recent users',
        error: error.message 
      })
    }
  }

  async checkPassword({ request, response }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(checkPasswordValidator)
      await Utilisateurs.verifyCredentials(email, password)

      return response.ok({ message: 'Password verified' })
    } catch (error) {
      return response.unauthorized({ message: 'Password Unverified', error_code: error })
    }
  }

  async update({ request, response }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(userUpdateValidator)
      const user = await Utilisateurs.findOrFail(request.param('id'))
      user.merge({ ...validatedData })
      await user.save()
      return response.ok({ message: 'Utilisateurs updated successfully', user: user.serialize() })
    } catch (error) {
      if (error.status === 401) {
        return response.unauthorized({ message: 'Unauthorized access', error_message: error })
      }
      return response.badRequest({ message: 'Wrong Parametters', error_code: error })
    }
  }
}

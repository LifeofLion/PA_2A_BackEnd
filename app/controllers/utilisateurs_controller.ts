import type { HttpContext } from '@adonisjs/core/http'
import { userUpdateValidator } from '#validators/user_put'
import { checkPasswordValidator } from '#validators/check_password'
import Utilisateurs from '#models/utilisateurs'

export default class UtilisateursController {
  async getIndex({ request, response }: HttpContext) {
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

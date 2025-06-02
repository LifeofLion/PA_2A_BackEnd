import type { HttpContext } from '@adonisjs/core/http'
import Admin from '#models/admin'
import Utilisateurs from '#models/utilisateurs'
import { adminValidator } from '#validators/admin'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'

export default class AdminController {
  async index({ response }: HttpContext) {
    try {
      const admins = await Admin.query().preload('user' as ExtractModelRelations<Admin>)
      return response.ok(admins)
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to fetch admins', error })
    }
  }

  async create({ request, response }: HttpContext) {
    try {
      const { id, privileges } = await request.validateUsing(adminValidator)

      // Vérifier si l'utilisateur existe
      const user = await Utilisateurs.find(id)
      if (!user) {
        return response.status(404).send({ error_message: 'User not found' })
      }

      // Vérifier si l'admin existe déjà
      const existingAdmin = await Admin.find(id)
      if (existingAdmin) {
        return response.status(400).send({ error_message: 'User is already an admin' })
      }

      // Créer l'admin
      const admin = await Admin.create({
        id,
        privileges: privileges || 'basic',
      })

      await admin.load('user' as ExtractModelRelations<Admin>)
      return response.created(admin)
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to create admin', error })
    }
  }

  async get({ request, response }: HttpContext) {
    try {
      const id = request.param('id')
      const admin = await Admin.query()
        .where('id', id)
        .preload('user' as ExtractModelRelations<Admin>)
        .firstOrFail()
      return response.ok(admin)
    } catch (error) {
      return response.status(404).send({ error_message: 'Admin not found' })
    }
  }

  async update({ request, response }: HttpContext) {
    try {
      const id = request.param('id')
      const { privileges } = request.body()

      const admin = await Admin.find(id)
      if (!admin) {
        return response.status(404).send({ error_message: 'Admin not found' })
      }

      admin.privileges = privileges
      await admin.save()

      await admin.load('user' as ExtractModelRelations<Admin>)
      return response.ok(admin)
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to update admin', error })
    }
  }

  async delete({ request, response }: HttpContext) {
    try {
      const id = request.param('id')
      const admin = await Admin.find(id)

      if (!admin) {
        return response.status(404).send({ error_message: 'Admin not found' })
      }

      await admin.delete()
      return response.noContent()
    } catch (error) {
      return response.status(500).send({ error_message: 'Failed to delete admin', error })
    }
  }
}

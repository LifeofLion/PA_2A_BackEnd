import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Utilisateurs from '#models/utilisateurs'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.status(401).json({
        error: 'Authentification requise.',
      })
    }

    try {
      // Charger explicitement la relation admin
      const fullUser = await Utilisateurs.query()
        .where('id', user.id)
        .preload('admin')
        .firstOrFail()

      // Vérifier si l'utilisateur a une relation admin
      if (!fullUser.admin) {
        return ctx.response.status(403).json({
          error: 'Accès refusé. Vous devez être administrateur pour accéder à cette ressource.',
        })
      }

      // Attacher l'objet admin à l'utilisateur dans le contexte pour une utilisation ultérieure
      user.admin = fullUser.admin

      return next()
    } catch (error) {
      return ctx.response.status(500).json({
        error: 'Une erreur est survenue lors de la vérification des droits administrateur.',
      })
    }
  }
}

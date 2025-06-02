import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import Livreur from '#models/livreur'

export default class LivreurMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, response, request } = ctx

    // Vérifier que l'utilisateur est authentifié
    if (!auth.user) {
      return response.unauthorized({ message: 'Vous devez être connecté' })
    }

    // Vérifier que l'utilisateur est un livreur
    const livreur = await Livreur.find(auth.user.id)
    if (!livreur) {
      return response.forbidden({
        message: 'Accès réservé aux livreurs',
      })
    }

    // Stocker le livreur dans la requête pour une utilisation ultérieure
    request.updateBody({ livreurInstance: livreur })

    await next()
  }
}

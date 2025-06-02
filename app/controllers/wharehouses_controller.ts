import type { HttpContext } from '@adonisjs/core/http'
import Wharehouse from '#models/wharehouse'
import StockageColi from '#models/stockage_coli'

export default class WharehousesController {
  async create({ request, response }: HttpContext) {
    const { location, capacity } = request.body()

    const wharehouse = await Wharehouse.create({
      location,
      capacity,
    })

    return response.created({ wharehouse: wharehouse.serialize() })
  }

  async getWharehouse({ request, response }: HttpContext) {
    const wharehouse = await Wharehouse.query()
      .where('id', request.param('id'))
      .preload('stockage', (query) => {
        query.preload('colis')
      })
      .firstOrFail()

    return response.ok({ wharehouse: wharehouse.serialize() })
  }

  async getAllWharehouses({ response }: HttpContext) {
    const wharehouses = await Wharehouse.query().orderBy('location', 'asc')

    return response.ok({ wharehouses: wharehouses.map((w) => w.serialize()) })
  }

  async update({ request, response }: HttpContext) {
    const wharehouse = await Wharehouse.findOrFail(request.param('id'))
    const { location, capacity } = request.body()

    wharehouse.merge({
      location: location || wharehouse.location,
      capacity: capacity || wharehouse.capacity,
    })

    await wharehouse.save()
    await wharehouse.load('stockage')

    return response.ok({ wharehouse: wharehouse.serialize() })
  }

  async delete({ request, response }: HttpContext) {
    const wharehouse = await Wharehouse.findOrFail(request.param('id'))

    // Vérifier s'il y a des colis stockés
    const storedColis = await StockageColi.query()
      .where('wharehouse_id', wharehouse.id)
      .count('* as total')

    const total = storedColis[0].$extras.total

    if (total > 0) {
      return response.badRequest({
        message: `Impossible de supprimer cet entrepôt car il contient ${total} colis`,
      })
    }

    await wharehouse.delete()

    return response.ok({ message: 'Entrepôt supprimé avec succès' })
  }

  async getAvailableCapacity({ request, response }: HttpContext) {
    const wharehouse = await Wharehouse.findOrFail(request.param('id'))

    // Calculer la capacité utilisée
    const storedColis = await StockageColi.query()
      .where('wharehouse_id', wharehouse.id)
      .count('* as total')

    const usedCapacity = storedColis[0].$extras.total || 0
    const availableCapacity = wharehouse.capacity - usedCapacity

    return response.ok({
      warehouseId: wharehouse.id,
      totalCapacity: wharehouse.capacity,
      usedCapacity,
      availableCapacity,
    })
  }
}

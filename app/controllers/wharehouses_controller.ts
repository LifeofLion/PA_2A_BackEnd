import type { HttpContext } from '@adonisjs/core/http'
import Wharehouse from '#models/wharehouse'

export default class WharehousesController {
  async create({ request, response }: HttpContext) {
    const { location, capacity } = request.body()

    // Create the warehouse
    const wharehouse = await Wharehouse.create({
      location,
      capacity,
    })

    return response.created({ wharehouse: wharehouse.serialize() })
  }

  async getWharehouse({ request, response }: HttpContext) {
    const wharehouse = await Wharehouse.query()
      .where('id', request.param('id'))
      .preload('stockage')
      .firstOrFail()

    return response.ok({ wharehouse: wharehouse.serialize() })
  }

  async update({ request, response }: HttpContext) {
    const { location, capacity } = request.body()
    const wharehouse = await Wharehouse.findOrFail(request.param('id'))

    wharehouse.merge({
      location: location || wharehouse.location,
      capacity: capacity !== undefined ? capacity : wharehouse.capacity,
    })

    await wharehouse.save()

    return response.ok({ wharehouse: wharehouse.serialize() })
  }

  async delete({ request, response }: HttpContext) {
    const wharehouse = await Wharehouse.findOrFail(request.param('id'))

    // Check if the warehouse has any storage records before deleting
    await wharehouse.load('stockage')
    if (wharehouse.stockage.length > 0) {
      return response.badRequest({
        message: 'Cannot delete warehouse with existing storage records',
      })
    }

    await wharehouse.delete()

    return response.ok({ message: 'Warehouse deleted successfully' })
  }
}

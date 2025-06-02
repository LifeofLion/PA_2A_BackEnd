import type { HttpContext } from '@adonisjs/core/http'
import StockageColi from '#models/stockage_coli'
import Colis from '#models/colis'
import Wharehouse from '#models/wharehouse'
import ColisLocationHistory from '#models/colis_location_history'
import { DateTime } from 'luxon'

export default class StockageColisController {
  async create({ request, response }: HttpContext) {
    const { colis_id, wharehouse_id, storage_area, stored_until, description } = request.body()

    // Vérifier que le colis et l'entrepôt existent
    const colis = await Colis.findOrFail(colis_id)
    await Wharehouse.findOrFail(wharehouse_id)

    // Créer l'enregistrement de stockage
    const stockage = await StockageColi.create({
      colisId: colis_id,
      warehouseId: wharehouse_id,
      storage_area,
      stored_until: DateTime.fromISO(stored_until),
      description: description || null,
    })

    // Mettre à jour la localisation du colis
    colis.locationType = 'warehouse'
    colis.locationId = wharehouse_id
    colis.status = 'stored'
    await colis.save()

    // Enregistrer l'historique de localisation
    await ColisLocationHistory.create({
      colisId: colis_id,
      locationType: 'warehouse',
      locationId: wharehouse_id,
      address: null,
      description: `Stocké dans l'entrepôt #${wharehouse_id}, zone ${storage_area}`,
      movedAt: DateTime.now(),
    })

    await stockage.load('colis')
    await stockage.load('wharehouse')

    return response.created({ stockage: stockage.serialize() })
  }

  async show({ request, response }: HttpContext) {
    const stockage = await StockageColi.query()
      .where('id', request.param('id'))
      .preload('colis')
      .preload('wharehouse')
      .firstOrFail()

    return response.ok({ stockage: stockage.serialize() })
  }

  async getByColisId({ request, response }: HttpContext) {
    const stockage = await StockageColi.query()
      .where('colis_id', request.param('colis_id'))
      .preload('colis')
      .preload('wharehouse')
      .first()

    if (!stockage) {
      return response.notFound({ message: 'Aucun stockage trouvé pour ce colis' })
    }

    return response.ok({ stockage: stockage.serialize() })
  }

  async update({ request, response }: HttpContext) {
    const stockage = await StockageColi.findOrFail(request.param('id'))
    const { storage_area, stored_until, description } = request.body()

    stockage.merge({
      storage_area: storage_area || stockage.storage_area,
      stored_until: stored_until ? DateTime.fromISO(stored_until) : stockage.stored_until,
      description: description || stockage.description,
    })

    await stockage.save()
    await stockage.load('colis')
    await stockage.load('wharehouse')

    return response.ok({ stockage: stockage.serialize() })
  }

  async delete({ request, response }: HttpContext) {
    const stockage = await StockageColi.findOrFail(request.param('id'))

    // Avant de supprimer, mettre à jour le statut du colis
    const colis = await Colis.findOrFail(stockage.colisId)
    colis.locationType = null
    colis.locationId = null
    colis.status = 'in_transit'
    await colis.save()

    // Enregistrer l'historique
    await ColisLocationHistory.create({
      colisId: stockage.colisId,
      locationType: 'in_transit',
      locationId: null,
      address: null,
      description: `Retiré de l'entrepôt #${stockage.warehouseId}`,
      movedAt: DateTime.now(),
    })

    await stockage.delete()

    return response.ok({ message: 'Stockage supprimé avec succès' })
  }

  async moveToClientAddress({ request, response }: HttpContext) {
    const { colis_id, address } = request.body()

    // Trouver le colis
    const colis = await Colis.findOrFail(colis_id)

    // Si le colis est en stockage, supprimer l'enregistrement
    const existingStockage = await StockageColi.query().where('colis_id', colis_id).first()

    if (existingStockage) {
      await existingStockage.delete()
    }

    // Mettre à jour la localisation
    colis.locationType = 'client_address'
    colis.locationId = null
    colis.currentAddress = address
    colis.status = 'delivered'
    await colis.save()

    // Enregistrer l'historique
    await ColisLocationHistory.create({
      colisId: colis_id,
      locationType: 'client_address',
      locationId: null,
      address: address,
      description: "Livré à l'adresse du client",
      movedAt: DateTime.now(),
    })

    return response.ok({
      message: "Colis déplacé à l'adresse du client",
      colis: colis.serialize(),
    })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import StockageColi from '#models/stockage_coli'
import Colis from '#models/colis'
import { DateTime } from 'luxon'

export default class StockageColisController {
  /**
   * Get all storage records for a specific colis by tracking number
   */
  async getByTrackingNumber({ request, response }: HttpContext) {
    const trackingNumber = request.param('tracking_number')

    // First find the colis by tracking number
    const colis = await Colis.findByOrFail('tracking_number', trackingNumber)

    // Then get all storage records for this colis
    const storageRecords = await StockageColi.query()
      .where('colis_id', colis.id)
      .orderBy('created_at', 'desc')

    return response.ok({
      colis: colis.serialize(),
      storage_records: storageRecords.map((record) => record.serialize()),
    })
  }

  /**
   * Create a new storage record for a colis
   */
  async create({ request, response }: HttpContext) {
    const { colis_id, wharehouse_id, storage_area, stored_until, description } = request.body()

    // Find the colis to get its tracking number
    const colis = await Colis.findOrFail(colis_id)

    const storageRecord = await StockageColi.create({
      colis_id,
      colis_tracking_number: colis.trackingNumber,
      wharehouse_id,
      storage_area,
      stored_until: DateTime.fromISO(stored_until),
      description: description || 'Standard storage',
    })

    // Update the colis location
    colis.warehouseId = wharehouse_id
    colis.status = 'stored'
    await colis.save()

    return response.created({
      storage_record: storageRecord.serialize(),
      tracking_number: colis.trackingNumber,
    })
  }

  /**
   * Update a storage record
   */
  async update({ request, response }: HttpContext) {
    const { storage_area, stored_until, description } = request.body()
    const storageRecord = await StockageColi.findOrFail(request.param('id'))

    storageRecord.merge({
      storage_area: storage_area || storageRecord.storage_area,
      stored_until: stored_until ? DateTime.fromISO(stored_until) : storageRecord.stored_until,
      description: description !== undefined ? description : storageRecord.description,
    })

    await storageRecord.save()

    return response.ok({ storage_record: storageRecord.serialize() })
  }

  /**
   * Delete a storage record
   */
  async delete({ request, response }: HttpContext) {
    const storageRecord = await StockageColi.findOrFail(request.param('id'))
    await storageRecord.delete()

    return response.ok({ message: 'Storage record deleted successfully' })
  }
}

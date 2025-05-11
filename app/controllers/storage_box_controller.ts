import type { HttpContext } from '@adonisjs/core/http'
import StorageBox from '#models/storage_box'
import Colis from '#models/colis'
import Wharehouse from '#models/wharehouse'
import StockageColi from '#models/stockage_coli'
import { DateTime } from 'luxon'

export default class StorageBoxController {
    async create({ request, response }: HttpContext) {
        const { colis_id, wharehouse_id, storage_area, stored_until, description } = request.body()

        // Validate that the colis and wharehouse exist
        const colis = await Colis.findOrFail(colis_id)
        await Wharehouse.findOrFail(wharehouse_id)

        // Create the storage box
        const storageBox = await StorageBox.create({
            colisId: colis_id,
            warehouseId: wharehouse_id,
            storage_area,
            stored_until: DateTime.fromISO(stored_until),
            description: description || null,
        })

        // Create a stockage record for tracking purposes
        // This is the primary record for tracking the colis location and history
        await StockageColi.create({
            colis_id: colis.id,
            colis_tracking_number: colis.trackingNumber,
            wharehouse_id: wharehouse_id,
            storage_area,
            stored_until: DateTime.fromISO(stored_until),
            description: description || 'Storage box storage'
        })

        // Update the colis location type to storage_box
        colis.clientId = null
        colis.warehouseId = wharehouse_id
        colis.status = 'stored'
        await colis.save()

        await storageBox.load('colis')
        await storageBox.load('wharehouse')

        return response.created({ 
            storageBox: storageBox.serialize(),
            tracking_number: colis.trackingNumber
        })
    }

    async getStorageBox({ request, response }: HttpContext) {
        const storageBox = await StorageBox.query()
            .where('id', request.param('id'))
            .preload('colis')
            .preload('wharehouse')
            .firstOrFail()
    
        // Also load the stockage records for this colis
        await storageBox.load('colis', (query) => {
            query.preload('stockageRecords')
        })

        return response.ok({ storageBox: storageBox.serialize() })
    }

    async update({ request, response }: HttpContext) {
        const { storage_area, stored_until, description } = request.body()
        const storageBox = await StorageBox.findOrFail(request.param('id'))
        
        // Load the colis to get its tracking number
        await storageBox.load('colis')
        const colis = storageBox.colis

        storageBox.merge({
            storage_area: storage_area || storageBox.storage_area,
            stored_until: stored_until ? DateTime.fromISO(stored_until) : storageBox.stored_until,
            description: description !== undefined ? description : storageBox.description,
        })

        await storageBox.save()
        
        // Update the corresponding stockage record
        const storedUntil = stored_until ? DateTime.fromISO(stored_until) : storageBox.stored_until
        await StockageColi.query()
            .where('colis_id', colis.id)
            .where('wharehouse_id', storageBox.warehouseId)
            .update({
                storage_area: storage_area || storageBox.storage_area,
                stored_until: storedUntil,
                description: description !== undefined ? description : 'Storage box storage'
            })

        await storageBox.load('wharehouse')

        return response.ok({ 
            storageBox: storageBox.serialize(),
            tracking_number: colis.trackingNumber
        })
    }

    async delete({ request, response }: HttpContext) {
        const storageBox = await StorageBox.findOrFail(request.param('id'))

        // Get the colis before deleting the storage box
        await storageBox.load('colis')
        const colis = storageBox.colis
        const trackingNumber = colis.trackingNumber

        // Find and delete any associated stockage records
        await StockageColi.query()
            .where('colis_id', colis.id)
            .where('wharehouse_id', storageBox.warehouseId)
            .delete()

        // Update the colis status
        colis.status = 'in_transit'
        colis.warehouseId = null
        await colis.save()

        await storageBox.delete()

        return response.ok({ 
            message: 'Storage box deleted successfully',
            tracking_number: trackingNumber
        })
    }
}

import type { HttpContext } from '@adonisjs/core/http'
import Colis from '#models/colis'
import Annonce from '#models/annonce'
import StockageColi from '#models/stockage_coli'
import { DateTime } from 'luxon'
import { colisValidator } from '#validators/create_coli'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'

export default class ColisController {
  async create({ request, response }: HttpContext) {
    const {
      annonce_id,
      weight,
      length,
      width,
      height,
      content_description,
      location_type,
      client_id,
      warehouse_id,
    } = await request.validateUsing(colisValidator)

    await Annonce.findOrFail(annonce_id)

    // Generate a unique tracking number
    let trackingNumber = `COLIS-${Math.floor(Math.random() * 1e6)}`
    while (await Colis.findBy('tracking_number', trackingNumber)) {
      trackingNumber = `COLIS-${Math.floor(Math.random() * 1e6)}`
    }

    const colis = await Colis.create({
      annonceId: annonce_id,
      trackingNumber,
      weight,
      length,
      width,
      height,
      contentDescription: content_description ?? undefined,
      status: 'stored',
      clientId: location_type === 'client' ? client_id : null,
      warehouseId: location_type === 'warehouse' ? warehouse_id : null,
      // storage_box location type will be handled by the storage_box controller
    })

    // Create storage record if needed
    if (location_type === 'warehouse' && warehouse_id) {
      await StockageColi.create({
        colis_id: colis.id,
        colis_tracking_number: trackingNumber,
        wharehouse_id: warehouse_id,
        storage_area: 'General',
        stored_until: DateTime.now().plus({ months: 1 }),
        description: content_description ?? 'Standard storage',
      })
    }

    await colis.load('annonce')
    if (location_type === 'client') {
      await colis.load('client' as ExtractModelRelations<Colis>)
    } else if (location_type === 'warehouse') {
      await colis.load('warehouse')
      await colis.load('stockageRecords')
    } else if (location_type === 'storage_box') {
      // For storage_box, we don't set any location here
      // The storage_box controller will handle this relationship
    }

    return response.created({ colis: colis.serialize() })
  }

  async getColis({ request, response }: HttpContext) {
    const trackingNumber = request.param('tracking_number')
    const colis = await Colis.query()
      .where('tracking_number', trackingNumber)
      .preload('annonce')
      .preload('client' as ExtractModelRelations<Colis>)
      .preload('warehouse')
      .preload('stockageRecords')
      .preload('livraisons')
      .firstOrFail()

    return response.ok({ colis: colis.serialize() })
  }

  async getColisByTrackingNumber({ request, response }: HttpContext) {
    const trackingNumber = request.param('tracking_number')
    const colis = await Colis.query()
      .where('tracking_number', trackingNumber)
      .preload('annonce')
      .preload('client' as ExtractModelRelations<Colis>)
      .preload('warehouse')
      .preload('stockageRecords')
      .preload('livraisons')
      .firstOrFail()

    // Get the current status and location information
    let currentLocation = 'Unknown'
    let additionalInfo = {}

    if (colis.status === 'stored' && colis.warehouseId) {
      currentLocation = 'Warehouse'
      await colis.load('warehouse')
      additionalInfo = {
        warehouse: colis.warehouse.serialize(),
        storage_details:
          colis.stockageRecords.length > 0 ? colis.stockageRecords[0].serialize() : null,
      }
    } else if (colis.status === 'stored' && colis.clientId) {
      currentLocation = 'Client'
      await colis.load('client' as ExtractModelRelations<Colis>)
      additionalInfo = {
        client: colis.client.serialize(),
      }
    } else if (colis.status === 'in_transit') {
      currentLocation = 'In Transit'
      if (colis.livraisons.length > 0) {
        await colis.load('livraisons', (query) => {
          query.preload('livreur')
        })
        additionalInfo = {
          livraison: colis.livraisons[0].serialize(),
        }
      }
    } else if (colis.status === 'delivered') {
      currentLocation = 'Delivered'
      if (colis.livraisons.length > 0) {
        additionalInfo = {
          delivery_details: colis.livraisons[0].serialize(),
        }
      }
    }

    return response.ok({
      colis: colis.serialize(),
      tracking_info: {
        tracking_number: trackingNumber,
        status: colis.status,
        current_location: currentLocation,
        ...additionalInfo,
      },
    })
  }

  /**
   * Get complete tracking history for a package
   */
    async getTrackingHistory({ request, response }: HttpContext) {
        try {
        const trackingNumber = request.param('tracking_number')

        // Find the colis
        const colis = await Colis.query()
            .where('tracking_number', trackingNumber)
            .preload('annonce')
            .preload('stockageRecords', (query) => {
            query.orderBy('created_at', 'desc')
            })
            .preload('livraisons', (query) => {
            query.preload('historique', (historyQuery) => {
                historyQuery.orderBy('update_time', 'desc')
            })
            query.preload('livreur')
            })
            .firstOrFail()

        // Combine all tracking events into a single timeline
        const trackingEvents = []

        // Add creation event
        trackingEvents.push({
            event_type: 'package_created',
            timestamp: colis.createdAt,
            description: 'Package registered in the system',
            details: {
            annonce_id: colis.annonceId,
            tracking_number: colis.trackingNumber,
            dimensions: {
                weight: colis.weight,
                length: colis.length,
                width: colis.width,
                height: colis.height,
            },
            },
        })

        // Add storage events
        for (const record of colis.stockageRecords) {
            trackingEvents.push({
            event_type: 'package_stored',
            timestamp: record.createdAt,
            description: `Package stored at warehouse area: ${record.storage_area}`,
            details: {
                warehouse_id: record.wharehouse_id,
                storage_area: record.storage_area,
                stored_until: record.stored_until ? record.stored_until.toFormat('yyyy-MM-dd') : null,
                description: record.description,
            },
            })
        }

        // Add livraison events
        for (const livraison of colis.livraisons) {
            // Add delivery creation event
            trackingEvents.push({
                event_type: 'delivery_created',
                timestamp: livraison.createdAt,
                description: `Delivery created from ${livraison.pickupLocation} to ${livraison.dropoffLocation}`,
                details: {
                    livraison_id: livraison.id,
                    status: livraison.status,
                    livreur: livraison.livreur
                    ? {
                        id: livraison.livreur.id,
                        name: livraison.livreur.user.first_name || 'Unknown',
                        }
                    : null,
                    pickup: livraison.pickupLocation,
                    dropoff: livraison.dropoffLocation,
                },
            })

            // Add livraison history events
            if (livraison.historique && Array.isArray(livraison.historique)) {
                for (const history of livraison.historique) {
                    trackingEvents.push({
                    event_type: 'delivery_status_update',
                    timestamp: history.update_time,
                    description: history.remarks || `Delivery status updated to: ${history.status}`,
                    details: {
                        livraison_id: livraison.id,
                        status: history.status,
                        remarks: history.remarks,
                        update_time: history.update_time
                        ? history.update_time.toFormat('yyyy-MM-dd HH:mm:ss')
                        : null,
                    },
                    })
                }
            }
        }

        // Sort all events by timestamp (newest first)
        trackingEvents.sort((a, b) => {
            try {
            // Ensure both timestamps are DateTime objects
            const timestampA =
                a.timestamp instanceof DateTime
                ? a.timestamp
                : typeof a.timestamp === 'string'
                    ? DateTime.fromISO(a.timestamp)
                    : DateTime.fromJSDate(a.timestamp)

            const timestampB =
                b.timestamp instanceof DateTime
                ? b.timestamp
                : typeof b.timestamp === 'string'
                    ? DateTime.fromISO(b.timestamp)
                    : DateTime.fromJSDate(b.timestamp)

            // Compare milliseconds for consistent sorting
            return timestampB.toMillis() - timestampA.toMillis()
            } catch (error) {
            console.error('Error comparing timestamps:', error)
            // If conversion fails, use string comparison as fallback
            return String(b.timestamp).localeCompare(String(a.timestamp))
            }
        })

        return response.ok({
            colis: colis.serialize(),
            tracking_history: trackingEvents,
        })
        } catch (error) {
        console.error('Error retrieving tracking history:', error)
        return response.internalServerError({
            error: 'Failed to retrieve tracking history',
            message: error.message,
        })
        }
    }
}

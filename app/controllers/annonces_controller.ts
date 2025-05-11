import type { HttpContext } from '@adonisjs/core/http'
import Annonce from '#models/annonce'
import Colis from '#models/colis'
import StockageColi from '#models/stockage_coli'
import { annonceValidator } from '#validators/create_annonce'
import { updateAnnonceValidator } from '#validators/update_annonce'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class AnnoncesController {
    async create({ request, response }: HttpContext) {
        const {
            utilisateur_id,
            title,
            description,
            tags,
            price,
            scheduled_date,
            actual_delivery_date,
        } = await request.validateUsing(annonceValidator)

        const annonce = await Annonce.create({
            utilisateurId: utilisateur_id,
            title,
            description: description ?? null,
            price: price,
            tags: tags ?? [],
            state: 'open',
            scheduledDate: scheduled_date ? DateTime.fromJSDate(scheduled_date) : null,
            actualDeliveryDate: actual_delivery_date ? DateTime.fromJSDate(actual_delivery_date) : null,
        })
        await annonce.load('utilisateur' as ExtractModelRelations<Annonce>)
        return response.created({ annonce: annonce.serialize() })
    }

    async createWithColis({ request, response }: HttpContext) {
        // First create the annonce
        const { utilisateur_id, title, description, tags, price, scheduled_date, actual_delivery_date, colis } = await request.validateUsing(annonceValidator)

        const annonce = await Annonce.create({
            utilisateurId: utilisateur_id, 
            title,
            description: description ?? null,
            price: price,
            tags: tags ?? [],
            state: 'open',
            scheduledDate: scheduled_date 
                ? DateTime.fromJSDate(scheduled_date)
                : null,
            actualDeliveryDate: actual_delivery_date
                ? DateTime.fromJSDate(actual_delivery_date)
                : null,
        })

        // Create each colis associated with this annonce
        const createdColis = []
        if (colis && Array.isArray(colis)) {
            for (const coliData of colis) {
                // Generate a unique tracking number
                let trackingNumber = `COLIS-${Math.floor(Math.random() * 1e6)}`
                while (await Colis.findBy('tracking_number', trackingNumber)) {
                    trackingNumber = `COLIS-${Math.floor(Math.random() * 1e6)}`
                }

                const newColis = await Colis.create({
                    annonceId: annonce.id,
                    trackingNumber,
                    weight: coliData.weight,
                    length: coliData.length,
                    width: coliData.width,
                    height: coliData.height,
                    contentDescription: coliData.content_description ?? undefined,
                    status: 'stored',
                    clientId: coliData.location_type === 'client' ? coliData.client_id : null,
                    warehouseId: coliData.location_type === 'warehouse' ? coliData.warehouse_id : null,
                })

                // Create storage record if needed
                if (coliData.location_type === 'warehouse' && coliData.warehouse_id) {
                    await StockageColi.create({
                        colis_id: newColis.id,
                        colis_tracking_number: trackingNumber,
                        wharehouse_id: coliData.warehouse_id,
                        storage_area: 'General',
                        stored_until: DateTime.now().plus({ months: 1 }),
                        description: coliData.content_description ?? 'Standard storage'
                    })
                }

                createdColis.push(newColis)
            }
        }

        await annonce.load('utilisateur' as ExtractModelRelations<Annonce>)
        await annonce.load('colis')
        
        return response.created({ 
            annonce: annonce.serialize(),
            colis: createdColis.map(coli => coli.serialize())
        })
    }

    async getUserAnnonces({ request, response }: HttpContext) {
        const userId = request.param('utilisateur_id')
        const annonces = await Annonce.query()
            .where('utilisateur_id', userId)
            .preload('utilisateur' as ExtractModelRelations<Annonce>)
            .preload('colis')
            .preload('services')
            .orderBy('created_at', 'desc')
        return response.ok({ annonces: annonces.map((annonce) => annonce.serialize()) })
    }

    async getAnnonce({ request, response }: HttpContext) {
        const annonce = await Annonce.query()
            .where('id', request.param('id'))
            .preload('utilisateur' as ExtractModelRelations<Annonce>)
            .preload('colis')
            .preload('services')
            .firstOrFail()

        return response.ok({ annonce: annonce.serialize() })
    }

    async updateAnnonce({ request, response }: HttpContext) {
        const { title, description, price, state, scheduled_date, actual_delivery_date } =
        await request.validateUsing(updateAnnonceValidator)
        const annonce = await Annonce.findOrFail(request.param('id'))
        annonce.merge({
            title: title ?? annonce.title,
            description: description ?? annonce.description,
            price: price,
            state: state ?? annonce.state,
            scheduledDate: scheduled_date ? DateTime.fromJSDate(scheduled_date) : annonce.scheduledDate,
            actualDeliveryDate: actual_delivery_date
                ? DateTime.fromJSDate(actual_delivery_date)
                : annonce.actualDeliveryDate,
        })
        await annonce.save()
        await annonce.load('colis')
        await annonce.load('services')
        return response.ok({ annonce: annonce.serialize() })
    }
}

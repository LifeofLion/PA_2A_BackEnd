import vine from '@vinejs/vine'

export const livraisonValidator = vine.compile(
    vine.object({
        livreur_id: vine.number().min(1),
        scheduled_date: vine.date(),
        actual_delivery_date: vine.date().optional(),
        pickup_location: vine.string().minLength(3).maxLength(100),
        dropoff_location: vine.string().minLength(3).maxLength(100),
        status: vine.enum(['pending', 'in_progress', 'delivered', 'canceled']).optional(),
    })
)
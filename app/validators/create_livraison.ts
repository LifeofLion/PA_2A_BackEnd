import vine from '@vinejs/vine'

export const livraisonValidator = vine.compile(
    vine.object({
        livreur_id: vine.number().min(1),
        pickup_location: vine.string().minLength(3).maxLength(100),
        dropoff_location: vine.string().minLength(3).maxLength(100),
        status: vine.enum(['scheduled','in_progress','completed','cancelled']).optional(),
    })
)
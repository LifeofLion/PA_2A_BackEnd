import vine from '@vinejs/vine'

export const updateAnnonceValidator = vine.compile(
    vine.object({
        title: vine.string().minLength(3).maxLength(50).optional(),
        description: vine.string().minLength(10).maxLength(500).optional(),
        price: vine.number(),
        state: vine.enum(['open', 'pending', 'closed']).optional(),
        scheduled_date: vine.date().optional(),
        actual_delivery_date: vine.date().optional(),
    })
)
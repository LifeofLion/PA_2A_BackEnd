import vine from '@vinejs/vine'

export const colisValidator = vine.compile(
    vine.object({
        annonce_id:         vine.number().min(1),
        weight: vine.number().min(0),
        length: vine.number().min(0),
        width: vine.number().min(0),
        height: vine.number().min(0),
        content_description: vine.string().nullable().optional(),
        location_type: vine.enum(['client','warehouse','storage_box']).optional(),
        client_id: vine.number().min(1).optional(),
        warehouse_id: vine.number().min(1).optional(),
    })
)

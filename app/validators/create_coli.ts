import vine from '@vinejs/vine'

export const colisValidator = vine.compile(
    vine.object({
        annonce_id: vine.number(),
        weight: vine.number().min(0).max(1000),
        length: vine.number().min(0).max(1000),
        width: vine.number().min(0).max(1000),
        height: vine.number().min(0).max(1000),
        content_description: vine.string().minLength(3).maxLength(50),
    })
)

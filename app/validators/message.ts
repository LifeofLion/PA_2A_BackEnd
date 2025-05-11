import vine from '@vinejs/vine'

export const messageValidator = vine.compile(
    vine.object({
        senderId: vine.number().min(1),
        receiver_id: vine.number().min(1),
        content: vine.string().minLength(1),
    })
)
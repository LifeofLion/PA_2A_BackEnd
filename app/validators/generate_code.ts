import vine from '@vinejs/vine'

export const generateCodeValidator = vine.compile(
    vine.object({
        user_info: vine.string(),
    })
)
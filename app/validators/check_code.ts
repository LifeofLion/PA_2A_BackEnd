import vine from '@vinejs/vine'

export const checkCodeValidator = vine.compile(
    vine.object({
        user_info: vine.string(),
        code: vine.string(),
    })
)
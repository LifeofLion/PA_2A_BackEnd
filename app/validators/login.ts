import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email().toLowerCase(),
        password: vine.string().minLength(6).maxLength(20),
    })
)
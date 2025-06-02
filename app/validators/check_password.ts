import vine from '@vinejs/vine'

export const checkPasswordValidator = vine.compile(
    vine.object({
        email: vine.string().email().toLowerCase(),
        password: vine.string().minLength(6).maxLength(20),
    })
)

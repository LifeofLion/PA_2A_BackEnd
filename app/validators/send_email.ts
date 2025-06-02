import vine from '@vinejs/vine'

export const sendEmailValidator = vine.compile(
    vine.object({
        to: vine.string().email().toLowerCase(),
        subject: vine.string().minLength(3).maxLength(100),
        body: vine.string().minLength(3).maxLength(1000),
    })
)

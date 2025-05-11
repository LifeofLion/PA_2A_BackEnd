import vine from '@vinejs/vine'

export const userUpdateValidator = vine.compile(
    vine.object({
        first_name: vine.string().minLength(3).maxLength(50).optional(),
        last_name: vine.string().minLength(3).maxLength(50).optional(),
        address: vine.string().minLength(3).maxLength(255).nullable().optional(),
        city: vine.string().minLength(2).maxLength(100).optional(),
        postalCode: vine.string().minLength(2).maxLength(20).optional(),
        country: vine.string().minLength(2).maxLength(100).optional(),
        password: vine.string().minLength(6).maxLength(20).optional(),
        phone_number: vine.string().nullable().optional(),
    })
)
import vine from '@vinejs/vine'

export const wharehouseValidator = vine.compile(
  vine.object({
    location: vine.string(),
    capacity: vine.number().positive(),
  })
)

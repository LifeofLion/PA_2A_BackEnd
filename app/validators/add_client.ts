import vine from '@vinejs/vine'

export const clientValidator = vine.compile(
  vine.object({
    utilisateur_id: vine.number(),
  })
)

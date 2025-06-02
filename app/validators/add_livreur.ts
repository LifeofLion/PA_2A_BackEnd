import vine from '@vinejs/vine'

export const livreurValidator = vine.compile(
  vine.object({
    utilisateur_id: vine.number(),
  })
)

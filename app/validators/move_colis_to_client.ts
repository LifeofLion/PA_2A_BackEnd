import vine from '@vinejs/vine'

export const moveColisToClientValidator = vine.compile(
  vine.object({
    colis_id: vine.number().positive(),
    address: vine.string(),
  })
)

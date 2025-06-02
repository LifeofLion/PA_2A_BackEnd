import vine from '@vinejs/vine'

export const stockageColiValidator = vine.compile(
  vine.object({
    colis_id: vine.number().positive(),
    wharehouse_id: vine.number().positive(),
    storage_area: vine.string(),
    stored_until: vine.string(),
    description: vine.string().optional(),
  })
)

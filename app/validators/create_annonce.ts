import vine from '@vinejs/vine'

export const annonceValidator = vine.compile(
  vine.object({
    utilisateur_id: vine.number(),
    title: vine.string().minLength(3).maxLength(50),
    description: vine.string().minLength(10).maxLength(500).optional(),
    price: vine.number(),
    tags: vine.array(vine.string()).optional(),
    scheduled_date: vine.date().optional(),
    actual_delivery_date: vine.date().optional(),
    destination_address: vine.string().optional(),
    starting_address: vine.string().optional(),
    priority: vine.boolean().optional(),
    storage_box_id: vine.string().optional(),
    image_path: vine.string().optional(),
  })
)

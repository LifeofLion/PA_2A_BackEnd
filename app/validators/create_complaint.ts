import vine from '@vinejs/vine'

export const complaintValidator = vine.compile(
  vine.object({
    utilisateur_id: vine.number().positive(),
    subject: vine.string().minLength(3).maxLength(255),
    description: vine.string().minLength(10),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    related_order_id: vine.string().optional(),
  })
)

import vine from '@vinejs/vine'

export const adminValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
    privileges: vine.enum(['basic', 'full', 'super']).optional(),
  })
)

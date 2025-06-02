import vine from '@vinejs/vine'

export const messageValidator = vine.compile(
  vine.object({
    senderId: vine.number().min(1),
    receiverId: vine.number().min(1),
    content: vine.string().minLength(1),
    tempId: vine.string().optional(),
  })
)

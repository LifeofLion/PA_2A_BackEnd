import vine from '@vinejs/vine'

export const commercantValidator = vine.compile(
  vine.object({
    utilisateur_id: vine.number(),
    store_name: vine.string().maxLength(50),
    business_address: vine.string().maxLength(100).optional(),
    contact_number: vine.string().maxLength(15).optional(),
    contract_start_date: vine.string(),
    contract_end_date: vine.string(),
  })
)

import vine from '@vinejs/vine'

// Fonction de validation personnalisée pour les dates
function parseDateString(value: any): Date | undefined {
  if (!value) return undefined

  // Si c'est déjà une date, la retourner
  if (value instanceof Date) return value

  // Si c'est une chaîne au format YYYY-MM-DD (format standard HTML date input)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value)
    // Vérifier que la date est valide
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  // Pour d'autres formats, tenter une conversion standard
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date
  }

  return undefined
}

export const updateAnnonceValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(3).maxLength(50).optional(),
    description: vine.string().minLength(10).maxLength(500).optional(),
    price: vine.number(),
    state: vine.enum(['open', 'pending', 'closed']).optional(),
    scheduled_date: vine.date().optional(),
    actual_delivery_date: vine.date().optional(),
    destination_address: vine.string().optional(),
    starting_address: vine.string().optional(),
    priority: vine.boolean().optional(),
    storage_box_id: vine.string().optional(),
  })
)

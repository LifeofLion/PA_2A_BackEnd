import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Utilisateurs from '#models/utilisateurs'

export default class Complaint extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare utilisateurId: number

  @column()
  declare subject: string

  @column()
  declare description: string

  @column()
  declare status: 'open' | 'in_progress' | 'resolved' | 'closed'

  @column()
  declare priority: 'low' | 'medium' | 'high' | 'urgent'

  @column()
  declare relatedOrderId: string | null

  @column()
  declare imagePath: string | null

  @column()
  declare adminNotes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Utilisateurs, {
    foreignKey: 'utilisateurId',
  })
  declare utilisateur: BelongsTo<typeof Utilisateurs>
}

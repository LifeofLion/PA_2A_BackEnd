import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Utilisateurs from '#models/utilisateurs'

export default class Commercant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeName: string

  @column()
  declare businessAddress: string | null

  @column()
  declare contactNumber: string | null

  @column.date()
  declare contractStartDate: DateTime

  @column.date()
  declare contractEndDate: DateTime

  @column()
  declare verificationState: 'pending' | 'verified' | 'rejected'

  @belongsTo(() => Utilisateurs, {
    foreignKey: 'id',
    localKey: 'id',
  })
  declare user: BelongsTo<typeof Utilisateurs>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

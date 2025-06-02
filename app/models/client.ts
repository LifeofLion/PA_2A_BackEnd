import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Utilisateurs from '#models/utilisateurs'


export default class Client extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare loyalty_points: number

  @column()
  declare preferred_payment_method: string | null

  @belongsTo(() => Utilisateurs, { foreignKey: 'id' })
  declare user: BelongsTo<typeof Utilisateurs>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

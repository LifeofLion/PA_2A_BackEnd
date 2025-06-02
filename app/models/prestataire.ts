import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Utilisateurs from '#models/utilisateurs'
import Service from '#models/service'

export default class Prestataire extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare service_type: string | null

  @column()
  declare rating: number | null

  @belongsTo(() => Utilisateurs, { foreignKey: 'id' })
  declare user: BelongsTo<typeof Utilisateurs>

  @hasMany(() => Service, { foreignKey: 'prestataire_id' })
  declare services: HasMany<typeof Service>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
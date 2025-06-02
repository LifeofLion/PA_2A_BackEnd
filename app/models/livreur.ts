import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Livraison from '#models/livraison'
import Utilisateurs from '#models/utilisateurs'

export default class Livreur extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare availabilityStatus: 'available' | 'busy' | 'offline'

  @column()
  declare rating: number | null

  @column()
  declare totalDeliveries: number

  @column()
  declare vehicleType: string

  @column()
  declare vehicleNumber: string

  @belongsTo(() => Utilisateurs, {
    foreignKey: 'id',
    localKey: 'id',
  })
  declare user: BelongsTo<typeof Utilisateurs>

  @hasMany(() => Livraison, {
    foreignKey: 'livreurId',
  })
  declare livraisons: HasMany<typeof Livraison>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

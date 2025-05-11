import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Utilisateurs from '#models/utilisateurs'
import Colis from '#models/colis'
import Service from '#models/service'

export default class Annonce extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'utilisateur_id' })
  declare utilisateurId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column()
  declare tags: string[]

  @column()
  declare state: 'open' | 'pending' | 'closed'

  @column.dateTime({ columnName: 'scheduled_date' })
  declare scheduledDate: DateTime | null

  @column.dateTime({ columnName: 'actual_delivery_date' })
  declare actualDeliveryDate: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Utilisateurs, {
    foreignKey: 'utilisateurId',
  })
  declare utilisateur: BelongsTo<typeof Utilisateurs>

  @hasMany(() => Colis, {
    foreignKey: 'annonceId',
  })
  declare colis: HasMany<typeof Colis>

  @manyToMany(() => Service, {
    pivotTable: 'annonce_services',
    pivotForeignKey: 'annonce_id',
    pivotRelatedForeignKey: 'service_id',
  })
  declare services: ManyToMany<typeof Service>
}
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Prestataire from '#models/prestataire'
import Annonce from '#models/annonce'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare prestataire_id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare price: number

  @column()
  declare start_date: DateTime

  @column()
  declare end_date: DateTime

  @column()
  declare location: string

  @column()
  declare status: string

  @belongsTo(() => Prestataire, { foreignKey: 'prestataire_id' })
  declare prestataire: BelongsTo<typeof Prestataire>

  @manyToMany(() => Annonce, {
    pivotTable: 'annonce_services',
    pivotForeignKey: 'service_id',
    pivotRelatedForeignKey: 'annonce_id',
  })
  declare annonces: ManyToMany<typeof Annonce>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
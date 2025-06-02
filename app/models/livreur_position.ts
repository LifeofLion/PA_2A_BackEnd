import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Livreur from '#models/livreur'
import Livraison from '#models/livraison'

export default class LivreurPosition extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'livreur_id' })
  declare livreurId: number

  @column({ columnName: 'livraison_id' })
  declare livraisonId: number | null

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare accuracy: number | null

  @column()
  declare speed: number | null

  @column()
  declare heading: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Livreur, {
    foreignKey: 'livreurId',
  })
  declare livreur: BelongsTo<typeof Livreur>

  @belongsTo(() => Livraison, {
    foreignKey: 'livraisonId',
  })
  declare livraison: BelongsTo<typeof Livraison>
}

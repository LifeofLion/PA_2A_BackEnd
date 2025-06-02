import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Livraison from '#models/livraison'

export default class HistoriqueLivraison extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'livraison_id' })
  declare livraisonId: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'update_time' })
  declare updateTime: DateTime

  @column()
  declare remarks: string | null

  @belongsTo(() => Livraison, {
    foreignKey: 'livraisonId',
    localKey: 'id',
  })
  declare livraison: BelongsTo<typeof Livraison>
}

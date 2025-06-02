import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasOne } from '@adonisjs/lucid/types/relations'
import Annonce from '#models/annonce'
import Livraison from '#models/livraison'
import StockageColi from '#models/stockage_coli'

export default class Colis extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'annonce_id' })
  declare annonceId: number

  @column()
  declare trackingNumber: string

  @column()
  declare weight: number

  @column()
  declare length: number

  @column()
  declare width: number

  @column()
  declare height: number

  @column()
  declare contentDescription: string

  @column()
  declare status: 'stored' | 'in_transit' | 'delivered' | 'lost'

  @column()
  declare locationType: 'warehouse' | 'storage_box' | 'client_address' | 'in_transit' | null

  @column()
  declare locationId: number | null

  @column()
  declare currentAddress: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Annonce, {
    foreignKey: 'annonceId',
  })
  declare annonce: BelongsTo<typeof Annonce>

  @manyToMany(() => Livraison, {
    pivotTable: 'livraison_colis',
    pivotForeignKey: 'colis_id',
    pivotRelatedForeignKey: 'livraison_id',
  })
  declare livraisons: ManyToMany<typeof Livraison>

  @hasOne(() => StockageColi, {
    foreignKey: 'colisId',
  })
  declare stockage: HasOne<typeof StockageColi>
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Annonce from '#models/annonce'
import Livraison from '#models/livraison'
import StockageColi from '#models/stockage_coli'
import Wharehouse from '#models/wharehouse'
import Utilisateurs from '#models/utilisateurs'

export default class Colis extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'annonce_id' })
  declare annonceId: number

  @column({ columnName: 'client_id' })
  declare clientId: number | null

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number | null

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Annonce,    { foreignKey: 'annonceId' })
  declare annonce: BelongsTo<typeof Annonce>

  @belongsTo(() => Utilisateurs, { foreignKey: 'clientId' })
  declare client: BelongsTo<typeof Utilisateurs>

  @belongsTo(() => Wharehouse,   { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof Wharehouse>

  @hasMany(() => StockageColi, {
    foreignKey: 'colis_id',
    localKey: 'id',
  })
  declare stockageRecords: HasMany<typeof StockageColi>

  @manyToMany(() => Livraison, {
    pivotTable:          'livraison_colis',
    pivotForeignKey:     'colis_id',
    pivotRelatedForeignKey:'livraison_id',
  })
  declare livraisons: ManyToMany<typeof Livraison>
}
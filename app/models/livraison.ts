import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Colis from '#models/colis'
import Livreur from '#models/livreur'
import HistoriqueLivraison from '#models/historique_livraison'

export default class Livraison extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'livreur_id' })
  declare livreurId: number | null

  @column()
  declare pickupLocation: string

  @column()
  declare dropoffLocation: string

  @column()
  declare status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

  @belongsTo(() => Livreur, {
    foreignKey: 'livreur_id',
  })
  declare livreur: BelongsTo<typeof Livreur>

  @manyToMany(() => Colis, {
    pivotTable: 'livraison_colis',
    pivotForeignKey: 'livraison_id',
    pivotRelatedForeignKey: 'colis_id',
  })
  declare colis: ManyToMany<typeof Colis>

  @hasMany(() => HistoriqueLivraison, { foreignKey: 'livraison_id' })
  declare historique: HasMany<typeof HistoriqueLivraison>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

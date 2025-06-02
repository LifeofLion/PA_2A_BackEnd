import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Colis from '#models/colis'

export default class ColisLocationHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'colis_id' })
  declare colisId: number

  @column()
  declare locationType: 'warehouse' | 'storage_box' | 'client_address' | 'in_transit'

  @column()
  declare locationId: number | null

  @column()
  declare address: string | null

  @column()
  declare description: string | null

  @column.dateTime()
  declare movedAt: DateTime

  @belongsTo(() => Colis, {
    foreignKey: 'colisId',
  })
  declare colis: BelongsTo<typeof Colis>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

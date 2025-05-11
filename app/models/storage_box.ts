import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Colis from '#models/colis'
import Wharehouse from '#models/wharehouse'

export default class StorageBox extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'colis_id' })
  declare colisId: number

  @column({ columnName: 'wharehouse_id' })
  declare warehouseId: number

  @column()
  declare storage_area: string

  @column.dateTime()
  declare stored_until: DateTime

  @column()
  declare description: string | null

  @belongsTo(() => Colis, { foreignKey: 'colisId' })
  declare colis: BelongsTo<typeof Colis>

  @belongsTo(() => Wharehouse, { foreignKey: 'warehouseId' })
  declare wharehouse: BelongsTo<typeof Wharehouse>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

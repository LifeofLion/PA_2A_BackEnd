import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Utilisateurs from '#models/utilisateurs'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'sender_id' })
  declare senderId: number

  @column({ columnName: 'receiver_id' })
  declare receiverId: number

  @column()
  declare content: string

  @column()
  declare isRead: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Utilisateurs, { foreignKey: 'senderId' })
  declare sender:   BelongsTo<typeof Utilisateurs>

  @belongsTo(() => Utilisateurs, { foreignKey: 'receiverId' })
  declare receiver: BelongsTo<typeof Utilisateurs>
}
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'


export default class Commercant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare store_name: string

  @column()
  declare business_address: string | null

  @column()
  declare contact_number: string | null

  @column()
  declare contract_start_date: DateTime

  @column()
  declare contract_end_date: DateTime

  @column()
  declare verification_state: 'pending' | 'verified' | 'rejected'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

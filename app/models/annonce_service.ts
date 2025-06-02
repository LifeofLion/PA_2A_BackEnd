import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AnnonceService extends BaseModel {
  @column({ isPrimary: true })
  declare annonce_id: number

  @column({ isPrimary: true })
  declare service_id: number
}
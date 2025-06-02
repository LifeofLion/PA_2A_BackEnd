import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CodeTemporaire extends BaseModel {
  public static table = 'code_temporaire'
  public static self = { disableTimestamps: true }

  @column({ isPrimary: true })
  declare user_info: string

  @column({ isPrimary: true })
  declare code: string
}
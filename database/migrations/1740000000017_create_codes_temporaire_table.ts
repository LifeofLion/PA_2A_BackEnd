import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'code_temporaire'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('user_info').notNullable()
      table.string('code').notNullable()
      table.primary(['user_info', 'code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
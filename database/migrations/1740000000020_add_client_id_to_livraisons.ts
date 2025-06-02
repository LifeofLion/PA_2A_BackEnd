import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'livraisons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('client_id').unsigned().nullable()
      table.foreign('client_id').references('id').inTable('clients').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['client_id'])
      table.dropColumn('client_id')
    })
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'historique_livraisons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('livraison_id').unsigned().notNullable()
      table.string('status').nullable()
      table.timestamp('update_time').notNullable()
      table.string('remarks').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
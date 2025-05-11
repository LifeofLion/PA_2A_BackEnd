import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storage_box'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('colis_id').unsigned().notNullable()

      table.integer('wharehouse_id').unsigned().notNullable()
      table.string('storage_area').notNullable()
      table.dateTime('stored_until').notNullable()
      table.string('description').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table
        .foreign('colis_id')
        .references('id')
        .inTable('colis')
        .onDelete('CASCADE')

      table
        .foreign('wharehouse_id')
        .references('id')
        .inTable('wharehouses')
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
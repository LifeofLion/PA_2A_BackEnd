import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'livreurs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('availability_status').notNullable()
      table.decimal('rating', 3, 2).nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('id').references('id').inTable('utilisateurs').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

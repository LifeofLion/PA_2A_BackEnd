import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'colis_location_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('colis_id').unsigned().notNullable()
      table.string('location_type').notNullable()
      table.integer('location_id').nullable()
      table.string('address').nullable()
      table.string('description').nullable()
      table.dateTime('moved_at').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('colis_id').references('id').inTable('colis').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

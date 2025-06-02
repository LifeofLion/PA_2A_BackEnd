import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commercants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('store_name').notNullable()
      table.string('business_address').nullable()
      table.string('contact_number', 20).nullable()
      table.date('contract_start_date').notNullable()
      table.date('contract_end_date').notNullable()
      table
        .enum('verification_state', ['pending', 'verified', 'rejected'])
        .notNullable()
        .defaultTo('pending')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('id').references('id').inTable('utilisateurs').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

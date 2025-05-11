import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'utilisateurs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('address').nullable().defaultTo('')
      table.string('city', 100).nullable().defaultTo('')
      table.string('postal_code', 20).nullable().defaultTo('')
      table.string('country').notNullable()
      table.string('phone_number', 20).nullable().defaultTo('')
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enum('state', ['open', 'banned', 'closed']).defaultTo('open')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

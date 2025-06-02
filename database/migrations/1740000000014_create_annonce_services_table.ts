import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'annonce_services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('annonce_id').unsigned().notNullable()
      table.integer('service_id').unsigned().notNullable()

      table
        .foreign('annonce_id')
        .references('id')
        .inTable('annonces')
        .onDelete('CASCADE')

      table
        .foreign('service_id')
        .references('id')
        .inTable('services')
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
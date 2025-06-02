import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateColisTable extends BaseSchema {
  protected tableName = 'colis'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('annonce_id').unsigned().notNullable()
      table.string('tracking_number').notNullable().unique()
      table.decimal('weight', 8, 2).notNullable()
      table.decimal('length', 8, 2).notNullable()
      table.decimal('width', 8, 2).notNullable()
      table.decimal('height', 8, 2).notNullable()
      table.string('content_description').nullable()
      table.enum('status', ['stored', 'in_transit', 'delivered', 'lost']).defaultTo('stored')

      // Champs de localisation ajoutés
      table.string('location_type').nullable()
      table.integer('location_id').nullable()
      table.string('current_address').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('annonce_id').references('id').inTable('annonces').onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

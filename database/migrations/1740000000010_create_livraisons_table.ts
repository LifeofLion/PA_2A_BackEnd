import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'livraisons'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('livreur_id').unsigned().nullable()
      table.text('pickup_location').notNullable()
      table.text('dropoff_location').notNullable()
      table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table
        .foreign('livreur_id')
        .references('id')
        .inTable('livreurs')
        .onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
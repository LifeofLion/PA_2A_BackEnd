import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'annonces'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('utilisateur_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('utilisateurs')

      table.string('title').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.specificType('tags', 'text[]').nullable()
      table.enum('state', ['open', 'pending', 'closed']).defaultTo('open')
      table.dateTime('scheduled_date').nullable()
      table.dateTime('actual_delivery_date').nullable()

      // Colonnes ajoutées des autres migrations
      table.string('destination_address').nullable()
      table.string('starting_address').nullable()
      table.string('image_path').nullable()
      table.boolean('priority').defaultTo(false)
      table.string('storage_box_id').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

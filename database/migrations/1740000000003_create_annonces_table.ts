import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'annonces'

  public async up () {
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
      table.enum('state', ['open', 'pending', 'closed']).defaultTo('open')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}

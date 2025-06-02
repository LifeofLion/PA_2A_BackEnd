import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'complaints'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('utilisateur_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('utilisateurs')

      table.string('subject').notNullable()
      table.text('description').notNullable()
      table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open')
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium')
      table.string('related_order_id').nullable()
      table.string('image_path').nullable()
      table.text('admin_notes').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

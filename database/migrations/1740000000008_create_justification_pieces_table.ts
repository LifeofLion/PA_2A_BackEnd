import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'justification_pieces'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('utilisateur_id').unsigned()
      table.string('document_type', 255).notNullable()
      table.string('file_path', 255).notNullable()
      table
        .enum('verification_status', ['pending', 'verified', 'rejected'])
        .notNullable()
        .defaultTo('pending')
      table.timestamp('uploaded_at')
      table.timestamp('verified_at').nullable()

      table.foreign('utilisateur_id').references('id').inTable('utilisateurs').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

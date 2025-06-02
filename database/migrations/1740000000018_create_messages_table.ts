import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('sender_id').unsigned().notNullable()
      table.integer('receiver_id').unsigned().notNullable()
      table.text('content').notNullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      table.foreign('sender_id').references('id').inTable('utilisateurs').onDelete('CASCADE')
      table.foreign('receiver_id').references('id').inTable('utilisateurs').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'livreur_positions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('livreur_id').unsigned().notNullable()
      table.integer('livraison_id').unsigned().nullable()
      table.decimal('latitude', 10, 8).notNullable()
      table.decimal('longitude', 11, 8).notNullable()
      table.float('accuracy').nullable()
      table.float('speed').nullable()
      table.float('heading').nullable()
      table.timestamp('created_at')

      table.foreign('livreur_id').references('id').inTable('livreurs').onDelete('CASCADE')
      table.foreign('livraison_id').references('id').inTable('livraisons').onDelete('SET NULL')

      // Index pour les requêtes de position
      table.index(['livreur_id', 'created_at'])
      table.index(['livraison_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

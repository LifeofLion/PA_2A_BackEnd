import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddLivraisonIdToColisTable extends BaseSchema {
  protected tableName = 'livraison_colis'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('livraison_id').unsigned().notNullable()
      table.integer('colis_id').unsigned().notNullable()
      table.primary(['livraison_id', 'colis_id'])

      table
        .foreign('livraison_id')
        .references('id')
        .inTable('livraisons')
        .onDelete('CASCADE')

      table
        .foreign('colis_id')
        .references('id')
        .inTable('colis')
        .onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
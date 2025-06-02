import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const assets = [
      {
        "id": 1,
        "loyalty_points": 100,
        "preferred_payment_method": "credit_card",
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 2,
        "loyalty_points": 200,
        "preferred_payment_method": "cash",
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 3,
        "loyalty_points": 150,
        "preferred_payment_method": null,
        "created_at": new Date(),
        "updated_at": new Date()
      }
    ]
    await this.client.table('clients').insert(assets)
  }
}
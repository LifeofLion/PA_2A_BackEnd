import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const assets = [
      {
        "id": 1,
        "location": "14 Rue de Birague, 75004 Paris",
        "capacity": 100,
        "created_at": new Date(),
        "updated_at": new Date()
      }
    ]
    await this.client.table('wharehouses').insert(assets)
  }
}
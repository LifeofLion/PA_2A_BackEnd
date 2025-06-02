import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const assets = [
      {
        "id": 1,
        "availability_status": "available",
        "rating": 4.5,
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 2,
        "availability_status": "unavailable",
        "rating": 4.0,
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 3,
        "availability_status": "available",
        "rating": 4.8,
        "created_at": new Date(),
        "updated_at": new Date()
      },
    ]
    await this.client.table('livreurs').insert(assets)
  }
}
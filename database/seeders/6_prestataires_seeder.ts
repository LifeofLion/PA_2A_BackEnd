import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const assets = [
      {
        "id": 1,
        "service_type": "baby-sitting",
        "rating": 4.5,
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 2,
        "service_type": "dog-walking",
        "rating": 4.0,
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 3,
        "service_type": "house-cleaning",
        "rating": 4.8,
        "created_at": new Date(),
        "updated_at": new Date()
      },
    ]
    await this.client.table('prestataires').insert(assets)
  }
}
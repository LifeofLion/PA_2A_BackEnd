import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const assets = [
      {
        "id": 1,
        "store_name": "McDonald's",
        "business_address": "123 Main St, Springfield",
        "contact_number": "123-456-7890",
        "contract_start_date": new Date('2023-01-01'),
        "contract_end_date": new Date('2024-01-01'),
        "verification_state": "pending",
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 2,
        "store_name": "Starbucks",
        "business_address": "456 Elm St, Springfield",
        "contact_number": "987-654-3210",
        "contract_start_date": new Date('2023-02-01'),
        "contract_end_date": new Date('2024-02-01'),
        "verification_state": "pending",
        "created_at": new Date(),
        "updated_at": new Date()
      },
      {
        "id": 3,
        "store_name": "Walmart",
        "business_address": "789 Oak St, Springfield",
        "contact_number": "555-123-4567",
        "contract_start_date": new Date('2023-03-01'),
        "contract_end_date": new Date('2024-03-01'),
        "verification_state": "pending",
        "created_at": new Date(),
        "updated_at": new Date()
      },
    ]
    await this.client.table('commercants').insert(assets)
  }
}
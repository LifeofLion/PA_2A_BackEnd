import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const admins = [
      {
        id: 1, // Utilisateur John Doe (id=1)
        privileges: 'super',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4, // Utilisateur Bob Brown (id=4)
        privileges: 'basic',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]

    await this.client.table('admins').insert(admins)
  }
}

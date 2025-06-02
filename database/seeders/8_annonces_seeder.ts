import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const now = DateTime.now().toJSDate()
    const tomorrow = DateTime.now().plus({ days: 1 }).toJSDate()
    const nextWeek = DateTime.now().plus({ days: 7 }).toJSDate()

    const annonces = [
      {
        id: 1,
        utilisateur_id: 1, // John Doe (Client)
        title: 'Livraison de colis urgent',
        description: 'Besoin de livrer un colis de documents importants de Paris à Bagneux',
        price: 25.5,
        tags: ['urgent', 'documents', 'Paris', 'Bagneux'],
        state: 'open',
        scheduled_date: tomorrow,
        actual_delivery_date: null,
        destination_address: '24 Av. Albert Petit, 92220 Bagneux',
        starting_address: '61 Rue de Ménilmontant, 75020 Paris',
        image_path: null,
        priority: true,
        storage_box_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        utilisateur_id: 1, // John Doe (Client)
        title: 'Livraison de produits alimentaires',
        description: 'Livraison de produits frais du marché de Rungis à mon domicile',
        price: 35.0,
        tags: ['frais', 'alimentaire', 'Rungis', 'Paris'],
        state: 'pending',
        scheduled_date: nextWeek,
        actual_delivery_date: null,
        destination_address: '61 Rue de Ménilmontant, 75020 Paris',
        starting_address: 'Marché de Rungis, 94150 Rungis',
        image_path: null,
        priority: false,
        storage_box_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        utilisateur_id: 2, // Jane Smith (Client)
        title: 'Transport de meubles',
        description: "Besoin d'aide pour transporter une petite table et deux chaises",
        price: 50.0,
        tags: ['meubles', 'transport', 'Paris'],
        state: 'open',
        scheduled_date: nextWeek,
        actual_delivery_date: null,
        destination_address: '24 Av. Albert Petit, 92220 Bagneux',
        starting_address: '35 Boulevard de Magenta, 75010 Paris',
        image_path: null,
        priority: false,
        storage_box_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        utilisateur_id: 3, // Alice Johnson (Client)
        title: 'Livraison express de médicaments',
        description: 'Besoin urgent de faire livrer des médicaments de la pharmacie à mon domicile',
        price: 15.0,
        tags: ['urgent', 'médicaments', 'santé'],
        state: 'closed',
        scheduled_date: DateTime.now().minus({ days: 2 }).toJSDate(),
        actual_delivery_date: DateTime.now().minus({ days: 2 }).toJSDate(),
        destination_address: '8 Rue de la Paix, 75002 Paris',
        starting_address: '12 Avenue des Champs-Élysées, 75008 Paris',
        image_path: null,
        priority: true,
        storage_box_id: null,
        created_at: DateTime.now().minus({ days: 3 }).toJSDate(),
        updated_at: now,
      },
      {
        id: 5,
        utilisateur_id: 1, // John Doe (Client)
        title: 'Livraison de vêtements',
        description: 'Récupérer un costume chez le tailleur et le livrer à mon bureau',
        price: 20.0,
        tags: ['vêtements', 'costume', 'bureau'],
        state: 'open',
        scheduled_date: nextWeek,
        actual_delivery_date: null,
        destination_address: '5 Rue de Rivoli, 75001 Paris',
        starting_address: '61 Rue de Ménilmontant, 75020 Paris',
        image_path: null,
        priority: false,
        storage_box_id: null,
        created_at: now,
        updated_at: now,
      },
    ]

    await this.client.table('annonces').insert(annonces)
  }
}

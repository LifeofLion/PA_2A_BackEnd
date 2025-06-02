import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const now = DateTime.now().toJSDate()
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate()
    const lastWeek = DateTime.now().minus({ days: 7 }).toJSDate()

    const complaints = [
      {
        id: 1,
        utilisateur_id: 1, // John Doe
        subject: 'Colis endommagé',
        description:
          "Mon colis est arrivé endommagé avec des traces d'écrasement. Le contenu est intact mais l'emballage est abîmé.",
        status: 'open',
        priority: 'medium',
        related_order_id: '1', // Référence à l'annonce avec ID 1
        image_path: null,
        admin_notes: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        utilisateur_id: 1, // John Doe
        subject: 'Retard important de livraison',
        description:
          "Ma livraison était prévue hier et n'est toujours pas arrivée. Je n'ai reçu aucune information concernant ce retard.",
        status: 'in_progress',
        priority: 'high',
        related_order_id: '2', // Référence à l'annonce avec ID 2
        image_path: null,
        admin_notes: 'Livreur contacté, problème de véhicule signalé',
        created_at: yesterday,
        updated_at: now,
      },
      {
        id: 3,
        utilisateur_id: 2, // Jane Smith
        subject: 'Facturation incorrecte',
        description:
          'Le montant facturé ne correspond pas au devis initial. Il y a une différence de 15€ sans explication.',
        status: 'resolved',
        priority: 'medium',
        related_order_id: '3', // Référence à l'annonce avec ID 3
        image_path: null,
        admin_notes: 'Remboursement de la différence effectué',
        created_at: lastWeek,
        updated_at: yesterday,
      },
      {
        id: 4,
        utilisateur_id: 3, // Alice Johnson
        subject: "Erreur d'adresse de livraison",
        description:
          "Mon colis a été livré à la mauvaise adresse. L'adresse inscrite était correcte mais le livreur s'est trompé.",
        status: 'closed',
        priority: 'urgent',
        related_order_id: '4', // Référence à l'annonce avec ID 4
        image_path: null,
        admin_notes: 'Colis récupéré et livré à la bonne adresse avec compensation',
        created_at: lastWeek,
        updated_at: yesterday,
      },
    ]

    await this.client.table('complaints').insert(complaints)
  }
}

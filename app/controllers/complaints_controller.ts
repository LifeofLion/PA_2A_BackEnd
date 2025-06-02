import type { HttpContext } from '@adonisjs/core/http'
import Complaint from '#models/complaint'
import db from '@adonisjs/lucid/services/db'

export default class ComplaintsController {
  async index({ response }: HttpContext) {
    const complaints = await Complaint.query()
      .preload('utilisateur' as any)
      .orderBy('created_at', 'desc')

    return response.ok({ complaints: complaints.map((complaint) => complaint.serialize()) })
  }

  async create({ request, response }: HttpContext) {
    try {
      // Récupérer le dernier ID de la table complaints
      const result = await db.from('complaints').max('id as maxId').first()
      const maxId = result?.maxId || 0
      const nextId = Number(maxId) + 1

      const {
        utilisateur_id: utilisateurId,
        subject,
        description,
        priority,
        related_order_id: relatedOrderId,
      } = request.body()

      const complaint = await Complaint.create({
        id: nextId, // Définir explicitement le prochain ID
        utilisateurId,
        subject,
        description,
        status: 'open',
        priority: priority || 'medium',
        relatedOrderId: relatedOrderId || null,
        adminNotes: null,
      })

      await complaint.load('utilisateur' as any)
      return response.created({ complaint: complaint.serialize() })
    } catch (error) {
      console.error('Error creating complaint:', error)
      return response.status(500).send({
        error: error.message,
        detail: error.detail || 'Une erreur inconnue est survenue',
      })
    }
  }

  async show({ request, response }: HttpContext) {
    const complaint = await Complaint.query()
      .where('id', request.param('id'))
      .preload('utilisateur' as any)
      .firstOrFail()

    return response.ok({ complaint: complaint.serialize() })
  }

  async update({ request, response }: HttpContext) {
    const complaint = await Complaint.findOrFail(request.param('id'))

    const { subject, description, status, priority } = request.body()

    complaint.merge({
      subject: subject || complaint.subject,
      description: description || complaint.description,
      status: status || complaint.status,
      priority: priority || complaint.priority,
    })

    await complaint.save()
    await complaint.load('utilisateur' as any)

    return response.ok({ complaint: complaint.serialize() })
  }

  async getUserComplaints({ request, response }: HttpContext) {
    const userId = request.param('utilisateur_id')

    const complaints = await Complaint.query()
      .where('utilisateur_id', userId)
      .preload('utilisateur' as any)
      .orderBy('created_at', 'desc')

    return response.ok({ complaints: complaints.map((complaint) => complaint.serialize()) })
  }

  async delete({ request, response }: HttpContext) {
    const complaint = await Complaint.findOrFail(request.param('id'))
    await complaint.delete()

    return response.noContent()
  }
}

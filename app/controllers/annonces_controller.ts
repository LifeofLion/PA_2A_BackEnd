import type { HttpContext } from '@adonisjs/core/http'
import Annonce from '#models/annonce'
import { annonceValidator } from '#validators/create_annonce'
import { updateAnnonceValidator } from '#validators/update_annonce'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'

export default class AnnoncesController {
  async create({ request, response }: HttpContext) {
    try {
      // Récupérer le dernier ID de la table annonces
      const result = await db.from('annonces').max('id as maxId').first()
      const maxId = result?.maxId || 0
      const nextId = Number(maxId) + 1

      const {
        utilisateur_id,
        title,
        description,
        tags,
        price,
        scheduled_date,
        actual_delivery_date,
        destination_address,
        starting_address,
        priority,
        storage_box_id,
      } = await request.validateUsing(annonceValidator)

      const annonce = await Annonce.create({
        id: nextId, // Définir explicitement le prochain ID
        utilisateurId: utilisateur_id,
        title,
        description: description ?? null,
        price: price,
        tags: tags ?? [],
        state: 'open',
        scheduledDate: scheduled_date ? DateTime.fromJSDate(scheduled_date) : null,
        actualDeliveryDate: actual_delivery_date ? DateTime.fromJSDate(actual_delivery_date) : null,
        destinationAddress: destination_address ?? null,
        startingAddress: starting_address ?? null,
        imagePath: null,
        priority: priority ?? false,
        storageBoxId: storage_box_id ?? null,
      })

      // Gérer l'upload d'image si présent
      const image = request.file('image')
      if (image) {
        const fileName = `${Date.now()}_${image.clientName}`
        try {
          await image.move(app.tmpPath('uploads/annonces'), {
            name: fileName,
          })

          if (image.state === 'moved') {
            annonce.imagePath = `uploads/annonces/${fileName}`
            await annonce.save()
          }
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }

      await annonce.load('utilisateur' as ExtractModelRelations<Annonce>)
      return response.created({ annonce: annonce.serialize() })
    } catch (error) {
      console.error('Error creating annonce:', error)
      return response.status(500).send({
        error: error.message,
        detail: error.detail || 'Unknown error occurred',
      })
    }
  }

  async getAllAnnonces({ request, response }: HttpContext) {
    const annonces = await Annonce.query().preload('utilisateur' as ExtractModelRelations<Annonce>)
    return response.ok({ annonces: annonces.map((annonce) => annonce.serialize()) })
  }

  async getUserAnnonces({ request, response }: HttpContext) {
    const userId = request.param('utilisateur_id')
    const annonces = await Annonce.query()
      .where('utilisateur_id', userId)
      .preload('utilisateur' as ExtractModelRelations<Annonce>)
      .preload('colis')
      .preload('services')
      .orderBy('created_at', 'desc')
    return response.ok({ annonces: annonces.map((annonce) => annonce.serialize()) })
  }

  async getAnnonce({ request, response }: HttpContext) {
    const annonce = await Annonce.query()
      .where('id', request.param('id'))
      .preload('utilisateur' as ExtractModelRelations<Annonce>)
      .preload('colis')
      .preload('services')
      .firstOrFail()

    return response.ok({ annonce: annonce.serialize() })
  }

  async updateAnnonce({ request, response }: HttpContext) {
    const {
      title,
      description,
      price,
      state,
      scheduled_date,
      actual_delivery_date,
      destination_address,
      starting_address,
      priority,
      storage_box_id,
    } = await request.validateUsing(updateAnnonceValidator)

    const annonce = await Annonce.findOrFail(request.param('id'))

    annonce.merge({
      title: title ?? annonce.title,
      description: description ?? annonce.description,
      price: price,
      state: state ?? annonce.state,
      scheduledDate: scheduled_date ? DateTime.fromJSDate(scheduled_date) : annonce.scheduledDate,
      actualDeliveryDate: actual_delivery_date
        ? DateTime.fromJSDate(actual_delivery_date)
        : annonce.actualDeliveryDate,
      destinationAddress: destination_address ?? annonce.destinationAddress,
      startingAddress: starting_address ?? annonce.startingAddress,
      priority: priority ?? annonce.priority,
      storageBoxId: storage_box_id ?? annonce.storageBoxId,
    })

    // Gérer l'upload d'image si présent
    const image = request.file('image')
    if (image) {
      const fileName = `${Date.now()}_${image.clientName}`
      try {
        await image.move(app.tmpPath('uploads/annonces'), {
          name: fileName,
        })

        if (image.state === 'moved') {
          annonce.imagePath = `uploads/annonces/${fileName}`
        }
      } catch (error) {
        console.error('Image upload failed:', error)
      }
    }

    await annonce.save()
    await annonce.load('colis')
    await annonce.load('services')
    return response.ok({ annonce: annonce.serialize() })
  }

  // Méthode spéciale pour mettre à jour une annonce en acceptant des dates au format YYYY-MM-DD
  async updateAnnonceWithStringDates({ request, response }: HttpContext) {
    try {
      const annonce = await Annonce.findOrFail(request.param('id'))

      // Récupérer les données du formulaire
      const formData = request.all()

      // Traiter les dates spéciales
      if (formData.scheduled_date && typeof formData.scheduled_date === 'string') {
        // Convertir YYYY-MM-DD en objet DateTime
        try {
          annonce.scheduledDate = DateTime.fromFormat(formData.scheduled_date, 'yyyy-MM-dd')
        } catch (e) {
          console.error('Error parsing scheduled_date:', e)
        }
      }

      if (formData.actual_delivery_date && typeof formData.actual_delivery_date === 'string') {
        try {
          annonce.actualDeliveryDate = DateTime.fromFormat(
            formData.actual_delivery_date,
            'yyyy-MM-dd'
          )
        } catch (e) {
          console.error('Error parsing actual_delivery_date:', e)
        }
      }

      // Mettre à jour les autres champs
      if (formData.title) annonce.title = formData.title
      if (formData.description) annonce.description = formData.description
      if (formData.price !== undefined) annonce.price = formData.price
      if (formData.state) annonce.state = formData.state
      if (formData.destination_address) annonce.destinationAddress = formData.destination_address
      if (formData.starting_address) annonce.startingAddress = formData.starting_address
      if (formData.priority !== undefined) {
        // Convertir la chaîne en booléen
        annonce.priority = formData.priority === 'true' || formData.priority === true
      }
      if (formData.storage_box_id) annonce.storageBoxId = formData.storage_box_id

      // Gérer l'upload d'image si présent
      const image = request.file('image')
      if (image) {
        const fileName = `${Date.now()}_${image.clientName}`
        try {
          await image.move(app.tmpPath('uploads/annonces'), {
            name: fileName,
          })

          if (image.state === 'moved') {
            annonce.imagePath = `uploads/annonces/${fileName}`
          }
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }

      await annonce.save()
      await annonce.load('colis')
      await annonce.load('services')
      return response.ok({ annonce: annonce.serialize() })
    } catch (error) {
      console.error('Error updating annonce:', error)
      return response.status(500).send({
        error: error.message,
        detail: error.detail || 'Unknown error occurred',
      })
    }
  }
}

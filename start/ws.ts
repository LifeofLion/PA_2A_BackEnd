import app from '@adonisjs/core/services/app'
import Ws from '#services/ws'
import { userSockets } from '#controllers/messages_controller'
import Message from '#models/message'
import Livraison from '#models/livraison'
import Livreur from '#models/livreur'
import Utilisateurs from '#models/utilisateurs'

// Fonction d'extraction d'ID valide
const extractValidUserId = (userId: any): number | null => {
  if (userId === undefined || userId === null || userId === '') return null
  if (typeof userId === 'number')
    return Number.isNaN(userId) || !Number.isFinite(userId) || userId <= 0 ? null : userId
  if (typeof userId === 'string') {
    const cleanId = userId.trim()
    if (!cleanId) return null
    if (/^\d+$/.test(cleanId)) {
      const numericId = Number.parseInt(cleanId, 10)
      return numericId <= 0 ? null : numericId
    }
  }
  try {
    const id = Number(userId)
    if (!Number.isNaN(id) && Number.isFinite(id) && id > 0) return id
  } catch {}
  return null
}

app.ready(() => {
  Ws.boot()
  const io = Ws.io

  if (!io) {
    console.error('Failed to initialize Socket.io server')
    return
  }

  io.use(async (socket, next) => {
    // Vérifier plusieurs sources d'ID utilisateur
    let userId: number | null = null

    // Headers HTTP
    if (socket.request.headers['user_id']) {
      userId = extractValidUserId(socket.request.headers['user_id'])
    }

    // Auth
    if (!userId && socket.handshake.auth?.userId) {
      userId = extractValidUserId(socket.handshake.auth.userId)
    }

    // Query params
    if (!userId && socket.handshake.query?.user_id) {
      userId = extractValidUserId(socket.handshake.query.user_id)
    }

    console.log('User ID check:', {
      rawId: socket.request.headers['user_id'],
      extractedId: userId,
      authId: socket.handshake.auth?.userId,
      queryId: socket.handshake.query?.user_id,
    })

    if (!userId) {
      return next(new Error('User ID not provided or invalid'))
    }

    socket.data.userId = userId
    userSockets.set(userId, socket)
    console.log(`User ${userId} validated and registered`)
    return next()
  })

  io.on('connection', (socket) => {
    console.log('User', socket.data.userId, 'connected')

    // Écouter les nouveaux messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, tempId } = data
        const validReceiverId = extractValidUserId(receiverId)

        if (!validReceiverId) {
          console.error(`Invalid receiver ID: ${receiverId}`)
          socket.emit('error', { message: 'Invalid receiver ID' })
          return
        }

        // Créer le message dans la base de données
        try {
          const message = await Message.create({
            senderId: socket.data.userId,
            receiverId: validReceiverId,
            content,
            isRead: false,
          })

          // Charger les relations
          const messageWithRelations = await Message.query()
            .where('id', message.id)
            .preload('sender' as any)
            .preload('receiver' as any)
            .firstOrFail()

          // Préparer un message formaté
          const formattedMessage = {
            id: messageWithRelations.id,
            senderId: messageWithRelations.senderId,
            receiverId: messageWithRelations.receiverId,
            content: messageWithRelations.content,
            isRead: messageWithRelations.isRead,
            createdAt: messageWithRelations.createdAt.toISO(),
            timestamp: messageWithRelations.createdAt.toISO(),
            tempId: tempId, // Inclure l'ID temporaire
            sender: messageWithRelations.sender
              ? {
                  id: messageWithRelations.sender.id,
                  first_name: messageWithRelations.sender.first_name || 'Utilisateur',
                  last_name: messageWithRelations.sender.last_name || '',
                }
              : null,
            receiver: messageWithRelations.receiver
              ? {
                  id: messageWithRelations.receiver.id,
                  first_name: messageWithRelations.receiver.first_name || 'Utilisateur',
                  last_name: messageWithRelations.receiver.last_name || '',
                }
              : null,
          }

          // Notifier le destinataire s'il est connecté
          const receiverSocket = userSockets.get(validReceiverId)
          if (receiverSocket) {
            console.log(`Émission WebSocket 'new_message' vers utilisateur ${validReceiverId}`)
            receiverSocket.emit('new_message', formattedMessage)
          }

          // Confirmer à l'expéditeur que le message a été envoyé
          socket.emit('message_sent', formattedMessage)

          console.log(`Message from ${socket.data.userId} to ${validReceiverId} saved: ${content}`)
        } catch (dbError) {
          console.error('Error saving message to database:', dbError)
          socket.emit('error', {
            message: 'Failed to save message',
            originalError: dbError.message,
          })
        }
      } catch (error) {
        console.error('Error handling send_message:', error)
        socket.emit('error', { message: 'Failed to process message' })
      }
    })

    // Écouteur pour l'authentification explicite
    socket.on('authenticate', (data) => {
      const authUserId = extractValidUserId(data.userId)
      if (authUserId && authUserId === socket.data.userId) {
        console.log(`User ${socket.data.userId} authenticated successfully`)
      } else {
        console.warn(
          `Authentication attempt with invalid userId: ${data.userId} for socket ${socket.id}`
        )
      }
    })

    // Écouteur pour l'enregistrement explicite
    socket.on('register_user', (data) => {
      const registeredUserId = extractValidUserId(data.userId)
      if (registeredUserId && registeredUserId === socket.data.userId) {
        console.log(`User ${socket.data.userId} registered successfully`)
      } else {
        console.warn(
          `Registration attempt with invalid userId: ${data.userId} for socket ${socket.id}`
        )
      }
    })

    // Statut de lecture des messages
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data
        const validMessageId = extractValidUserId(messageId)

        if (!validMessageId) {
          console.error(`Invalid message ID: ${messageId}`)
          return
        }

        // Mettre à jour le statut du message dans la base de données
        console.log(`Message ${validMessageId} marked as read by ${socket.data.userId}`)

        // Notifier l'expéditeur que son message a été lu (facultatif)
        // Vous auriez besoin de récupérer le senderId à partir de messageId
      } catch (error) {
        console.error('Error handling mark_read:', error)
      }
    })

    // Notification de frappe
    socket.on('typing', (data) => {
      const receiverId = extractValidUserId(data.receiverId)
      if (!receiverId) {
        console.error(`Invalid receiver ID for typing notification: ${data.receiverId}`)
        return
      }

      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        receiverSocket.emit('user_typing', {
          userId: socket.data.userId,
        })
      }
    })

    socket.on('disconnect', () => {
      userSockets.delete(socket.data.userId)
      console.log('User', socket.data.userId, 'disconnected')

      // Informer les autres utilisateurs du changement de statut
      io.emit('user_status_change', {
        userId: socket.data.userId,
        status: 'offline',
      })
    })

    // ==================== ÉVÉNEMENTS LIVRAISON ====================

    // Accepter une livraison (pour les livreurs)
    socket.on('accept_delivery', async (data) => {
      try {
        const { livraisonId } = data
        const livreurId = socket.data.userId

        // Vérifier que l'utilisateur est bien un livreur
        const livreur = await Livreur.find(livreurId)
        if (!livreur) {
          socket.emit('error', { message: "Vous n'êtes pas un livreur" })
          return
        }

        // Vérifier et accepter la livraison
        const livraison = await Livraison.find(livraisonId)
        if (!livraison) {
          socket.emit('error', { message: 'Livraison introuvable' })
          return
        }

        if (livraison.livreurId) {
          socket.emit('error', { message: 'Cette livraison est déjà assignée' })
          return
        }

        // Assigner la livraison
        livraison.livreurId = livreurId
        livraison.status = 'in_progress'
        await livraison.save()

        // Charger les relations
        await livraison.load('colis', (query) => {
          query.preload('annonce', (annonceQuery) => {
            annonceQuery.preload('utilisateur' as any)
          })
        })

        // Notifier tous les livreurs que cette livraison n'est plus disponible
        io.emit('delivery_taken', {
          livraisonId: livraison.id,
          livreurId: livreurId,
        })

        // Notifier le client que sa livraison a été acceptée
        if (livraison.colis.length > 0 && livraison.colis[0].annonce) {
          const clientId = livraison.colis[0].annonce.utilisateurId
          const clientSocket = userSockets.get(clientId)
          if (clientSocket) {
            clientSocket.emit('delivery_accepted', {
              livraison: livraison.serialize(),
              livreur: livreur.serialize(),
            })
          }
        }

        // Confirmer au livreur
        socket.emit('delivery_accepted_success', {
          livraison: livraison.serialize(),
        })
      } catch (error) {
        console.error('Error accepting delivery:', error)
        socket.emit('error', { message: "Erreur lors de l'acceptation de la livraison" })
      }
    })

    // Mettre à jour le statut de livraison
    socket.on('update_delivery_status', async (data) => {
      try {
        const { livraisonId, status, remarks } = data
        const livreurId = socket.data.userId

        const livraison = await Livraison.find(livraisonId)
        if (!livraison || livraison.livreurId !== livreurId) {
          socket.emit('error', { message: 'Livraison non autorisée' })
          return
        }

        // Mettre à jour le statut
        livraison.status = status
        await livraison.save()

        // Charger les relations
        await livraison.load('colis', (query) => {
          query.preload('annonce', (annonceQuery) => {
            annonceQuery.preload('utilisateur' as any)
          })
        })

        // Notifier le client
        if (livraison.colis.length > 0 && livraison.colis[0].annonce) {
          const clientId = livraison.colis[0].annonce.utilisateurId
          const clientSocket = userSockets.get(clientId)
          if (clientSocket) {
            clientSocket.emit('delivery_status_updated', {
              livraison: livraison.serialize(),
              status: status,
              remarks: remarks,
            })
          }
        }

        // Confirmer au livreur
        socket.emit('delivery_status_updated_success', {
          livraison: livraison.serialize(),
        })
      } catch (error) {
        console.error('Error updating delivery status:', error)
        socket.emit('error', { message: 'Erreur lors de la mise à jour du statut' })
      }
    })

    // Mise à jour de la position du livreur
    socket.on('update_location', async (data) => {
      try {
        const { latitude, longitude, livraisonId, accuracy, speed, heading } = data
        const livreurId = socket.data.userId

        // Vérifier que c'est bien un livreur
        const livreur = await Livreur.find(livreurId)
        if (!livreur) {
          socket.emit('error', { message: "Vous n'êtes pas un livreur" })
          return
        }

        // Importer le modèle LivreurPosition
        const module = await import('#models/livreur_position')
        const LivreurPosition = module.default

        // Sauvegarder la position en base de données
        await LivreurPosition.create({
          livreurId: livreurId,
          livraisonId: livraisonId || null,
          latitude: latitude,
          longitude: longitude,
          accuracy: accuracy || null,
          speed: speed || null,
          heading: heading || null,
        })

        // Si une livraison spécifique est mentionnée
        if (livraisonId) {
          const livraison = await Livraison.find(livraisonId)
          if (livraison && livraison.livreurId === livreurId) {
            // Charger les relations
            await livraison.load('colis', (query) => {
              query.preload('annonce', (annonceQuery) => {
                annonceQuery.preload('utilisateur' as any)
              })
            })

            // Notifier le client de la position du livreur
            if (livraison.colis.length > 0 && livraison.colis[0].annonce) {
              const clientId = livraison.colis[0].annonce.utilisateurId
              const clientSocket = userSockets.get(clientId)
              if (clientSocket) {
                clientSocket.emit('livreur_location_update', {
                  livraisonId: livraisonId,
                  location: {
                    latitude: latitude,
                    longitude: longitude,
                    accuracy: accuracy,
                    speed: speed,
                    heading: heading,
                    timestamp: new Date().toISOString(),
                  },
                })
              }
            }
          }
        }

        // Émettre la position pour les admins/système de monitoring
        io.to('admins').emit('livreur_location', {
          livreurId: livreurId,
          location: {
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy,
            speed: speed,
            heading: heading,
            timestamp: new Date().toISOString(),
          },
        })

        // Confirmer la sauvegarde au livreur
        socket.emit('location_updated', {
          success: true,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error updating location:', error)
        socket.emit('error', { message: 'Erreur lors de la mise à jour de la position' })
      }
    })

    // Notification de nouvelle livraison disponible (émis depuis le backend lors de la création)
    socket.on('new_delivery_available', async (data) => {
      // Cette fonction sera appelée côté serveur lors de la création d'une nouvelle livraison
      // Pour notifier tous les livreurs disponibles
      const availableLivreurs = await Livreur.query()
        .where('availability_status', 'available')
        .preload('user' as any)

      availableLivreurs.forEach((livreur) => {
        const livreurSocket = userSockets.get(livreur.id)
        if (livreurSocket) {
          livreurSocket.emit('new_delivery_notification', data)
        }
      })
    })

    // Joindre la room des admins si l'utilisateur est admin
    socket.on('join_admin_room', async () => {
      const user = await Utilisateurs.find(socket.data.userId)
      if (user) {
        await user.load('admin')
        if (user.admin) {
          socket.join('admins')
          console.log(`Admin ${socket.data.userId} joined admin room`)
        }
      }
    })
  })

  // Écouter les événements du système
  console.log('WebSocket server initialized successfully')
})

import app from '@adonisjs/core/services/app'
import Ws from '#services/ws'
import { userSockets } from '#controllers/messages_controller'

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
        const { receiverId, content } = data
        const validReceiverId = extractValidUserId(receiverId)

        if (!validReceiverId) {
          console.error(`Invalid receiver ID: ${receiverId}`)
          socket.emit('error', { message: 'Invalid receiver ID' })
          return
        }

        // Notifier le destinataire s'il est connecté
        const receiverSocket = userSockets.get(validReceiverId)
        if (receiverSocket) {
          receiverSocket.emit('new_message', {
            senderId: socket.data.userId,
            content,
            timestamp: new Date().toISOString(),
          })
        }

        // Vous pourriez vouloir persister le message dans la base de données ici
        console.log(`Message from ${socket.data.userId} to ${validReceiverId}: ${content}`)
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
  })

  // Écouter les événements du système
  console.log('WebSocket server initialized successfully')
})

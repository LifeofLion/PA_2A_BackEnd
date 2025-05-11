import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'

/**
 * Fonction utilitaire pour extraire un ID utilisateur valide
 */
const extractValidUserId = (userId: any): number | null => {
  if (userId === undefined || userId === null || userId === '') {
    return null
  }

  // Si c'est un nombre, vérifier qu'il est valide
  if (typeof userId === 'number') {
    if (Number.isNaN(userId) || !Number.isFinite(userId) || userId <= 0) {
      return null
    }
    return userId
  }

  // Si c'est une chaîne, essayer de la convertir
  if (typeof userId === 'string') {
    const cleanId = userId.trim()
    if (!cleanId) {
      return null
    }

    if (/^\d+$/.test(cleanId)) {
      const numericId = Number.parseInt(cleanId, 10)
      if (numericId <= 0) {
        return null
      }
      return numericId
    }
    return null
  }

  // Dernier recours: essayer une conversion directe
  try {
    const id = Number(userId)
    if (!isNaN(id) && isFinite(id) && id > 0) {
      return id
    }
  } catch (error) {
    // Ignorer l'erreur et retourner null
  }

  return null
}

class Ws {
  public io: Server | undefined
  private booted = false

  public boot() {
    // Éviter les appels multiples à la méthode boot
    if (this.booted) {
      return
    }

    this.booted = true
    this.io = new Server(server.getNodeServer(), {
      cors: {
        origin: '*',
      },
    })
  }

  // Envoyer un message à tous les clients connectés
  public broadcast(event: string, data: any) {
    if (!this.io) {
      console.warn('WebSocket: Tentative de broadcast sans io initialisé')
      return
    }

    console.log(`Broadcasting event ${event} to all clients`)
    this.io.emit(event, data)
  }

  // Envoyer un message à un utilisateur spécifique via sa socket
  public sendToSocket(socket: any, event: string, data: any) {
    if (!socket) {
      console.error("WebSocket: Socket non définie pour l'envoi")
      return
    }

    console.log(`Sending event ${event} to socket ${socket.id}`)
    socket.emit(event, data)
  }

  // Envoyer un message à un utilisateur spécifique via son ID
  public sendToUser(userId: number, event: string, data: any, userSockets: Map<number, any>) {
    if (!this.io) {
      console.warn("WebSocket: Tentative d'envoi à un utilisateur sans io initialisé")
      return
    }

    const validUserId = extractValidUserId(userId)
    if (!validUserId) {
      console.error(`WebSocket: sendToUser avec ID invalide: ${userId}`)
      return
    }

    console.log(`Sending event ${event} to user ${validUserId}`)

    const socket = userSockets.get(validUserId)
    if (socket) {
      socket.emit(event, data)
    } else {
      console.warn(`User ${validUserId} not connected, message not sent`)
    }
  }
}

export default new Ws()

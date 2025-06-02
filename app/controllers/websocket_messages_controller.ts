import Ws from '#services/ws'
import { userSockets } from '#controllers/messages_controller'

export default class WebSocketMessagesController {
  /**
   * Envoie un message via WebSocket et sauvegarde dans la BDD
   */
  public async sendMessage(senderId: number, receiverId: number, content: string) {
    try {
      // Ici, vous pourriez appeler la logique existante pour persister le message
      // par exemple: await MessagesService.createMessage(senderId, receiverId, content)

      // Ensuite, envoyer une notification en temps réel
      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        receiverSocket.emit('new_message', {
          senderId,
          content,
          timestamp: new Date().toISOString(),
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error in sendMessage:', error)
      return { success: false, error: 'Failed to send message' }
    }
  }

  /**
   * Marque un message comme lu et notifie l'expéditeur
   */
  public async markMessageAsRead(messageId: number, userId: number) {
    try {
      // Mettre à jour le statut de lecture dans la BDD
      // await MessagesService.markAsRead(messageId, userId)

      // Récupérer l'ID de l'expéditeur (à adapter selon votre modèle de données)
      const senderId = 0 // À remplacer par la véritable récupération

      // Notifier l'expéditeur que son message a été lu
      const senderSocket = userSockets.get(senderId)
      if (senderSocket) {
        senderSocket.emit('message_read', { messageId })
      }

      return { success: true }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error)
      return { success: false, error: 'Failed to mark message as read' }
    }
  }

  /**
   * Notifie qu'un utilisateur est en train d'écrire
   */
  public notifyTyping(senderId: number, receiverId: number) {
    try {
      const receiverSocket = userSockets.get(receiverId)
      if (receiverSocket) {
        receiverSocket.emit('user_typing', { userId: senderId })
      }
      return { success: true }
    } catch (error) {
      console.error('Error in notifyTyping:', error)
      return { success: false, error: 'Failed to notify typing' }
    }
  }

  /**
   * Diffuse le statut de connexion d'un utilisateur
   */
  public broadcastUserStatus(userId: number, status: 'online' | 'offline' | 'away') {
    try {
      Ws.broadcast('user_status_change', { userId, status })
      return { success: true }
    } catch (error) {
      console.error('Error in broadcastUserStatus:', error)
      return { success: false, error: 'Failed to broadcast user status' }
    }
  }
}

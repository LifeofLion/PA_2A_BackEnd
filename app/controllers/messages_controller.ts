import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import Utilisateurs from '#models/utilisateurs'
import { messageValidator } from '#validators/message'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'

export const userSockets = new Map<number, import('socket.io').Socket>()

export default class MessagesController {
  async send({ request, response }: HttpContext) {
    const payload = await request.validateUsing(messageValidator)
    const { senderId, receiverId, content, tempId } = payload

    const message = await Message.create({
      senderId,
      receiverId,
      content,
      isRead: false,
    })
    await message.load('sender' as unknown as ExtractModelRelations<Message>)
    await message.load('receiver' as unknown as ExtractModelRelations<Message>)

    // Créer un objet message complet et formaté pour WebSocket
    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt.toISO(),
      timestamp: message.createdAt.toISO(),
      tempId: tempId,
      sender: message.sender
        ? {
            id: message.sender.id,
            first_name: message.sender.first_name || 'Utilisateur',
            last_name: message.sender.last_name || '',
            // Autres champs nécessaires
          }
        : null,
      receiver: message.receiver
        ? {
            id: message.receiver.id,
            first_name: message.receiver.first_name || 'Utilisateur',
            last_name: message.receiver.last_name || '',
            // Autres champs nécessaires
          }
        : null,
    }

    // emit via websocket if recipient is online
    const receiverSocket = userSockets.get(receiverId)
    if (receiverSocket) {
      console.log(`Émission WebSocket 'new_message' vers utilisateur ${receiverId}`)
      receiverSocket.emit('new_message', formattedMessage)
    } else {
      console.log(`Utilisateur ${receiverId} non connecté, message non envoyé via WebSocket`)
    }

    // Notifier aussi l'expéditeur pour mettre à jour son interface
    const senderSocket = userSockets.get(senderId)
    if (senderSocket && senderSocket !== receiverSocket) {
      console.log(`Émission WebSocket 'message_sent' vers expéditeur ${senderId}`)
      senderSocket.emit('message_sent', formattedMessage)
    }

    return response.created({
      message: {
        ...message.serialize(),
        tempId: tempId,
        timestamp: message.createdAt.toISO(),
      },
    })
  }

  async inbox({ response, auth }: HttpContext) {
    const userId = auth.user!.id
    const messages = await Message.query()
      .where((query) => query.where('sender_id', userId).orWhere('receiver_id', userId))
      .preload('sender' as unknown as ExtractModelRelations<Message>)
      .preload('receiver' as unknown as ExtractModelRelations<Message>)
      .orderBy('created_at', 'desc')

    return response.ok({ messages: messages.map((m) => m.serialize()) })
  }

  async conversations({ response, auth }: HttpContext) {
    const userId = auth.user!.id

    const conversations = await Message.query()
      .select('sender_id', 'receiver_id')
      .where('sender_id', userId)
      .orWhere('receiver_id', userId)
      .distinct('sender_id', 'receiver_id')

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.senderId === userId ? conv.receiverId : conv.senderId

        const otherUser = await Utilisateurs.findOrFail(otherId)

        const latestMessage = await Message.query()
          .where((query) => {
            query.where('sender_id', userId).andWhere('receiver_id', otherId)
            query.orWhere('sender_id', otherId).andWhere('receiver_id', userId)
          })
          .orderBy('created_at', 'desc')
          .first()

        const unreadCount = await Message.query()
          .where('sender_id', otherId)
          .andWhere('receiver_id', userId)
          .andWhere('is_read', false)
          .count('* as total')

        return {
          id: `conv_${userId}_${otherId}`,
          recipientId: otherId,
          recipientName:
            `${otherUser.first_name || 'Utilisateur'} ${otherUser.last_name || ''}`.trim(),
          lastMessage: latestMessage?.content || '',
          lastMessageTime: latestMessage?.createdAt.toISO() || new Date().toISOString(),
          unreadCount: Number(unreadCount[0].$extras.total || 0),
          status: userSockets.has(otherId) ? 'online' : 'offline',
        }
      })
    )

    return response.ok({ conversations: result })
  }

  async markRead({ response, request }: HttpContext) {
    const message = await Message.findOrFail(request.param('id'))
    message.isRead = true
    await message.save()
    return response.ok({ message: message.serialize() })
  }

  async getAvailableUsers({ response, auth }: HttpContext) {
    const currentUserId = auth.user!.id

    // Récupérer tous les utilisateurs sauf l'utilisateur courant
    const users = await Utilisateurs.query()
      .whereNot('id', currentUserId)
      .select(['id', 'first_name', 'last_name'])

    // Formater les utilisateurs pour l'interface
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: `${user.first_name || 'Utilisateur'} ${user.last_name || ''}`.trim(),
    }))

    return response.ok({ users: formattedUsers })
  }
}

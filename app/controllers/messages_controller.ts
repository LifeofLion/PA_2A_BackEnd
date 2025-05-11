import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import Utilisateurs from '#models/utilisateurs'
import { messageValidator } from '#validators/message'
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'

export const userSockets = new Map<number, import('socket.io').Socket>()

export default class MessagesController {
  async send({ request, response }: HttpContext) {
    const { senderId, receiver_id, content } = await request.validateUsing(messageValidator)

    const message = await Message.create({
      senderId,
      receiverId: receiver_id,
      content,
      isRead: false,
    })
    await message.load('sender' as unknown as ExtractModelRelations<Message>)
    await message.load('receiver' as unknown as ExtractModelRelations<Message>)

    // emit via websocket if recipient is online
    const sock = userSockets.get(receiver_id)
    if (sock) {
      sock.emit('new_message', message.serialize())
    }

    return response.created({ message: message.serialize() })
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
          recipientName: `${otherUser.first_name} ${otherUser.last_name}`,
          lastMessage: latestMessage?.content || '',
          lastMessageTime: latestMessage?.createdAt.toISO() || new Date().toISOString(),
          unreadCount: Number(unreadCount[0].$extras.total || 0),
          status: userSockets.has(otherId) ? 'online' : 'offline'
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
}

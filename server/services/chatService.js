/**
 * Real-Time Chat & Communication Service for FoodLink
 * Manages chat conversations, messages, unread counts, and socket events.
 */

import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../utils/socketService.js';

/**
 * Gets or creates a 1-on-1 chat conversation between two users.
 */
export const getOrCreateChat = async (currentUserId, targetUserId, donationId = null) => {
  let chat = await Chat.findOne({
    participants: { $all: [currentUserId, targetUserId] },
    ...(donationId ? { donation: donationId } : {}),
  })
    .populate('participants', 'name organizationName role email phone avatar')
    .populate('lastMessage')
    .populate('donation', 'title status');

  if (!chat) {
    chat = new Chat({
      participants: [currentUserId, targetUserId],
      donation: donationId,
      unreadCounts: {
        [currentUserId.toString()]: 0,
        [targetUserId.toString()]: 0,
      },
    });
    await chat.save();
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name organizationName role email phone avatar')
      .populate('donation', 'title status');
  }

  return chat;
};

/**
 * Sends a message in a chat and emits socket event.
 */
export const sendMessage = async (senderId, chatId, content, mediaUrl = null, messageType = 'text') => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error('Chat conversation not found');

  const message = new Message({
    chat: chatId,
    sender: senderId,
    content: content || '',
    mediaUrl,
    messageType,
    readBy: [senderId],
  });
  await message.save();

  // Update chat lastMessage and unread counts for recipients
  chat.lastMessage = message._id;

  chat.participants.forEach((pId) => {
    const pStr = pId.toString();
    if (pStr !== senderId.toString()) {
      const currentUnread = chat.unreadCounts.get(pStr) || 0;
      chat.unreadCounts.set(pStr, currentUnread + 1);
    }
  });

  await chat.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name organizationName role email avatar')
    .lean();

  // Emit socket event to chat room & recipient user rooms
  try {
    const io = getIO();
    io.to(`chat:${chatId}`).emit('chat:message', populatedMessage);

    chat.participants.forEach((pId) => {
      const pStr = pId.toString();
      if (pStr !== senderId.toString()) {
        io.to(`user:${pStr}`).emit('chat:new_message', {
          chatId,
          message: populatedMessage,
        });
      }
    });
  } catch (err) {
    console.error('Socket Broadcast Error in Chat:', err.message);
  }

  return populatedMessage;
};

/**
 * Gets all user conversations.
 */
export const getUserChats = async (userId) => {
  const chats = await Chat.find({ participants: userId })
    .populate('participants', 'name organizationName role email phone avatar')
    .populate('lastMessage')
    .populate('donation', 'title status')
    .sort({ updatedAt: -1 })
    .lean();

  return chats.map((chat) => {
    const recipient = chat.participants.find((p) => p._id.toString() !== userId.toString()) || chat.participants[0];
    const unreadCount = chat.unreadCounts?.[userId.toString()] || 0;

    return {
      ...chat,
      recipient,
      unreadCount,
    };
  });
};

/**
 * Fetches messages in a chat and resets unread count for current user.
 */
export const getChatMessages = async (chatId, userId) => {
  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'name organizationName role email avatar')
    .sort({ createdAt: 1 })
    .lean();

  // Reset unread count for userId
  const chat = await Chat.findById(chatId);
  if (chat && chat.unreadCounts) {
    chat.unreadCounts.set(userId.toString(), 0);
    await chat.save();
  }

  return messages;
};

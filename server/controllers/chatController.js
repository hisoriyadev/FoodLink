/**
 * Real-Time Chat Controller for FoodLink
 * Exposes endpoints for listing user conversations, creating/retrieving chat rooms, and sending messages.
 */

import { getOrCreateChat, sendMessage, getUserChats, getChatMessages } from '../services/chatService.js';

// @desc    Get all active chat conversations for current user
// @route   GET /api/chat
// @access  Private
export const getMyChats = async (req, res) => {
  try {
    const chats = await getUserChats(req.user._id);
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
};

// @desc    Get or create a conversation with a specific target user
// @route   POST /api/chat/start
// @access  Private
export const startChat = async (req, res) => {
  try {
    const targetUserId = req.body.targetUserId || req.body.recipientId;
    const { donationId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId or recipientId is required' });

    const chat = await getOrCreateChat(req.user._id, targetUserId, donationId);
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start chat conversation', error: error.message });
  }
};

// @desc    Get all messages for a specific chat room
// @route   GET /api/chat/:chatId/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await getChatMessages(chatId, req.user._id);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

// @desc    Post a new message in a chat
// @route   POST /api/chat/message
// @access  Private
export const postMessage = async (req, res) => {
  try {
    const { chatId, content, mediaUrl, messageType } = req.body;
    if (!chatId || (!content && !mediaUrl)) {
      return res.status(400).json({ message: 'chatId and content or mediaUrl required' });
    }

    const message = await sendMessage(req.user._id, chatId, content, mediaUrl, messageType || 'text');
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

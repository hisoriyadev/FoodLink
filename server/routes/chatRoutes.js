import express from 'express';
import { getMyChats, startChat, getMessages, postMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyChats);
router.post('/start', protect, startChat);
router.get('/:chatId/messages', protect, getMessages);
router.post('/message', protect, postMessage);

export default router;

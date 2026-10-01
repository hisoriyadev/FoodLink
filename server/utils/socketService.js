import { Server } from 'socket.io';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { corsOptions } from '../config/cors.js';

let io = null;
const connectedUsers = new Map(); // userId -> socketId

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New Socket connection: ${socket.id}`);

    // Join user specific room and role room on auth
    socket.on('join', (data) => {
      const { userId, role } = data || {};
      if (userId) {
        socket.userId = userId;
        socket.userRole = role;
        connectedUsers.set(userId.toString(), socket.id);

        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined room user:${userId}`);

        if (role) {
          socket.join(`role:${role}`);
          console.log(`🏷️ User ${userId} joined role room role:${role}`);
        }
      }
    });

    // Join specific donation tracking room
    socket.on('join:donation', (donationId) => {
      if (donationId) {
        socket.join(`donation:${donationId}`);
        console.log(`📦 Socket ${socket.id} joined room donation:${donationId}`);
      }
    });

    // Leave specific donation tracking room
    socket.on('leave:donation', (donationId) => {
      if (donationId) {
        socket.leave(`donation:${donationId}`);
      }
    });

    // Real-Time Chat Room Listeners
    socket.on('join:chat', (chatId) => {
      if (chatId) {
        socket.join(`chat:${chatId}`);
        console.log(`💬 Socket ${socket.id} joined chat room chat:${chatId}`);
      }
    });

    socket.on('leave:chat', (chatId) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });

    socket.on('typing:start', ({ chatId, userName }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userName, userId: socket.userId });
      }
    });

    socket.on('typing:stop', ({ chatId }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId: socket.userId });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId.toString());
        console.log(`❌ User ${socket.userId} disconnected socket ${socket.id}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};

// Core Helper to create DB Notification AND Emit Real-time Socket Event
export const notifyUser = async (userId, { title, message, type, relatedUser, relatedDonation }) => {
  try {
    // 1. Save Notification to DB
    const notification = await Notification.create({
      recipient: userId,
      title,
      message,
      type,
      relatedUser,
      relatedDonation,
    });

    const populated = await notification.populate([
      { path: 'relatedUser', select: 'name email role avatar' },
      { path: 'relatedDonation', select: 'title category status quantity unit' },
    ]);

    // 2. Emit Socket Event to user room
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', populated);
    }

    return populated;
  } catch (error) {
    console.error('Error notifying user via socket/db:', error);
  }
};

// Notify all users of a specific role (e.g. 'admin' or 'ngo')
export const notifyRole = async (role, { title, message, type, relatedUser, relatedDonation }) => {
  try {
    const users = await User.find({ role }).select('_id');
    const notifications = await Promise.all(
      users.map(u => notifyUser(u._id, { title, message, type, relatedUser, relatedDonation }))
    );

    return notifications;
  } catch (error) {
    console.error(`Error notifying role ${role}:`, error);
  }
};

// Emit real-time donation status updates to listeners on that donation page
export const emitDonationStatusUpdate = (donationId, updatedDonation) => {
  if (io) {
    io.to(`donation:${donationId}`).emit('donation:updated', updatedDonation);
    io.emit('donations:refresh'); // Global refresh signal for dashboards
  }
};

export default {
  initSocket,
  getIO,
  notifyUser,
  notifyRole,
  emitDonationStatusUpdate,
};

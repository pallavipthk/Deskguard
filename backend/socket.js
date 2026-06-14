import { Server } from 'socket.io';

let io = null;
const userSockets = new Map(); // Map: userId -> Set of socketIds

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, replace with specific frontend URL
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'null' && userId !== 'undefined') {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`User connected to Socket.IO: UserID=${userId}, SocketID=${socket.id}`);
    } else {
      console.log(`Anonymous connection to Socket.IO: SocketID=${socket.id}`);
    }

    socket.on('disconnect', () => {
      if (userId && userSockets.has(userId)) {
        const socketsSet = userSockets.get(userId);
        socketsSet.delete(socket.id);
        if (socketsSet.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log(`Socket disconnected: SocketID=${socket.id}`);
    });
  });

  return io;
};

// Broadcaster to all connected clients for real-time map updates
export const broadcastDeskUpdate = (deskId, status, currentSessionId = null) => {
  if (io) {
    io.emit('desk_update', { deskId, status, currentSessionId });
    console.log(`[Socket] Broadcasted desk update: Desk ${deskId} is now ${status}`);
  }
};

// Send notification to a specific user
export const sendNotificationToUser = (userId, message, type = 'info') => {
  if (io && userId) {
    const stringId = String(userId);
    const sockets = userSockets.get(stringId);
    if (sockets) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit('notification', { message, type, timestamp: new Date() });
      });
      console.log(`[Socket] Sent private notification to User ${userId}: "${message}"`);
      return true;
    }
  }
  return false;
};

// Broadcast general system alert
export const broadcastAlert = (message) => {
  if (io) {
    io.emit('system_alert', { message, timestamp: new Date() });
    console.log(`[Socket] Broadcasted system alert: "${message}"`);
  }
};

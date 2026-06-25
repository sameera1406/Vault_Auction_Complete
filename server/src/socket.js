const jwt = require('jsonwebtoken');

// Keep track of socket rooms for presence calculations
const socketRoomsMap = new Map(); // socket.id -> Set of rooms

function getRoomPresence(io, roomName) {
  const room = io.sockets.adapter.rooms.get(roomName);
  if (!room) return { viewers: 0, bidders: 0 };

  let viewers = 0;
  let bidders = 0;

  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      viewers++;
      if (socket.user) {
        bidders++;
      }
    }
  }

  return { viewers, bidders };
}

function broadcastPresence(io, roomName) {
  const presence = getRoomPresence(io, roomName);
  io.to(roomName).emit('user:watching', {
    room: roomName,
    ...presence
  });
}

function setupSockets(io) {
  // Middleware to attach user profile if authenticated
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_luxury_vault_secret_key_2026');
        socket.user = decoded;
      } catch (err) {
        console.log(`[Socket] Auth token validation failed for socket ${socket.id}`);
        // Allow unauthenticated connection as viewer
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user ? socket.user.email : 'Guest'})`);
    socketRoomsMap.set(socket.id, new Set());

    // Join room
    socket.on('auction:join', ({ auctionId }) => {
      const roomName = `auction:${auctionId}`;
      socket.join(roomName);
      socketRoomsMap.get(socket.id).add(roomName);
      
      console.log(`[Socket] Socket ${socket.id} joined room ${roomName}`);
      broadcastPresence(io, roomName);
    });

    // Leave room
    socket.on('auction:leave', ({ auctionId }) => {
      const roomName = `auction:${auctionId}`;
      socket.leave(roomName);
      socketRoomsMap.get(socket.id).delete(roomName);

      console.log(`[Socket] Socket ${socket.id} left room ${roomName}`);
      broadcastPresence(io, roomName);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const joinedRooms = socketRoomsMap.get(socket.id);
      if (joinedRooms) {
        for (const roomName of joinedRooms) {
          broadcastPresence(io, roomName);
        }
      }
      socketRoomsMap.delete(socket.id);
    });
  });
}

module.exports = {
  setupSockets
};

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const bidRoutes = require('./routes/bidRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

const { setupSockets } = require('./socket');
const { startScheduler } = require('./services/scheduler');

const app = express();
const server = http.createServer(app);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Vault Auction Server is healthy'
  });
});

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in controllers
app.set('io', io);

// Configure websocket events
setupSockets(io);

// Start Auction Scheduler
const stopScheduler = startScheduler(io);

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('===============================================');
  console.log(`🏦 Vault Auction Server is running on port ${PORT}`);
  console.log('⚡ WebSocket is ready and synced');
  console.log('===============================================');
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('[Server] Shutting down...');
  stopScheduler();
  process.exit(0);
});
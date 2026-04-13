const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const nowPlayingRouter = require('./routes/nowPlaying');
const { initStreamHandler } = require('./socket/streamHandler');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

// REST routes
app.use('/api', nowPlayingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.frontendOrigin,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1MB max for audio chunks
});

// Initialize socket handlers
initStreamHandler(io);

// Start
server.listen(config.port, () => {
  console.log(`🎵 Radio101 backend running on port ${config.port}`);
});

module.exports = { app, server, io };

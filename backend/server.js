import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

// Import local services
import { initDb } from './database.js';
import { initSocket } from './socket.js';
import { startCron } from './cron.js';

// Import routes
import authRouter from './routes/auth.js';
import desksRouter from './routes/desks.js';
import sessionsRouter from './routes/sessions.js';
import notificationsRouter from './routes/notifications.js';
import analyticsRouter from './routes/analytics.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with specific frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API Routes
app.use('/api/auth', authRouter);
app.use('/api/desks', desksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Initialize database, sockets, and cron, then start HTTP server
const bootstrap = async () => {
  try {
    // 1. Initialize Database & Seed data
    await initDb();

    // 2. Attach Socket.IO server
    initSocket(server);

    // 3. Start background timeout checking cron
    startCron();

    // 4. Start listening on the port
    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`DeskGuard API Server is running on port ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start DeskGuard Server:', error);
    process.exit(1);
  }
};

bootstrap();

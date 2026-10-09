import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB, dbService } from './db.js';
import authRoutes from './routes/auth.js';
import messagesRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Deepika Chat App Backend',
    database: dbService.isMongo() ? 'MongoDB' : 'Local Persistent Store',
    timestamp: new Date(),
  });
});

// Serve frontend in production if built
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Socket.io Realtime Management
// Map of userId -> Set of socketIds
const userSockets = new Map();

io.on('connection', (socket) => {
  let authenticatedUserId = null;

  // When a user identifies themselves
  socket.on('user_connected', async (userId) => {
    if (!userId) return;
    authenticatedUserId = String(userId);

    if (!userSockets.has(authenticatedUserId)) {
      userSockets.set(authenticatedUserId, new Set());
    }
    userSockets.get(authenticatedUserId).add(socket.id);

    // Update status in DB
    await dbService.updateUserStatus(authenticatedUserId, true, new Date());
    await dbService.markDelivered(authenticatedUserId);

    // Broadcast online status to all
    io.emit('user_status_change', {
      userId: authenticatedUserId,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    });

    console.log(`User connected: ${authenticatedUserId} (socket: ${socket.id})`);
  });

  // Sending message
  socket.on('send_message', async (data, ack) => {
    try {
      const { sender, receiver, text, fileUrl, fileName, fileType, fileSize, replyTo } = data;
      if (!sender || !receiver || (!text && !fileUrl)) {
        if (ack) ack({ error: 'Missing message content' });
        return;
      }

      const receiverIsOnline = userSockets.has(String(receiver)) && userSockets.get(String(receiver)).size > 0;
      const initialStatus = receiverIsOnline ? 'delivered' : 'sent';

      const savedMessage = await dbService.createMessage({
        sender,
        receiver,
        text: text || '',
        fileUrl: fileUrl || '',
        fileName: fileName || '',
        fileType: fileType || '',
        fileSize: fileSize || 0,
        replyTo: replyTo || null,
        status: initialStatus,
      });

      // Send to receiver sockets if online
      if (receiverIsOnline) {
        const receiverSockets = userSockets.get(String(receiver));
        receiverSockets.forEach((sId) => {
          io.to(sId).emit('receive_message', savedMessage);
        });
      }

      // Also confirm to sender's other sockets (if multi-device)
      if (userSockets.has(String(sender))) {
        userSockets.get(String(sender)).forEach((sId) => {
          if (sId !== socket.id) {
            io.to(sId).emit('message_sent_sync', savedMessage);
          }
        });
      }

      if (ack) ack({ success: true, message: savedMessage });
    } catch (err) {
      console.error('Socket send_message error:', err);
      if (ack) ack({ error: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing', ({ senderId, receiverId, isTyping }) => {
    if (userSockets.has(String(receiverId))) {
      userSockets.get(String(receiverId)).forEach((sId) => {
        io.to(sId).emit('user_typing', { senderId, isTyping });
      });
    }
  });

  // Read receipts (Message status: Read)
  socket.on('mark_as_read', async ({ senderId, receiverId }) => {
    // senderId sent the messages, receiverId read them
    await dbService.markRead(senderId, receiverId);

    // Notify sender that their messages have been read
    if (userSockets.has(String(senderId))) {
      userSockets.get(String(senderId)).forEach((sId) => {
        io.to(sId).emit('messages_marked_read', { byUserId: receiverId });
      });
    }
  });

  // Reaction on a message
  socket.on('message_react', async ({ messageId, emoji, userId, userName, otherUserId }) => {
    try {
      const reactions = await dbService.toggleReaction(messageId, userId, userName, emoji);
      const payload = { messageId, reactions };

      // Broadcast to both participants
      [String(userId), String(otherUserId)].forEach((uid) => {
        if (userSockets.has(uid)) {
          userSockets.get(uid).forEach((sId) => io.to(sId).emit('message_reacted', payload));
        }
      });
    } catch (e) {
      console.error('Socket message_react error:', e);
    }
  });

  // Delete message
  socket.on('delete_message', async ({ messageId, userId, otherUserId }) => {
    try {
      await dbService.deleteMessage(messageId);
      const payload = { messageId };

      [String(userId), String(otherUserId)].forEach((uid) => {
        if (userSockets.has(uid)) {
          userSockets.get(uid).forEach((sId) => io.to(sId).emit('message_deleted', payload));
        }
      });
    } catch (e) {
      console.error('Socket delete_message error:', e);
    }
  });

  // Clear entire conversation
  socket.on('clear_chat', async ({ userId, otherUserId }) => {
    try {
      await dbService.clearConversation(userId, otherUserId);
      const payload = { byUserId: userId, otherUserId };

      [String(userId), String(otherUserId)].forEach((uid) => {
        if (userSockets.has(uid)) {
          userSockets.get(uid).forEach((sId) => io.to(sId).emit('chat_cleared', payload));
        }
      });
    } catch (e) {
      console.error('Socket clear_chat error:', e);
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    if (authenticatedUserId && userSockets.has(authenticatedUserId)) {
      const sockets = userSockets.get(authenticatedUserId);
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        userSockets.delete(authenticatedUserId);
        const lastSeen = new Date();
        await dbService.updateUserStatus(authenticatedUserId, false, lastSeen);

        io.emit('user_status_change', {
          userId: authenticatedUserId,
          isOnline: false,
          lastSeen: lastSeen.toISOString(),
        });
        console.log(`User went offline: ${authenticatedUserId}`);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Deepika Chat Server running on http://localhost:${PORT}`);
});

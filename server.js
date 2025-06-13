/**
 * 🚀 Notion Spark Studio - WebSocket Server
 * Servidor de colaboração em tempo real
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const server = createServer(app);

// Configuração de CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://notion-spark-studio.vercel.app'] 
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://notion-spark-studio.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Armazenamento de estado em memória
const activeUsers = new Map();
const documentStates = new Map();
const userCursors = new Map();

// Middleware de autenticação WebSocket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      socket.userId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      socket.isAuthenticated = false;
      return next();
    }

    const decoded = jwt.decode(token);
    if (decoded && decoded.sub) {
      socket.userId = decoded.sub;
      socket.isAuthenticated = true;
      socket.userEmail = decoded.email;
    } else {
      socket.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      socket.isAuthenticated = false;
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    socket.userId = `error_${Date.now()}`;
    socket.isAuthenticated = false;
    next();
  }
});

// Eventos WebSocket
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.userId}`);
  
  activeUsers.set(socket.userId, {
    id: socket.userId,
    socketId: socket.id,
    email: socket.userEmail || 'anonymous',
    isAuthenticated: socket.isAuthenticated,
    connectedAt: new Date(),
    lastSeen: new Date()
  });

  socket.broadcast.emit('user:connected', {
    userId: socket.userId,
    isAuthenticated: socket.isAuthenticated,
    connectedAt: new Date()
  });

  // Jointar documento
  socket.on('document:join', (data) => {
    const { documentId, userInfo } = data;
    
    socket.join(documentId);
    socket.currentDocument = documentId;
    
    if (activeUsers.has(socket.userId)) {
      const user = activeUsers.get(socket.userId);
      activeUsers.set(socket.userId, {
        ...user,
        ...userInfo,
        currentDocument: documentId,
        lastSeen: new Date()
      });
    }

    socket.to(documentId).emit('user:joined-document', {
      userId: socket.userId,
      userInfo: activeUsers.get(socket.userId)
    });

    console.log(`📄 User ${socket.userId} joined document ${documentId}`);
  });

  // Atualizar cursor
  socket.on('cursor:update', (data) => {
    const { documentId, cursor } = data;
    const cursorKey = `${socket.userId}:${documentId}`;
    
    const cursorData = {
      userId: socket.userId,
      userInfo: activeUsers.get(socket.userId),
      cursor: cursor,
      timestamp: new Date()
    };
    
    userCursors.set(cursorKey, cursorData);
    socket.to(documentId).emit('cursor:updated', cursorData);
  });

  // Atualizar documento
  socket.on('document:update', async (data) => {
    const { documentId, operation, content, metadata } = data;
    
    try {
      if (!documentStates.has(documentId)) {
        documentStates.set(documentId, {
          content: '',
          lastModified: new Date(),
          version: 0
        });
      }
      
      const docState = documentStates.get(documentId);
      docState.content = content;
      docState.lastModified = new Date();
      docState.version += 1;
      docState.lastModifiedBy = socket.userId;

      socket.to(documentId).emit('document:updated', {
        documentId,
        operation,
        content,
        metadata: {
          ...metadata,
          userId: socket.userId,
          timestamp: new Date(),
          version: docState.version
        }
      });

      console.log(`📝 Document ${documentId} updated by ${socket.userId}`);
      
    } catch (error) {
      console.error('Error updating document:', error);
      socket.emit('error', {
        type: 'document_update_error',
        message: 'Falha ao atualizar documento'
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`👤 User disconnected: ${socket.userId} (${reason})`);
    
    activeUsers.delete(socket.userId);
    
    const cursorsToRemove = [];
    for (const [key, cursor] of userCursors.entries()) {
      if (cursor.userId === socket.userId) {
        cursorsToRemove.push(key);
      }
    }
    
    cursorsToRemove.forEach(key => {
      userCursors.delete(key);
    });

    socket.broadcast.emit('user:disconnected', {
      userId: socket.userId
    });
  });
});

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    activeUsers: activeUsers.size,
    documents: documentStates.size,
    cursors: userCursors.size
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WebSocket Server running on port ${PORT}`);
});

module.exports = app; 
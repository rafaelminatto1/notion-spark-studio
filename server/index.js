/**
 * 🚀 Notion Spark Studio - WebSocket Server
 * Servidor de colaboração em tempo real
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

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
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://notion-spark-studio.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://bvugljspidtqumysbegq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDE1MDUsImV4cCI6MjA0ODkxNzUwNX0.JvUJOQs8k01yjNwgZ9eCU6TGMRGPMxJDtLpKUJN8Drc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Armazenamento de estado em memória
const activeUsers = new Map();
const documentStates = new Map();
const userCursors = new Map();

// Middleware de autenticação WebSocket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('Socket connection without token');
      socket.userId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      socket.isAuthenticated = false;
      return next();
    }

    // Verificar token JWT (simplificado para desenvolvimento)
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
  console.log(`👤 User connected: ${socket.userId} (${socket.isAuthenticated ? 'authenticated' : 'anonymous'})`);
  
  // Registrar usuário ativo
  activeUsers.set(socket.userId, {
    id: socket.userId,
    socketId: socket.id,
    email: socket.userEmail || 'anonymous',
    isAuthenticated: socket.isAuthenticated,
    connectedAt: new Date(),
    lastSeen: new Date()
  });

  // Notificar outros usuários sobre nova conexão
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
    
    // Atualizar info do usuário
    if (activeUsers.has(socket.userId)) {
      const user = activeUsers.get(socket.userId);
      activeUsers.set(socket.userId, {
        ...user,
        ...userInfo,
        currentDocument: documentId,
        lastSeen: new Date()
      });
    }

    // Notificar outros usuários no documento
    socket.to(documentId).emit('user:joined-document', {
      userId: socket.userId,
      userInfo: activeUsers.get(socket.userId)
    });

    console.log(`📄 User ${socket.userId} joined document ${documentId}`);
  });

  // Sair do documento
  socket.on('document:leave', (data) => {
    const { documentId } = data;
    
    socket.leave(documentId);
    
    // Notificar outros usuários
    socket.to(documentId).emit('user:left-document', {
      userId: socket.userId
    });

    // Remover cursor
    const cursorKey = `${socket.userId}:${documentId}`;
    if (userCursors.has(cursorKey)) {
      userCursors.delete(cursorKey);
      socket.to(documentId).emit('cursor:removed', {
        userId: socket.userId
      });
    }

    console.log(`📄 User ${socket.userId} left document ${documentId}`);
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
    
    // Broadcast para outros usuários no documento
    socket.to(documentId).emit('cursor:updated', cursorData);
  });

  // Atualizar documento
  socket.on('document:update', async (data) => {
    const { documentId, operation, content, metadata } = data;
    
    try {
      // Atualizar estado local
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
      
      // Salvar no Supabase (opcional, para persistência)
      if (socket.isAuthenticated) {
        await supabase
          .from('documents')
          .upsert({
            id: documentId,
            content: content,
            updated_at: new Date().toISOString(),
            updated_by: socket.userId,
            version: docState.version
          });
      }

      // Broadcast para outros usuários
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

  // Colaboração em tempo real (operational transforms)
  socket.on('operation:apply', (data) => {
    const { documentId, operation } = data;
    
    // Broadcast operação para outros usuários
    socket.to(documentId).emit('operation:received', {
      operation,
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Heartbeat para manter conexão
  socket.on('ping', () => {
    if (activeUsers.has(socket.userId)) {
      const user = activeUsers.get(socket.userId);
      user.lastSeen = new Date();
    }
    socket.emit('pong');
  });

  // Desconexão
  socket.on('disconnect', (reason) => {
    console.log(`👤 User disconnected: ${socket.userId} (${reason})`);
    
    // Remover usuário ativo
    activeUsers.delete(socket.userId);
    
    // Remover cursors
    const cursorsToRemove = [];
    for (const [key, cursor] of userCursors.entries()) {
      if (cursor.userId === socket.userId) {
        cursorsToRemove.push(key);
      }
    }
    
    cursorsToRemove.forEach(key => {
      userCursors.delete(key);
    });

    // Notificar outros usuários
    socket.broadcast.emit('user:disconnected', {
      userId: socket.userId
    });

    if (socket.currentDocument) {
      socket.to(socket.currentDocument).emit('user:left-document', {
        userId: socket.userId
      });
    }
  });

  // Erro
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
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

app.get('/api/stats', (req, res) => {
  res.json({
    activeUsers: Array.from(activeUsers.values()).map(user => ({
      id: user.id,
      isAuthenticated: user.isAuthenticated,
      connectedAt: user.connectedAt,
      lastSeen: user.lastSeen
    })),
    totalDocuments: documentStates.size,
    totalCursors: userCursors.size
  });
});

// Rota para obter estado do documento
app.get('/api/document/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tentar pegar do cache local primeiro
    if (documentStates.has(id)) {
      return res.json({
        success: true,
        document: documentStates.get(id)
      });
    }

    // Buscar do Supabase se não estiver no cache
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      document: data || {
        content: '',
        version: 0,
        lastModified: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar documento'
    });
  }
});

// Cleanup de usuários inativos a cada 5 minutos
setInterval(() => {
  const now = new Date();
  const timeout = 5 * 60 * 1000; // 5 minutos

  for (const [userId, user] of activeUsers.entries()) {
    if (now - user.lastSeen > timeout) {
      console.log(`🧹 Cleaning up inactive user: ${userId}`);
      activeUsers.delete(userId);
      
      // Remover cursors do usuário inativo
      const cursorsToRemove = [];
      for (const [key, cursor] of userCursors.entries()) {
        if (cursor.userId === userId) {
          cursorsToRemove.push(key);
        }
      }
      
      cursorsToRemove.forEach(key => {
        userCursors.delete(key);
      });
    }
  }
}, 5 * 60 * 1000);

// Error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Notion Spark Studio WebSocket Server`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket ready for real-time collaboration`);
});

export default app; 
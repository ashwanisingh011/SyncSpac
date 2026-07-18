import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ProjectMember from '../models/ProjectMember.js';
import Task from '../models/Task.js';
import logger from './logger.js';
import { normalizeRoleCode, isSuperAdminRole } from '../utils/rbacMatrix.js';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: any;
    currentTaskId?: string;
  };
}

let io: Server | null = null;

// Track online users inside active memory: userId -> set of socketIds
const activeUsers = new Map<string, Set<string>>();

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  // JWT Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token is missing'));
      }

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      const user = await User.findById(decoded.id || decoded._id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      logger.warn('Socket connection authentication failed', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    logger.info(`Socket client connected: User ${user.email} (Socket: ${socket.id})`);

    // Add user to active users map
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId)?.add(socket.id);

    // Join personal user room (for direct notifications)
    socket.join(userId);

    // Broadcast user online status
    socket.on('join-org', (orgId: string) => {
      socket.join(orgId);
      socket.to(orgId).emit('user:online', { userId });
    });

    // Project room joining with membership validation
    socket.on('join-project', async (projectId: string) => {
      try {
        const normalized = normalizeRoleCode(user.role);
        if (!isSuperAdminRole(user.role) && normalized !== 'org_admin') {
          const isMember = await ProjectMember.findOne({
            project: projectId,
            user: userId,
          }).select('_id');

          if (!isMember) {
            socket.emit('error', { message: 'Unauthorized project room access' });
            return;
          }
        }
        socket.join(projectId);
        logger.debug(`Socket ${socket.id} joined project room: ${projectId}`);
      } catch (err) {
        logger.error('Error joining project room', err);
      }
    });

    // Handle task drag-and-drop movement
    socket.on('task:move', async (data: { taskId: string; projectId: string; status: string; order: number }) => {
      try {
        const { taskId, projectId, status, order } = data;
        
        // Broadcast the update to all other project members
        socket.to(projectId).emit('task:status_changed', { taskId, status, order });
      } catch (err) {
        logger.error('Error processing task:move socket event', err);
      }
    });

    // Handle typing indicators
    socket.on('task:typing', (data: { taskId: string; projectId: string; isTyping: boolean }) => {
      const { taskId, projectId, isTyping } = data;
      socket.to(projectId).emit('task:typing', { taskId, userId, name: user.name, isTyping });
    });

    // Track active task viewing (presence indicator)
    socket.on('task:view', (data: { taskId: string; projectId: string }) => {
      const { taskId, projectId } = data;
      
      // Leave previous task view
      if (socket.data.currentTaskId) {
        socket.to(projectId).emit('task:view_left', { taskId: socket.data.currentTaskId, userId });
      }

      socket.data.currentTaskId = taskId;
      socket.to(projectId).emit('task:view_joined', { taskId, userId, name: user.name, avatar: user.avatar });
    });

    socket.on('task:unview', (data: { taskId: string; projectId: string }) => {
      const { taskId, projectId } = data;
      if (socket.data.currentTaskId === taskId) {
        socket.data.currentTaskId = undefined;
      }
      socket.to(projectId).emit('task:view_left', { taskId, userId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: User ${user.email} (Socket: ${socket.id})`);
      
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          // Broadcast user offline to rooms
          socket.rooms.forEach((room) => {
            socket.to(room).emit('user:offline', { userId });
          });
        }
      }
    });
  });

  return io;
};

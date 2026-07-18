import 'dotenv/config';
import { createServer } from 'http';
import express, { Request, Response } from 'express';
import logger from './config/logger.js';

import cors from 'cors';
import helmet from 'helmet';
import { initSocket } from './config/socket.js';

import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import organizationRoutes from './routes/organization.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orgLifecycleRoutes from './routes/orgLifecycleRoutes.js';
import labelRoutes from './routes/labels.js';
import recurringTaskRoutes from './routes/recurringTasks.js';
import cookieParser from 'cookie-parser';
import sprintRoutes from './routes/sprintRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { initializeScheduler } from './utils/scheduler.js';
import billingRoutes from './routes/billingRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import './config/queue.js';


const app = express();

connectDB();
initializeScheduler();

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 5000 : 100000, // Dynamic limit based on environment
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(globalRateLimit);
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/org-lifecycle', orgLifecycleRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/recurring-tasks', recurringTaskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/plans', billingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);


app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

export default app;



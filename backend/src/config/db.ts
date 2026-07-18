import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

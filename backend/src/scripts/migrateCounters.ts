import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { migrateProjectCounters } from '../utils/migrateProjectCounters.js';

dotenv.config();

const run = async () => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error('Missing MONGODB_URI environment variable');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongodbUri);

    await migrateProjectCounters();

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

void run();

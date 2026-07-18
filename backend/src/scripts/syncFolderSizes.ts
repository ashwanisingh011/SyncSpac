import dotenv from 'dotenv';
import mongoose from 'mongoose';
import File from '../models/File.js';

dotenv.config();

const calculateFolderSize = async (folderId: mongoose.Types.ObjectId): Promise<number> => {
  let size = 0;
  const children = await File.find({ parentId: folderId });
  for (const child of children) {
    if (child.isFolder) {
      size += await calculateFolderSize(child._id as mongoose.Types.ObjectId);
    } else {
      size += child.fileSize || 0;
    }
  }
  return size;
};

const run = async () => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error('Missing MONGODB_URI environment variable');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongodbUri);

    const folders = await File.find({ isFolder: true });

    for (const folder of folders) {
      const size = await calculateFolderSize(folder._id as mongoose.Types.ObjectId);
      folder.fileSize = size;
      await folder.save();
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('Synchronization failed:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

void run();

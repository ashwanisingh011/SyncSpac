import mongoose from 'mongoose';
import Task from './models/Task.js';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/taskbridge');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

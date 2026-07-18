import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

export const migrateProjectCounters = async (): Promise<void> => {
  try {
    // 1. Fetch all projects
    const projects = await Project.find({});

    for (const project of projects) {
      const pKey = project.key ? project.key.toUpperCase() : 'TASK';
      
      // Fetch all tasks for this project, sorted by creation date
      const tasks = await Task.find({ project: project._id }).sort({ createdAt: 1 });
      
      if (tasks.length === 0) {
        // If the project has no tasks, set the counter to 0 if it's not already set
        if (project.lastTaskSequence === undefined || project.lastTaskSequence === null) {
          project.lastTaskSequence = 0;
          await project.save();
        }
        continue;
      }

      // Calculate the highest sequence number from existing task keys
      let maxSeq = 0;
      for (const task of tasks) {
        if (task.taskKey) {
          const match = task.taskKey.match(/-(\d+)$/);
          if (match) {
            const seqNum = parseInt(match[1], 10);
            if (seqNum > maxSeq) {
              maxSeq = seqNum;
            }
          }
        }
      }

      // Track seen task keys to resolve duplicates
      const seenKeys = new Set<string>();
      let updatedCount = 0;

      for (const task of tasks) {
        if (!task.taskKey) {
          // If taskKey is missing, assign one
          maxSeq += 1;
          task.taskKey = `${pKey}-${maxSeq}`;
          await task.save();
          seenKeys.add(task.taskKey);
          updatedCount++;
          continue;
        }

        if (seenKeys.has(task.taskKey)) {
          // Duplicate key found! Resolve it by assigning the next sequence number
          maxSeq += 1;
          task.taskKey = `${pKey}-${maxSeq}`;
          await task.save();
          seenKeys.add(task.taskKey);
          updatedCount++;
        } else {
          seenKeys.add(task.taskKey);
        }
      }

      // Initialize or update the project's sequence counter
      project.lastTaskSequence = maxSeq;
      await project.save();
    }

    // 2. Ensure unique index on { organization, taskKey } is created
    try {
      await Task.collection.createIndex(
        { organization: 1, taskKey: 1 },
        { 
          unique: true,
          partialFilterExpression: { taskKey: { $exists: true } }
        }
      );
    } catch (indexError: any) {
      // Failed to build unique index
    }
  } catch (error: any) {
    // Error during migration
  }
};

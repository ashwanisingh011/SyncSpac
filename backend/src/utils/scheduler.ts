import cron from 'node-cron';
import cronParser from 'cron-parser';
import RecurringTask from '../models/RecurringTask.js';
import logger from '../config/logger.js';
import Task from '../models/Task.js';
import TaskHistory from '../models/TaskHistory.js';

export const checkAndCreateRecurringTasks = async (): Promise<void> => {
  try {
    const now = new Date();
    // Query active templates that are past due or currently due
    const dueTemplates = await RecurringTask.find({
      isActive: true,
      nextRunTime: { $lte: now },
    });

    if (dueTemplates.length === 0) return;

    for (const template of dueTemplates) {
      try {
        // 1. Create a new Task instance based on the template
        const newTask = new Task({
          organization: template.organization,
          project: template.project,
          title: template.title,
          description: template.description,
          type: template.type,
          priority: template.priority,
          estimatedTime: template.estimatedTime,
          assignedTo: template.assignee,
          labels: template.labels,
          status: 'todo', // initial status
          createdBy: template.createdBy,
        });

        const savedTask = await newTask.save();

        // 2. Create history log entry for task creation
        const historyEntry = new TaskHistory({
          task: savedTask._id,
          user: template.createdBy,
          action: 'create',
          field: 'status',
          oldValue: 'None',
          newValue: `Task automatically created via Recurring Template: "${template.title}"`,
        });
        await historyEntry.save();

        // 3. Calculate next occurrence using cron-parser, starting from the current nextRunTime to avoid drift
        const parser = (cronParser as any).default || cronParser;
        const interval = parser.parse(template.cronExpression, {
          currentDate: template.nextRunTime,
        });
        const nextDate = interval.next().toDate();

        // 4. Update RecurringTask template with next run time and last run time
        template.nextRunTime = nextDate;
        template.lastRunTime = now;
        await template.save();
        
        logger.info(`[Scheduler] Instantiated task "${savedTask.title}" (${savedTask.taskKey}) from recurring template ${template._id}.`);
      } catch (err: any) {
        logger.error(`[Scheduler] Failed to process recurring task template ${template._id}:`, err);
      }
    }
  } catch (error) {
    logger.error('[Scheduler] Error in checkAndCreateRecurringTasks execution:', error);
  }
};

export const initializeScheduler = (): void => {
  logger.info('[Scheduler] Scheduler daemon initialized: Recurring task processor registered to run every minute.');
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkAndCreateRecurringTasks();
  });
};

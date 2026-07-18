import {Request, Response, NextFunction} from 'express';
import {Types} from 'mongoose';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';


/**
 * @route   POST /api/v1/sprints/project/:projectid
 * @desc    Create a new time-boxed sprint container inside the backlog view.
 * @access  Protected (Auth + manage_sprint permission mapping)
 */

export const createSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const projectId = req.params.projectId as string;

        if (!projectId || typeof projectId !== 'string' || !Types.ObjectId.isValid(projectId)) {
            res.status(400).json({ success: false, message: 'Validation Error: Invalid or missing Project ID' });
            return;
        }

        const{name, goal, startDate, endDate} = req.body;

        const requesterId = req.user?._id;

        const organizationId = req.user?.organization;

        if(!organizationId || !requesterId){
            res.status(403).json({success: false, message: 'Forbidden: Missing active Organization or User Context'});
            return;
        }

        if(!name){
            res.status(400).json({success: false, message: "Valdiation Error: Sprint name is required field"});
            return;
        }

        const sprint = await Sprint.create({
            projectId: new Types.ObjectId(projectId),
            orgId: new Types.ObjectId(organizationId),
            name,
            goal,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: 'planned',
            createdBy: new Types.ObjectId(requesterId.toString())
        })
        
        res.status(201).json({
            success: true,
            message: "Sprint created successfully inside planning phase",
            data: sprint
        })

    }catch(error: any){
       next(error);
    }
}

/**
 * @route   POST /api/v1/sprints/:id/start
 * @desc    Transition a sprint's status to active.
 * @access  Protected (Auth + manage_sprint)
 */

export const startSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.body;

        const sprint = await Sprint.findById(id);
        if (!sprint) {
            res.status(404).json({ success: false, message: 'Sprint not found' });
            return;
        }

        if (sprint.status !== 'planned') {
            res.status(400).json({ success: false, message: `Business Error: Cannot start a sprint that is currently ${sprint.status}` });
            return;
        }

        // Dynamically compute total story points of all tasks currently committed to this sprint container
        const tasksInSprint = await Task.find({ sprintId: sprint._id, isDeleted: false });
        const totalPoints = tasksInSprint.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        sprint.status = 'active';
        sprint.totalPoints = totalPoints;
        sprint.startDate = startDate ? new Date(startDate) : new Date();
        sprint.endDate = endDate ? new Date(endDate) : sprint.endDate;

        // Save the modifications — this triggers our single-active firewall check!
        await sprint.save();

        try {
            const { getIO } = await import('../config/socket.js');
            getIO().to(sprint.projectId.toString()).emit('sprint:started', sprint);
        } catch (err) {}

        res.status(200).json({
            success: true,
            message: 'Sprint has successfully been started and pushed live',
            data: sprint
        });

    } catch (error: any) {
        // Intercept validation failures from our pre-save single-active rule block
        if (error.message?.includes('Validation Error')) {
            res.status(409).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};


/**
 * @route   POST /api/v1/sprints/:id/complete
 * @desc    Close an active sprint cycle, compute metrics, and sweep loose tasks.
 * @access  Protected (Auth + manage_sprint)
 */
export const completeSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const sprint = await Sprint.findById(id);
        if (!sprint) {
            res.status(404).json({ success: false, message: 'Sprint target container not found' });
            return;
        }

        if (sprint.status !== 'active') {
            res.status(400).json({ success: false, message: 'Business Error: Only active sprints can be processed for completion' });
            return;
        }

        // 1. Fetch all tasks assigned to this active sprint container
        const tasks = await Task.find({ sprintId: sprint._id, isDeleted: false });

        // 2. Compute metrics: Filter tasks that are strictly marked as 'done'
        const completedTasks = tasks.filter(task => task.status === 'done');
        const completedPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        // Calculate total story points at the exact time of completion
        const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        // 3. Update the sprint data container metrics
        sprint.status = 'completed';
        sprint.completedPoints = completedPoints;
        sprint.totalPoints = totalPoints;
        sprint.velocity = completedPoints; // Velocity equals completed points in this iteration
        sprint.completedAt = new Date();

        await sprint.save();

        // 4. 🧹 THE AUTOMATED CLEANUP SWEEP
        // Reset the sprint reference to null for any task that was NOT completed, safely moving them to the backlog.
        await Task.updateMany(
            { 
                sprintId: sprint._id, 
                status: { $ne: 'done' } 
            },
            { 
                $set: { sprintId: null } 
            }
        );

        try {
            const { getIO } = await import('../config/socket.js');
            getIO().to(sprint.projectId.toString()).emit('sprint:completed', { 
                sprintId: sprint._id, 
                velocity: sprint.velocity 
            });
        } catch (err) {}

        res.status(200).json({
            success: true,
            message: 'Sprint finalized successfully. Historical velocity calculated and unfinished items returned to backlog.',
            data: sprint
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/sprints/project/:projectId
 * @desc    Get all sprints for a specific project.
 * @access  Protected
 */
export const getSprintsByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const projectId = req.params.projectId as string;
        if (!projectId || !Types.ObjectId.isValid(projectId)) {
            res.status(400).json({ success: false, message: 'Invalid Project ID' });
            return;
        }
        const sprints = await Sprint.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: sprints });
    } catch (error) {
        next(error);
    }
};
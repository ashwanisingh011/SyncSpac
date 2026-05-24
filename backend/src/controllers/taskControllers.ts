import {type Response } from 'express'
import Project from '../models/Project.js';
import { type AuthRequest } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';

export const createTask = async(req: AuthRequest, res: Response):Promise<void> =>{
    try{
        const {title, description, status, project, assigned} = req.body;

        if(!title || !project){
            res.status(400).json({message: "Task title and projectId is required"})
            return;
        }

       const currentStatus = status || 'todo'

        const task = await Task.create({
            title,
            description,
            status: currentStatus,
            project: project,
            assigned
        })
        await Project.findByIdAndUpdate(project, {$push: {[`columns.${currentStatus}`]: task._id}})

        res.status(201).json({
            message: "Task created successfully",
            task
        })
    } catch (error){
        console.error("Error creating task:", error);
        res.status(500).json({message: "Server error"});
    }
}

export const updateTaskStatus = async(req: AuthRequest, res: Response):Promise<void> => {
    try {
     const {taskId} = req.params;
     const {newStatus, projectId} = req.body;

     const task = await Task.findById(taskId);
     if(!task){
        res.status(404).json({message: "Task not found"});
        return;
     }

     const oldStatus = task.status;

     task.status = newStatus;
     await task.save();

     await Project.findByIdAndUpdate(projectId, {$pull: {[`columns.${oldStatus}`]: task._id}})
     await Project.findByIdAndUpdate(projectId, {$push: {[`columns.${newStatus}`]: task._id}})

     res.status(200).json({
        message: "Task status updated successfully",
        task
     })
     
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({message: "Server error"});
    }
}
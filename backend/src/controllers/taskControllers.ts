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
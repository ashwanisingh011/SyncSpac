import {type Response } from 'express';
import Project from '../models/Project.js';
import { type AuthRequest } from '../middleware/authMiddleware.js';
import Workspace from '../models/Workspace.js';

export const createProject = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {name, workspaceId} = req.body;

        if(!name || !workspaceId){
            res.status(400).json({message: "Project name and workspace ID are required"});
            return;
        }

        const project = await Project.create({
            name,
            workspace: workspaceId,
            columns: {
                todo: [],
                inProgress: [],
                done: []
            }
        });

        await Workspace.findByIdAndUpdate(workspaceId, {$push: {projects: project._id}})

        res.status(201).json({
            message: "Project created successfully",
            project
        })
    } catch (error){
        console.error("Error creating project:", error);
        res.status(500).json({message: "Server error"});
    }
}
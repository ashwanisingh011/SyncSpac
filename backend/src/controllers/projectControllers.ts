import {type Response } from 'express';
import Project from '../models/Project.js';
import { type AuthRequest } from '../middleware/authMiddleware.js';
import Workspace from '../models/Workspace.js';
import mongoose from 'mongoose';

export const createProject = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {name, description, workspaceId} = req.body;

        if(!name){
            res.status(400).json({message: "Project name is required"});
            return;
        }

        let targetWorkspaceId = workspaceId;

        if (!targetWorkspaceId && req.userId?.id) {
            const workspace = await Workspace.findOne({
                $or: [
                    { owner: req.userId.id },
                    { 'members.user': req.userId.id }
                ]
            }).sort({ createdAt: 1 });

            if (workspace) {
                targetWorkspaceId = workspace._id.toString();
            }
        }

        if(!targetWorkspaceId){
            res.status(400).json({message: "Workspace ID is required"});
            return;
        }

        const project = await Project.create({
            name,
            description,
            workspace: targetWorkspaceId,
            columns: {
                todo: [],
                inProgress: [],
                done: []
            }
        });

        await Workspace.findByIdAndUpdate(targetWorkspaceId, {$push: {projects: project._id}})

        res.status(201).json({
            message: "Project created successfully",
            project
        })
    } catch (error){
        console.error("Error creating project:", error);
        res.status(500).json({message: "Server error"});
    }
}

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const projectId = req.params.id;

        const project = await Project.findById(projectId).populate('columns.todo columns.inProgress columns.done');

        if(!project){
            res.status(404).json({success: false, message: "Project not found"})
            return;
        }

        res.status(200).json({
            success: true,
            project
        })

    } catch (error) {
        res.status(500).json({success: false, message: "Server error"});
    }
}
import { type Response } from 'express';
import Workspace from '../models/Workspace.js';
import {type  AuthRequest } from '../middleware/authMiddleware.js';

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

       
        if (!name) {
            res.status(400).json({ message: "Workspace name is required" });
            return;
        }

        const workspace = await Workspace.create({
           name,
           owner: req.userId.id,
           members: [{ user: req.userId.id, role: 'admin' }],
           projects:[],
        });


      
        res.status(201).json({
            message: "Workspace created successfully",
            workspace
        });

    } catch (error) {
        console.error("Error creating workspace:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
    const workspaceId = req.params.id;

    try{
        const workspace = await Workspace.findById(workspaceId).populate('projects')
        if(!workspace){
            res.status(404).json({message: "Workspace not found"});
            return;
        }
        res.status(200).json(workspace);
    }
    catch(error){
        console.error("Error fetching workspace:", error);
        res.status(500).json({message: "server error"})
    }
}
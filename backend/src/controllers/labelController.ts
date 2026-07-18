import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Label from '../models/Label.js';
import Task from '../models/Task.js';

const getOrganizationId = (req: Request): Types.ObjectId | null => {
  return req.user?.organization ? new Types.ObjectId(req.user.organization.toString()) : null;
};

// Create a new label
export const createLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const { name, color, projectId } = req.body;

    if (!organizationId) {
      res.status(403).json({ success: false, message: 'Organization not found', data: null });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Label name is required', data: null });
      return;
    }

    // Check if label name already exists in this scope
    const existingLabel = await Label.findOne({
      organization: organizationId,
      project: projectId ? new Types.ObjectId(projectId) : null,
      name: name.trim(),
    });

    if (existingLabel) {
      res.status(400).json({ success: false, message: 'A label with this name already exists in this scope', data: null });
      return;
    }

    const label = await Label.create({
      name: name.trim(),
      color: color || '#e0e0e0',
      organization: organizationId,
      project: projectId ? new Types.ObjectId(projectId) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: label,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Fetch all labels for the organization (optionally filtered by project)
export const getLabels = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const { projectId } = req.query;

    if (!organizationId) {
      res.status(403).json({ success: false, message: 'Organization not found', data: null });
      return;
    }

    const query: Record<string, any> = { organization: organizationId };

    if (projectId) {
      // Fetch project-specific labels OR global organization-level labels (where project is null)
      query.$or = [
        { project: new Types.ObjectId(projectId as string) },
        { project: null }
      ];
    }

    const labels = await Label.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Labels retrieved successfully',
      data: labels,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Update an existing label
export const updateLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const { name, color } = req.body;

    if (!organizationId) {
      res.status(403).json({ success: false, message: 'Organization not found', data: null });
      return;
    }

    const label = await Label.findOne({ _id: id, organization: organizationId });
    if (!label) {
      res.status(404).json({ success: false, message: 'Label not found', data: null });
      return;
    }

    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400).json({ success: false, message: 'Label name cannot be empty', data: null });
        return;
      }
      
      // Prevent duplicate names in same project/global scope
      const duplicateLabel = await Label.findOne({
        _id: { $ne: label._id },
        organization: organizationId,
        project: label.project,
        name: name.trim(),
      });

      if (duplicateLabel) {
        res.status(400).json({ success: false, message: 'A label with this name already exists in this scope', data: null });
        return;
      }
      label.name = name.trim();
    }

    if (color !== undefined) {
      label.color = color;
    }

    await label.save();

    res.status(200).json({
      success: true,
      message: 'Label updated successfully',
      data: label,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Delete a label and clean up references from tasks
export const deleteLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    if (!organizationId) {
      res.status(403).json({ success: false, message: 'Organization not found', data: null });
      return;
    }

    const label = await Label.findOneAndDelete({ _id: id, organization: organizationId });
    if (!label) {
      res.status(404).json({ success: false, message: 'Label not found', data: null });
      return;
    }

    // Pull label reference from all tasks within this organization for reference integrity
    await Task.updateMany(
      { organization: organizationId, labels: id },
      { $pull: { labels: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Label deleted and cleaned up successfully',
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

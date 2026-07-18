import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Department from '../models/Department.js';
import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware.js';

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private (manage_departments permission)
 */
export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, head } = req.body;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    if (!name) {
      throw new BadRequestError('Department name is required');
    }

    const department = new Department({
      orgId,
      name,
      head: head ? new mongoose.Types.ObjectId(head) : undefined,
      memberCount: 0,
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all departments in active organization
 * @route   GET /api/departments
 * @access  Private
 */
export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    const departments = await Department.find({ orgId })
      .populate('head', 'name email avatar')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update department properties
 * @route   PATCH /api/departments/:id
 * @access  Private (manage_departments permission)
 */
export const updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;
    const { name, head } = req.body;

    const department = await Department.findOne({ _id: id, orgId });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    if (name) department.name = name;
    if (head !== undefined) department.head = head ? new mongoose.Types.ObjectId(head) : undefined;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a department
 * @route   DELETE /api/departments/:id
 * @access  Private (manage_departments permission)
 */
export const deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;

    const department = await Department.findOneAndDelete({ _id: id, orgId });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

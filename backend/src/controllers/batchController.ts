import { Request, Response } from 'express';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';

export const getBatches = async (req: Request, res: Response) => {
  try {
    const batches = await Batch.findAll({
      include: [{ model: Course, as: 'course' }],
      order: [['batchCode', 'ASC']]
    });
    res.status(200).json(batches);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findByPk(req.params.id as string, {
      include: [{ model: Course, as: 'course' }]
    });
    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }
    res.status(200).json(batch);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchCode, courseId, maxStudents, currentStudents, schedule, mode, type } = req.body;

    // Validate if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      res.status(404).json({ message: 'Selected Course does not exist' });
      return;
    }

    // Check unique batchCode
    const existing = await Batch.findOne({ where: { batchCode } });
    if (existing) {
      res.status(400).json({ message: `Batch code "${batchCode}" already exists` });
      return;
    }

    const max = Number(maxStudents);
    const current = Number(currentStudents || 0);

    if (current > max) {
      res.status(400).json({ message: 'Current student count cannot exceed max students limit' });
      return;
    }

    let status = 'Available';
    if (current === max) {
      status = 'Full';
    }

    const created = await Batch.create({
      ...req.body,
      schedule: schedule || course.schedule || 'Weekday',
      mode: mode || course.mode || 'Physical',
      type: type || course.type || 'Full Time',
      currentStudents: current,
      maxStudents: max,
      status
    });

    const batch = await Batch.findByPk(created.id, {
      include: [{ model: Course, as: 'course' }]
    });

    res.status(201).json(batch);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByPk(id as string);
    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    const { batchCode, maxStudents, currentStudents, status } = req.body;

    // Check unique code if changed
    if (batchCode && batchCode !== batch.batchCode) {
      const existing = await Batch.findOne({ where: { batchCode } });
      if (existing) {
        res.status(400).json({ message: `Batch code "${batchCode}" is already in use` });
        return;
      }
    }

    const max = maxStudents !== undefined ? Number(maxStudents) : batch.maxStudents;
    const current = currentStudents !== undefined ? Number(currentStudents) : batch.currentStudents;

    if (current > max) {
      res.status(400).json({ message: 'Current student count cannot exceed max students limit' });
      return;
    }

    let calculatedStatus = status || batch.status;
    if (current === max) {
      calculatedStatus = 'Full';
    } else if (calculatedStatus === 'Full' && current < max) {
      calculatedStatus = 'Available';
    }

    await batch.update({
      ...req.body,
      maxStudents: max,
      currentStudents: current,
      status: calculatedStatus
    });

    const updatedBatch = await Batch.findByPk(id as string, {
      include: [{ model: Course, as: 'course' }]
    });

    res.status(200).json(updatedBatch);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const enrollStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByPk(id as string);
    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    // Check if batch is already full or completed
    if (batch.status === 'Completed') {
      res.status(400).json({ message: 'Enrollment blocked. This batch has already completed.' });
      return;
    }

    if (batch.currentStudents >= batch.maxStudents || batch.status === 'Full') {
      res.status(400).json({ message: 'Batch Capacity Reached. Please create a new batch for this course.' });
      return;
    }

    const nextCount = batch.currentStudents + 1;
    const nextStatus = nextCount === batch.maxStudents ? 'Full' : 'Available';

    await batch.update({
      currentStudents: nextCount,
      status: nextStatus
    });

    res.status(200).json({
      message: 'Student enrolled successfully',
      batch
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

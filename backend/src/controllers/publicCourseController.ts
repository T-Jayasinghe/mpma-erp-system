import { Request, Response } from 'express';
import { Course } from '../models/Course';
import { Batch } from '../models/Batch';

// Public website-ல் active courses மட்டும் காட்டும்
export const getPublicCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courses = await Course.findAll({
      where: {
        status: 'Active',
      },
      attributes: [
        'id',
        'courseCode',
        'courseName',
        'stream',
        'description',
        'duration',
        'medium',
        'location',
        'maxParticipants',
        'registrationFee',
        'courseFee',
        'status',
        'schedule',
        'type',
        'mode',
        'maxInstallments',
        'installmentAmounts',
      ],
      order: [['courseName', 'ASC']],
    });

    res.status(200).json(courses);
  } catch (error: any) {
    console.error('Get public courses error:', error);

    res.status(500).json({
      message: 'Unable to retrieve courses',
      error: error.message,
    });
  }
};

// Public website-ல் ஒரு specific course-ஐ காட்டும்
export const getPublicCourseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courseId = req.params.id as string;

    const course = await Course.findOne({
      where: {
        id: courseId,
        status: 'Active',
      },
      attributes: [
        'id',
        'courseCode',
        'courseName',
        'stream',
        'description',
        'duration',
        'medium',
        'location',
        'maxParticipants',
        'registrationFee',
        'courseFee',
        'status',
        'schedule',
        'type',
        'mode',
        'maxInstallments',
        'installmentAmounts',
      ],
    });

    if (!course) {
      res.status(404).json({
        message: 'Active course not found',
      });
      return;
    }

    res.status(200).json(course);
  } catch (error: any) {
    console.error('Get public course error:', error);

    res.status(500).json({
      message: 'Unable to retrieve course',
      error: error.message,
    });
  }
};

export const getAvailableBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({ where: { id: req.params.id, status: 'Active' }, attributes: ['id'] });
    if (!course) { res.status(404).json({ message: 'Active course not found' }); return; }
    const batches = await Batch.findAll({ where: { courseId: course.id, status: 'Available' }, order: [['startDate', 'ASC']] });
    res.json(batches);
  } catch { res.status(500).json({ message: 'Unable to retrieve batches' }); }
};

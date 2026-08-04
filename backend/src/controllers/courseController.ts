import { Request, Response } from 'express';
import { Course } from '../models/Course';
import { Lecturer } from '../models/Lecturer';
import CourseLecturer from '../models/CourseLecturer';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: Lecturer,
        as: 'lecturers',
        attributes: ['id', 'fullName', 'email', 'status'],
      }],
      order: [['courseName', 'ASC']]
    });
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findByPk(req.params.id as string, {
      include: [{
        model: Lecturer,
        as: 'lecturers',
        attributes: ['id', 'fullName', 'email', 'status'],
      }],
    });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseCode } = req.body;

    // Check if course code is already registered
    const existing = await Course.findOne({ where: { courseCode } });
    if (existing) {
      res.status(400).json({ message: `Course code "${courseCode}" already exists` });
      return;
    }

    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const { courseCode } = req.body;
    if (courseCode && courseCode !== course.courseCode) {
      const existing = await Course.findOne({ where: { courseCode } });
      if (existing) {
        res.status(400).json({ message: `Course code "${courseCode}" is already in use by another course` });
        return;
      }
    }

    await course.update(req.body);
    res.status(200).json(course);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleCourseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const newStatus = course.status === 'Active' ? 'Inactive' : 'Active';
    await course.update({ status: newStatus });
    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseLecturers = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findByPk(req.params.id as string);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const assignments = await CourseLecturer.findAll({
      where: { courseId: course.id },
      include: [{ model: Lecturer, as: 'lecturer' }],
    });

    const lecturers = assignments.map((assignment: any) => assignment.lecturer).filter(Boolean);
    res.status(200).json(lecturers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignLecturerToCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lecturerId } = req.body;

    const course = await Course.findByPk(id as string);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const lecturer = await Lecturer.findByPk(lecturerId as string);
    if (!lecturer) {
      res.status(404).json({ message: 'Lecturer not found' });
      return;
    }

    const existing = await CourseLecturer.findOne({ where: { courseId: course.id, lecturerId: lecturer.id } });
    if (existing) {
      res.status(400).json({ message: 'This lecturer is already assigned to this course' });
      return;
    }

    const assignment = await CourseLecturer.create({ courseId: course.id, lecturerId: lecturer.id });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeLecturerFromCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, lecturerId } = req.params;

    const assignment = await CourseLecturer.findOne({ where: { courseId: id, lecturerId } });
    if (!assignment) {
      res.status(404).json({ message: 'Assignment record not found' });
      return;
    }

    await assignment.destroy();
    res.status(200).json({ message: 'Lecturer removed from course successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, email, password, role, employeeId, phoneNumber, isActive,
      canBookAuditorium, canBookClassroom, canBookTransport,
      canManageVehicles, canManageClassrooms, canManageMaintenance,
      canManageCourses, canManageBatches, canManageLecturers,
      canManageEnrollment, canManagePayments, canManageCertificates,
      canManageStudents, canManageUsers
    } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      employeeId,
      phoneNumber,
      isActive: isActive !== undefined ? !!isActive : true,
      canBookAuditorium: !!canBookAuditorium,
      canBookClassroom: !!canBookClassroom,
      canBookTransport: !!canBookTransport,
      canManageVehicles: !!canManageVehicles,
      canManageClassrooms: !!canManageClassrooms,
      canManageMaintenance: !!canManageMaintenance,
      canManageCourses: !!canManageCourses,
      canManageBatches: !!canManageBatches,
      canManageLecturers: !!canManageLecturers,
      canManageEnrollment: !!canManageEnrollment,
      canManagePayments: !!canManagePayments,
      canManageCertificates: !!canManageCertificates,
      canManageStudents: !!canManageStudents,
      canManageUsers: !!canManageUsers
    });

    // Send welcome email with login credentials
    await sendWelcomeEmail(email, password, name);

    res.status(201).json({
      message: 'User registered successfully and email sent.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        canBookAuditorium: user.canBookAuditorium,
        canBookClassroom: user.canBookClassroom,
        canBookTransport: user.canBookTransport,
        canManageVehicles: user.canManageVehicles,
        canManageClassrooms: user.canManageClassrooms,
        canManageMaintenance: user.canManageMaintenance,
        canManageCourses: user.canManageCourses,
        canManageBatches: user.canManageBatches,
        canManageLecturers: user.canManageLecturers,
        canManageEnrollment: user.canManageEnrollment,
        canManagePayments: user.canManagePayments,
        canManageCertificates: user.canManageCertificates,
        canManageStudents: user.canManageStudents,
        canManageUsers: user.canManageUsers
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not found in request' });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user || !user.password) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect current password' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('DELETE request for user ID:', id);
    const user = await User.findByPk(id as string);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prevent deleting self
    const adminId = (req as any).user?.id;
    if (adminId === id) {
      res.status(400).json({ message: 'You cannot delete your own account' });
      return;
    }

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, email, employeeId, role, phoneNumber, isActive,
      canBookAuditorium, canBookClassroom, canBookTransport,
      canManageVehicles, canManageClassrooms, canManageMaintenance,
      canManageCourses, canManageBatches, canManageLecturers,
      canManageEnrollment, canManagePayments, canManageCertificates,
      canManageStudents, canManageUsers
    } = req.body;

    const user = await User.findByPk(id as string);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    if (canBookAuditorium !== undefined) user.canBookAuditorium = canBookAuditorium;
    if (canBookClassroom !== undefined) user.canBookClassroom = canBookClassroom;
    if (canBookTransport !== undefined) user.canBookTransport = canBookTransport;
    if (canManageVehicles !== undefined) user.canManageVehicles = canManageVehicles;
    if (canManageClassrooms !== undefined) user.canManageClassrooms = canManageClassrooms;
    if (canManageMaintenance !== undefined) user.canManageMaintenance = canManageMaintenance;
    if (canManageCourses !== undefined) user.canManageCourses = canManageCourses;
    if (canManageBatches !== undefined) user.canManageBatches = canManageBatches;
    if (canManageLecturers !== undefined) user.canManageLecturers = canManageLecturers;
    if (canManageEnrollment !== undefined) user.canManageEnrollment = canManageEnrollment;
    if (canManagePayments !== undefined) user.canManagePayments = canManagePayments;
    if (canManageCertificates !== undefined) user.canManageCertificates = canManageCertificates;
    if (canManageStudents !== undefined) user.canManageStudents = canManageStudents;
    if (canManageUsers !== undefined) user.canManageUsers = canManageUsers;

    await user.save();

    await user.save();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import '../config/env';
import { sequelize } from '../config/db';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { setupAssociations } from '../models/associations';

const createCustomAdmin = async () => {
  try {
    setupAssociations();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    const salt = await bcrypt.genSalt(10);

    const adminsToCreate = [
      {
        name: 'MPMA Admin User',
        email: 'mpmaadmin@erp.com',
        password: 'adminpassword123',
        employeeId: 'ADM-003',
        phoneNumber: '0778899001',
      },
      {
        name: 'Super Administrator',
        email: 'superadmin@erp.com',
        password: 'Admin@2026Password',
        employeeId: 'ADM-004',
        phoneNumber: '0778899002',
      }
    ];

    console.log('--------------------------------------------------');
    console.log('CREATING NEW ADMIN CREDENTIALS...');
    console.log('--------------------------------------------------');

    for (const adminData of adminsToCreate) {
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      const [user, created] = await User.findOrCreate({
        where: { email: adminData.email },
        defaults: {
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
          role: 'admin',
          employeeId: adminData.employeeId,
          isActive: true,
          canBookAuditorium: true,
          canBookClassroom: true,
          canBookTransport: true,
          canManageVehicles: true,
          canManageClassrooms: true,
          canManageMaintenance: true,
          phoneNumber: adminData.phoneNumber,
        }
      });

      if (!created) {
        await user.update({
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          canBookAuditorium: true,
          canBookClassroom: true,
          canBookTransport: true,
          canManageVehicles: true,
          canManageClassrooms: true,
          canManageMaintenance: true,
        });
        console.log(`[UPDATED] Admin User: ${adminData.email} | Password: ${adminData.password}`);
      } else {
        console.log(`[CREATED] Admin User: ${adminData.email} | Password: ${adminData.password}`);
      }
    }

    console.log('--------------------------------------------------');
    console.log('ALL ADMIN CREDENTIALS ARE READY FOR LOGIN!');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin credentials:', error);
    process.exit(1);
  }
};

createCustomAdmin();

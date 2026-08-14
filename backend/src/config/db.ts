import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE || "event1",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

console.log("Connecting to database:", process.env.DB_DATABASE);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected successfully.');
    // Synchronize all models
    await sequelize.sync();
    console.log('MySQL Database synchronized.');

    // Programmatically ensure new Course columns exist
    try {
      const queryInterface = sequelize.getQueryInterface();
      const tableDefinition = await queryInterface.describeTable('courses');
      
      if (!tableDefinition.schedule) {
        await queryInterface.addColumn('courses', 'schedule', {
          type: DataTypes.ENUM('Weekday', 'Weekend'),
          allowNull: true,
          defaultValue: 'Weekday',
        });
        console.log('Successfully added missing column "schedule" to courses table.');
      }
      
      if (!tableDefinition.type) {
        await queryInterface.addColumn('courses', 'type', {
          type: DataTypes.ENUM('Full Time', 'Part Time'),
          allowNull: true,
          defaultValue: 'Full Time',
        });
        console.log('Successfully added missing column "type" to courses table.');
      }
      
      if (!tableDefinition.mode) {
        await queryInterface.addColumn('courses', 'mode', {
          type: DataTypes.ENUM('Online', 'Physical', 'Hybrid'),
          allowNull: true,
          defaultValue: 'Physical',
        });
        console.log('Successfully added missing column "mode" to courses table.');
      }
    } catch (migrationError: any) {
      console.warn('Notice: Course table column checks skipped or table does not exist yet:', migrationError.message);
    }

    // Programmatically ensure new Batch columns exist
    try {
      const queryInterface = sequelize.getQueryInterface();
      const batchTableDefinition = await queryInterface.describeTable('batches');
      
      if (!batchTableDefinition.schedule) {
        await queryInterface.addColumn('batches', 'schedule', {
          type: DataTypes.ENUM('Weekday', 'Weekend'),
          allowNull: true,
          defaultValue: 'Weekday',
        });
        console.log('Successfully added missing column "schedule" to batches table.');
      }
      
      if (!batchTableDefinition.mode) {
        await queryInterface.addColumn('batches', 'mode', {
          type: DataTypes.ENUM('Online', 'Physical', 'Hybrid'),
          allowNull: true,
          defaultValue: 'Physical',
        });
        console.log('Successfully added missing column "mode" to batches table.');
      }
      
      if (!batchTableDefinition.type) {
        await queryInterface.addColumn('batches', 'type', {
          type: DataTypes.ENUM('Full Time', 'Part Time'),
          allowNull: true,
          defaultValue: 'Full Time',
        });
        console.log('Successfully added missing column "type" to batches table.');
      }
    } catch (migrationError: any) {
      console.warn('Notice: Batch table column checks skipped or table does not exist yet:', migrationError.message);
    }

    // Programmatically ensure new Lecturer columns exist
    try {
      const queryInterface = sequelize.getQueryInterface();
      const lecturerTableDefinition = await queryInterface.describeTable('lecturers');
      
      if (!lecturerTableDefinition.qualifications) {
        await queryInterface.addColumn('lecturers', 'qualifications', {
          type: DataTypes.TEXT,
          allowNull: true,
        });
        console.log('Successfully added missing column "qualifications" to lecturers table.');
      }

      if (!lecturerTableDefinition.category) {
        await queryInterface.addColumn('lecturers', 'category', {
          type: DataTypes.ENUM('SLPA', 'Outside'),
          allowNull: false,
          defaultValue: 'SLPA',
        });
        console.log('Successfully added missing column "category" to lecturers table.');
      }

      if (!lecturerTableDefinition.epfNumber) {
        await queryInterface.addColumn('lecturers', 'epfNumber', {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }

      if (!lecturerTableDefinition.department) {
        await queryInterface.addColumn('lecturers', 'department', {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }

      if (!lecturerTableDefinition.companyName) {
        await queryInterface.addColumn('lecturers', 'companyName', {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }

      if (!lecturerTableDefinition.designation) {
        await queryInterface.addColumn('lecturers', 'designation', {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }

      if (!lecturerTableDefinition.stream) {
        await queryInterface.addColumn('lecturers', 'stream', {
          type: DataTypes.STRING,
          allowNull: true,
        });
        console.log('Successfully added missing column "stream" to lecturers table.');
      }

      if (!lecturerTableDefinition.centralBankCode) {
        await queryInterface.addColumn('lecturers', 'centralBankCode', {
          type: DataTypes.STRING,
          allowNull: true,
        });
        console.log('Successfully added missing column "centralBankCode" to lecturers table.');
      }
    } catch (migrationError: any) {
      console.warn('Notice: Lecturer table column checks skipped or table does not exist yet:', migrationError.message);
    }

    // Programmatically ensure new User permission columns exist
    try {
      const queryInterface = sequelize.getQueryInterface();
      const userTableDefinition = await queryInterface.describeTable('users');
      const permCols = [
        'canManageCourses', 'canManageBatches', 'canManageLecturers',
        'canManageEnrollment', 'canManagePayments', 'canManageCertificates',
        'canManageStudents', 'canManageUsers'
      ];
      for (const col of permCols) {
        if (!userTableDefinition[col]) {
          await queryInterface.addColumn('users', col, {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          });
          console.log(`Successfully added missing column "${col}" to users table.`);
        }
      }
    } catch (userMigrationError: any) {
      console.warn('Notice: Users table permission column checks skipped:', userMigrationError.message);
    }

    // Auto-populate BankBranch table in database if empty
    try {
      const { BankBranch } = await import('../models/BankBranch');
      const { INITIAL_BANK_BRANCHES } = await import('../data/bankBranchesData');
      const count = await BankBranch.count();
      if (count === 0) {
        await BankBranch.bulkCreate(INITIAL_BANK_BRANCHES);
        console.log(`Successfully populated bank_branches table with ${INITIAL_BANK_BRANCHES.length} branch records.`);
      } else {
        console.log(`bank_branches table contains ${count} records.`);
      }
    } catch (bankError: any) {
      console.warn('Notice: BankBranch table sync/population warning:', bankError.message);
    }
  } catch (error: any) {
    console.error(`Error connecting to MySQL: ${error.message}`);
    process.exit(1);
  }
};

export { sequelize, DataTypes, Model, Optional };
export default connectDB;

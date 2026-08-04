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
    } catch (migrationError: any) {
      console.warn('Notice: Lecturer table column checks skipped or table does not exist yet:', migrationError.message);
    }
  } catch (error: any) {
    console.error(`Error connecting to MySQL: ${error.message}`);
    process.exit(1);
  }
};

export { sequelize, DataTypes, Model, Optional };
export default connectDB;

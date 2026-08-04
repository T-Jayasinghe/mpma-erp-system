import { sequelize, DataTypes, Model, Optional } from '../config/db';

export interface CourseLecturerAttributes {
  id: string;
  courseId: string;
  lecturerId: string;
}

interface CourseLecturerCreationAttributes extends Optional<CourseLecturerAttributes, 'id'> {}

export class CourseLecturer extends Model<CourseLecturerAttributes, CourseLecturerCreationAttributes> implements CourseLecturerAttributes {
  public id!: string;
  public courseId!: string;
  public lecturerId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CourseLecturer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lecturerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'course_lecturers',
  }
);

export default CourseLecturer;

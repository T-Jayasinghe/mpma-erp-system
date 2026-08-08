import { sequelize, DataTypes, Model, Optional } from '../config/db';

export interface BankBranchAttributes {
  id: string;
  bankName: string;
  bankShortCode: string;
  branchName: string;
  centralBankCode: string;
  slpaCode?: string | null;
}

interface BankBranchCreationAttributes extends Optional<BankBranchAttributes, 'id'> {}

export class BankBranch extends Model<BankBranchAttributes, BankBranchCreationAttributes> implements BankBranchAttributes {
  public id!: string;
  public bankName!: string;
  public bankShortCode!: string;
  public branchName!: string;
  public centralBankCode!: string;
  public slpaCode?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BankBranch.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bankShortCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branchName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    centralBankCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slpaCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'bank_branches',
  }
);

export default BankBranch;

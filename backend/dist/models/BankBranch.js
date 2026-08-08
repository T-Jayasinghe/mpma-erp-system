"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankBranch = void 0;
const db_1 = require("../config/db");
class BankBranch extends db_1.Model {
}
exports.BankBranch = BankBranch;
BankBranch.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    bankName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    bankShortCode: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    branchName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    centralBankCode: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    slpaCode: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: 'bank_branches',
});
exports.default = BankBranch;

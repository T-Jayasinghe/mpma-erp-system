"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBankBranch = exports.createBankBranch = exports.getBankBranches = exports.getBanks = void 0;
const BankBranch_1 = __importDefault(require("../models/BankBranch"));
const db_1 = require("../config/db");
const getBanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banks = yield BankBranch_1.default.findAll({
            attributes: [
                'bankName',
                'bankShortCode',
                [db_1.sequelize.fn('COUNT', db_1.sequelize.col('id')), 'branchCount']
            ],
            group: ['bankName', 'bankShortCode'],
            order: [['bankName', 'ASC']]
        });
        res.status(200).json(banks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBanks = getBanks;
const getBankBranches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bankName } = req.query;
        const where = {};
        if (bankName) {
            where.bankName = bankName;
        }
        const branches = yield BankBranch_1.default.findAll({
            where,
            order: [['branchName', 'ASC']]
        });
        res.status(200).json(branches);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBankBranches = getBankBranches;
const createBankBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bankName, bankShortCode, branchName, centralBankCode, slpaCode } = req.body;
        if (!bankName || !branchName || !centralBankCode) {
            return res.status(400).json({ message: 'Bank Name, Branch Name, and Central Bank Code are required.' });
        }
        const existing = yield BankBranch_1.default.findOne({
            where: { bankName, branchName }
        });
        if (existing) {
            yield existing.update({
                bankShortCode: bankShortCode || existing.bankShortCode,
                centralBankCode: centralBankCode.trim(),
                slpaCode: slpaCode || existing.slpaCode
            });
            return res.status(200).json({ message: 'Bank Branch updated successfully in database.', branch: existing });
        }
        const newBranch = yield BankBranch_1.default.create({
            bankName: bankName.trim(),
            bankShortCode: bankShortCode ? bankShortCode.trim() : bankName.substring(0, 4).toUpperCase(),
            branchName: branchName.trim(),
            centralBankCode: centralBankCode.trim(),
            slpaCode: slpaCode ? slpaCode.trim() : null
        });
        res.status(201).json({ message: 'Bank Branch created successfully in database.', branch: newBranch });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createBankBranch = createBankBranch;
const deleteBankBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const branchId = Array.isArray(id) ? id[0] : id;
        const branch = yield BankBranch_1.default.findByPk(String(branchId));
        if (!branch) {
            return res.status(404).json({ message: 'Bank Branch not found.' });
        }
        yield branch.destroy();
        res.status(200).json({ message: 'Bank Branch deleted successfully from database.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteBankBranch = deleteBankBranch;

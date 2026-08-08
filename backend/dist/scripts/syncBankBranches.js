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
require("../config/env");
const db_1 = __importDefault(require("../config/db"));
const BankBranch_1 = __importDefault(require("../models/BankBranch"));
const bankBranchesData_1 = require("../data/bankBranchesData");
const syncBankBranches = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Connecting to MySQL database...');
        yield (0, db_1.default)();
        console.log('Syncing BankBranch model table...');
        yield BankBranch_1.default.sync({ alter: true });
        console.log('BankBranch table created/altered successfully.');
        const count = yield BankBranch_1.default.count();
        console.log(`Current bank_branches record count: ${count}`);
        if (count === 0) {
            console.log('Populating bank_branches table with initial records...');
            yield BankBranch_1.default.bulkCreate(bankBranchesData_1.INITIAL_BANK_BRANCHES);
            console.log(`Successfully populated ${bankBranchesData_1.INITIAL_BANK_BRANCHES.length} bank branch records into database!`);
        }
        else {
            console.log('bank_branches table is already populated.');
        }
        console.log('Done!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error syncing bank_branches table:', error.message);
        process.exit(1);
    }
});
syncBankBranches();

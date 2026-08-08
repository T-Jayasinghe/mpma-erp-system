import '../config/env';
import connectDB, { sequelize } from '../config/db';
import BankBranch from '../models/BankBranch';
import { INITIAL_BANK_BRANCHES } from '../data/bankBranchesData';

const syncBankBranches = async () => {
  try {
    console.log('Connecting to MySQL database...');
    await connectDB();

    console.log('Syncing BankBranch model table...');
    await BankBranch.sync({ alter: true });
    console.log('BankBranch table created/altered successfully.');

    const count = await BankBranch.count();
    console.log(`Current bank_branches record count: ${count}`);

    if (count === 0) {
      console.log('Populating bank_branches table with initial records...');
      await BankBranch.bulkCreate(INITIAL_BANK_BRANCHES);
      console.log(`Successfully populated ${INITIAL_BANK_BRANCHES.length} bank branch records into database!`);
    } else {
      console.log('bank_branches table is already populated.');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error syncing bank_branches table:', error.message);
    process.exit(1);
  }
};

syncBankBranches();

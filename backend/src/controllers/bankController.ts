import { Request, Response } from 'express';
import BankBranch from '../models/BankBranch';
import { sequelize } from '../config/db';

export const getBanks = async (req: Request, res: Response) => {
  try {
    const banks = await BankBranch.findAll({
      attributes: [
        'bankName',
        'bankShortCode',
        [sequelize.fn('COUNT', sequelize.col('id')), 'branchCount']
      ],
      group: ['bankName', 'bankShortCode'],
      order: [['bankName', 'ASC']]
    });
    res.status(200).json(banks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBankBranches = async (req: Request, res: Response) => {
  try {
    const { bankName } = req.query;
    const where: any = {};
    if (bankName) {
      where.bankName = bankName;
    }
    const branches = await BankBranch.findAll({
      where,
      order: [['branchName', 'ASC']]
    });
    res.status(200).json(branches);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBankBranch = async (req: Request, res: Response) => {
  try {
    const { bankName, bankShortCode, branchName, centralBankCode, slpaCode } = req.body;

    if (!bankName || !branchName || !centralBankCode) {
      return res.status(400).json({ message: 'Bank Name, Branch Name, and Central Bank Code are required.' });
    }

    const existing = await BankBranch.findOne({
      where: { bankName, branchName }
    });

    if (existing) {
      await existing.update({
        bankShortCode: bankShortCode || existing.bankShortCode,
        centralBankCode: centralBankCode.trim(),
        slpaCode: slpaCode || existing.slpaCode
      });
      return res.status(200).json({ message: 'Bank Branch updated successfully in database.', branch: existing });
    }

    const newBranch = await BankBranch.create({
      bankName: bankName.trim(),
      bankShortCode: bankShortCode ? bankShortCode.trim() : bankName.substring(0, 4).toUpperCase(),
      branchName: branchName.trim(),
      centralBankCode: centralBankCode.trim(),
      slpaCode: slpaCode ? slpaCode.trim() : null
    });

    res.status(201).json({ message: 'Bank Branch created successfully in database.', branch: newBranch });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBankBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branchId = Array.isArray(id) ? id[0] : id;
    const branch = await BankBranch.findByPk(String(branchId));

    if (!branch) {
      return res.status(404).json({ message: 'Bank Branch not found.' });
    }

    await branch.destroy();
    res.status(200).json({ message: 'Bank Branch deleted successfully from database.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


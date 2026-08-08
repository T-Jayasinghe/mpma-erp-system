import { Router } from 'express';
import { getBanks, getBankBranches, createBankBranch, deleteBankBranch } from '../controllers/bankController';

const router = Router();

router.get('/', getBanks);
router.get('/branches', getBankBranches);
router.post('/branches', createBankBranch);
router.delete('/branches/:id', deleteBankBranch);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applicationUpload_1 = require("../middleware/applicationUpload");
const publicApplicationController_1 = require("../controllers/publicApplicationController");
const router = (0, express_1.Router)();
const requests = new Map();
const limit = (req, res, next) => { const key = req.ip || 'unknown'; const now = Date.now(); const item = requests.get(key); if (!item || item.reset < now)
    requests.set(key, { count: 1, reset: now + 15 * 60000 });
else if (++item.count > 30)
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' }); next(); };
router.get('/slpa-employees/search', limit, publicApplicationController_1.searchSlpaEmployee);
router.get('/students/lookup-nic', limit, publicApplicationController_1.lookupStudentByNic);
router.post('/student-applications', limit, applicationUpload_1.applicationUpload, publicApplicationController_1.submitPublicApplication);
exports.default = router;

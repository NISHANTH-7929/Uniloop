import express from 'express';
import {
    createReport,
    getReports,
    updateReportStatus
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getReports) // Admin only ideally
    .post(protect, createReport);

router.route('/:id/status')
    .put(protect, updateReportStatus); // Admin only ideally

export default router;

import express from 'express';
import {
    getActiveBorrows,
    confirmBorrowReturn
} from '../controllers/borrowController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getActiveBorrows);

router.route('/:id/confirm-return')
    .put(protect, confirmBorrowReturn);

export default router;

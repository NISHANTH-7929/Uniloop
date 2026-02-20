import express from 'express';
import { checkInWithQR } from '../controllers/ticketController.js';

const router = express.Router();

router.post('/checkin', checkInWithQR);

export default router;

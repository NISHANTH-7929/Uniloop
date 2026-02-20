import express from 'express';
import {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations
} from '../controllers/registrationController.js';

const router = express.Router();

router.post('/:id/register', registerForEvent);         // /api/registrations/:id/register
router.delete('/:id/cancel', cancelRegistration);       // /api/registrations/:id/cancel
router.get('/my', getMyRegistrations);                  // /api/registrations/my

export default router;

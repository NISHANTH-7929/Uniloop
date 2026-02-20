import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent
} from '../controllers/eventController.js';

const router = express.Router();

router.post('/', createEvent);          // Organizer creates event
router.get('/', getAllEvents);          // Anyone fetches all events
router.get('/:id', getEventById);       // Get one event
router.delete('/:id', deleteEvent);     // Organizer/admin deletes

export default router;

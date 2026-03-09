import express from 'express';
import { getUsers, assignOrganizer, demoteOrganizer, resetDatabase } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Custom admin middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id/organizer', protect, adminOnly, assignOrganizer);
router.put('/users/:id/demote', protect, adminOnly, demoteOrganizer);
router.post('/reset', protect, adminOnly, resetDatabase);

export default router;

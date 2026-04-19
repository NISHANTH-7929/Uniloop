import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/destroy
// @access  Private
router.post('/destroy', protect, async (req, res) => {
    try {
        const { public_id } = req.body;
        
        if (!public_id) {
            return res.status(400).json({ success: false, message: 'Please provide a valid Cloudinary public_id' });
        }

        const result = await cloudinary.uploader.destroy(public_id);
        
        if (result.result === 'ok') {
            return res.status(200).json({ success: true, message: 'Image successfully deleted from Cloudinary' });
        } else {
            return res.status(400).json({ success: false, message: 'Failed to delete image', result });
        }
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting image' });
    }
});

export default router;

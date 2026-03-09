import Category from '../models/Category.js';
import MeetupLocation from '../models/MeetupLocation.js';

// @desc    Get all active categories
// @route   GET /api/directory/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort('name');
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a category
// @route   POST /api/directory/categories
// @access  Private (Admin ideally)
export const createCategory = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const category = await Category.create({ name, description, icon });
        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all active meetup locations
// @route   GET /api/directory/locations
// @access  Public
export const getMeetupLocations = async (req, res) => {
    try {
        const locations = await MeetupLocation.find({ isActive: true }).sort('campus name');
        res.status(200).json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a meetup location
// @route   POST /api/directory/locations
// @access  Private (Admin ideally)
export const createMeetupLocation = async (req, res) => {
    try {
        const { name, campus, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const location = await MeetupLocation.create({ name, campus, description });
        res.status(201).json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

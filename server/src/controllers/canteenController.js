import CanteenItem from "../models/CanteenItem.js";

/**
 * @desc    Get all available canteen items
 * @route   GET /api/dormdash/canteen/items
 * @access  Public (or Private to students)
 */
export const getItems = async (req, res) => {
  try {
    const items = await CanteenItem.find({ available: true });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Add a canteen item
 * @route   POST /api/dormdash/canteen/items
 * @access  Private/Admin
 */
export const addItem = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized as admin" });
    }
    const item = await CanteenItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a canteen item
 * @route   PATCH /api/dormdash/canteen/items/:id
 * @access  Private/Admin
 */
export const updateItem = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized as admin" });
    }
    const item = await CanteenItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a canteen item
 * @route   DELETE /api/dormdash/canteen/items/:id
 * @access  Private/Admin
 */
export const deleteItem = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized as admin" });
    }
    const item = await CanteenItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import CanteenItem from "../src/models/CanteenItem.js";
import Order from "../src/models/Order.js";
import User from "../src/models/User.js";

dotenv.config();

const canteenSeedData = [
  { name: "Chicken Biryani", category: "meal", price: 120, available: true, canteenName: "Main Canteen" },
  { name: "Paneer Butter Masala", category: "meal", price: 100, available: true, canteenName: "Main Canteen" },
  { name: "Veg Fried Rice", category: "meal", price: 80, available: true, canteenName: "Main Canteen" },
  { name: "Egg Noodles", category: "meal", price: 90, available: true, canteenName: "Main Canteen" },
  { name: "South Indian Meals", category: "meal", price: 70, available: true, canteenName: "Main Canteen" },
  { name: "Gobi Manchurian & Rice", category: "meal", price: 95, available: true, canteenName: "Main Canteen" },
  { name: "Chole Bhature", category: "meal", price: 85, available: true, canteenName: "Main Canteen" },
  { name: "Masala Dosa", category: "meal", price: 50, available: true, canteenName: "Main Canteen" },
  { name: "Samosa (2 pcs)", category: "snack", price: 30, available: true, canteenName: "Main Canteen" },
  { name: "Veg Puff", category: "snack", price: 20, available: true, canteenName: "Main Canteen" },
  { name: "Egg Puff", category: "snack", price: 25, available: true, canteenName: "Main Canteen" },
  { name: "French Fries", category: "snack", price: 60, available: true, canteenName: "Main Canteen" },
  { name: "Chicken Roll", category: "snack", price: 70, available: true, canteenName: "Main Canteen" },
  { name: "Vada Pav", category: "snack", price: 25, available: true, canteenName: "Main Canteen" },
  { name: "Cold Coffee", category: "drink", price: 40, available: true, canteenName: "Main Canteen" },
  { name: "Lemon Mint cooler", category: "drink", price: 35, available: true, canteenName: "Main Canteen" },
  { name: "Oreo Shake", category: "drink", price: 60, available: true, canteenName: "Main Canteen" },
  { name: "Fresh Lime Soda", category: "drink", price: 30, available: true, canteenName: "Main Canteen" },
  { name: "Mango Lassi", category: "drink", price: 50, available: true, canteenName: "Main Canteen" },
  { name: "Hot Tea", category: "drink", price: 15, available: true, canteenName: "Main Canteen" },
];

const seedData = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    console.log("Clearing existing CanteenItems...");
    await CanteenItem.deleteMany({});
    
    console.log("Inserting Canteen items...");
    await CanteenItem.insertMany(canteenSeedData);
    
    // Find some existing users to attach to orders
    const users = await User.find().limit(2);
    if (users.length < 2) {
       console.log("Need at least 2 existing users in DB to seed orders.");
       process.exit(0);
    }

    const requester = users[0];
    const dasher = users[1];

    console.log("Clearing all Dorm Dash Orders for clean Slate...");
    await Order.deleteMany({});

    console.log("Inserting 3 Sample Open Orders...");
    await Order.create([
      {
        requester: requester._id,
        items: [{ name: "Chicken Biryani", quantity: 2 }, { name: "Cold Coffee", quantity: 2 }],
        pickupLocation: "Main Canteen",
        dropLocation: "Hostel Block A, Room 101",
        charge: 50,
        status: "open"
      },
      {
        requester: dasher._id, // User 2 requesting
        items: [{ name: "Printout", quantity: 1, note: "Library first floor printer, document attached." }],
        pickupLocation: "Library",
        dropLocation: "Lab Complex, Room 304",
        charge: 30,
        status: "open"
      },
      {
        requester: requester._id,
        items: [{ name: "Samosa", quantity: 5 }],
        pickupLocation: "Main Canteen",
        dropLocation: "Hostel Block B, Room 214",
        charge: 40,
        status: "open"
      }
    ]);

    console.log("Inserting 1 Completed Order (with both reviews omitted here to just show basic delivery, we'll manually emulate review revealed)...");
    
    await Order.create({
      requester: requester._id,
      dasher: dasher._id,
      items: [{ name: "Notebook", quantity: 1 }, { name: "Pen", quantity: 2 }],
      pickupLocation: "Admin Block Stationary",
      dropLocation: "Hostel Block A, Room 101",
      charge: 25,
      status: "delivered",
      otpHash: "dummy-hash",
      reviewsRevealed: true,
      requesterReview: { rating: 5, comment: "Quick delivery!", submitted: true },
      dasherReview: { rating: 5, comment: "Friendly requester.", submitted: true }
    });

    // Award initial badges to users if needed
    if (!requester.dormDash) requester.dormDash = {};
    if (!dasher.dormDash) dasher.dormDash = {};
    
    requester.dormDash.ratings = {
       asRequester: { total: 5, count: 1 },
       asDasher: { total: 0, count: 0 }
    };
    requester.dormDash.ordersCompleted = 1;
    
    dasher.dormDash.ratings = {
       asRequester: { total: 0, count: 0 },
       asDasher: { total: 5, count: 1 }
    };
    dasher.dormDash.ordersCompleted = 1;

    await requester.save();
    await dasher.save();

    console.log("DormDash Seed completed successfully!");
    process.exit();
  } catch (error) {
    console.error("Error with script: ", error);
    process.exit(1);
  }
};

seedData();

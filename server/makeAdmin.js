import mongoose from "mongoose";
import User from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Find the user by the common email domain used for registration (or just grab the first user if there's only one)
        // Feel free to modify the email property to match exactly the user you logged in with!
        const emailToTarget = "nishanth7929@student.annauniv.edu"; // Example stub, if you used a different email, edit this file.

        let user = await User.findOne(); // Grab the first user in the system to make testing easy

        if (!user) {
            console.log("No users found in database to elevate.");
            process.exit(0);
        }

        user.role = "admin";
        await user.save({ validateBeforeSave: false });

        console.log(`✅ Success! Upgraded ${user.email} to Admin.`);
        process.exit(0);

    } catch (error) {
        console.error("Error setting admin status:", error);
        process.exit(1);
    }
};

makeAdmin();

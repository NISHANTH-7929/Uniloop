
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import dns from "dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        const users = await User.find().select('email role').limit(5).lean();
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkUsers();

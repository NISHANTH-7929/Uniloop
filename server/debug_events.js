
import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "./src/models/Event.js";

import dns from "dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

dotenv.config();

const checkEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        const events = await Event.find().select('title organizer').lean();
        console.log(`Found ${events.length} events`);
        events.forEach(ev => console.log(`- ${ev.title} (Organizer: ${ev.organizer})`));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkEvents();

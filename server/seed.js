import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://nishanth7929:Viratkohli%4018@cluster0.aiznjd6.mongodb.net/uniloop"; // From .env

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    icon: String,
    isActive: { type: Boolean, default: true }
});

const meetupLocationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    campus: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: true }
});

const Category = mongoose.model('Category', categorySchema);
const MeetupLocation = mongoose.model('MeetupLocation', meetupLocationSchema);

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB Connected for Seeding.");

        await Category.deleteMany({});
        await MeetupLocation.deleteMany({});

        const categories = [
            { name: "Electronics", description: "Phones, Laptops, Chargers", icon: "laptop" },
            { name: "Books", description: "Course books, novels, notes", icon: "book" },
            { name: "Supplies", description: "Stationery, lab coats, drafters", icon: "pen" },
            { name: "Housing", description: "Mattresses, buckets, brooms", icon: "home" },
            { name: "Services", description: "Tutoring, project help", icon: "briefcase" },
            { name: "Other", description: "Anything else", icon: "box" }
        ];

        const locations = [
            { name: "Main Library Entrance", campus: "North Campus", description: "Right outside the main library doors" },
            { name: "Student Union Cafeteria", campus: "South Campus", description: "Near the coffee shop" },
            { name: "Hostel Block A Gate", campus: "Residential", description: "Main entry gate for Block A" },
            { name: "Campus Center Courtyard", campus: "Main Campus", description: "By the water fountain" }
        ];

        await Category.insertMany(categories);
        console.log("Categories Seeded!");

        await MeetupLocation.insertMany(locations);
        console.log("Locations Seeded!");

        console.log("Seeding complete!");
        process.exit();
    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
};

seedDatabase();

import mongoose from "mongoose";
import dns from "dns";

const connectDB = async () => {
    try{
    
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDb connected failed: ", error.message);
        process.exit(1);
    }
};

export default connectDB;

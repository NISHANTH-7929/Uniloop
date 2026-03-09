import mongoose from "mongoose";
import dns from "dns";

// Override default DNS to use Cloudflare (1.1.1.1) to bypass ISP SRV block
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const connectDB = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDb connected failed: ", error.message);
        process.exit(1);
    }
};

export default connectDB;

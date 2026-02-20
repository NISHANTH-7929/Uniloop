import mongoose from "mongoose";
import dns from "dns";

const connectDB = async () => {
    try{
        // Some environments (Windows, VPNs, DNS blockers) cause Node's DNS
        // resolver to fail SRV lookups for mongodb+srv URIs. If the URI
        // uses the SRV format, set known public DNS servers to avoid
        // "querySrv ECONNREFUSED" errors.
        if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith("mongodb+srv://")) {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
            console.log("Using public DNS servers for SRV resolution: 8.8.8.8,1.1.1.1");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDb connected failed: ", error.message);
        process.exit(1);
    }
};

export default connectDB;

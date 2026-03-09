import dotenv from "dotenv";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import setupCronJobs from "./src/utils/cronJobs.js";

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ["http://localhost:5173", "http://localhost:5174", process.env.CLIENT_URL]
            : "*",
        methods: ["GET", "POST"]
    }
});

// Socket.io logic
io.on("connection", (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("send_message", (data) => {
        // Broadcast message to everyone in the room except the sender
        socket.to(data.conversationId).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected from socket: ${socket.id}`);
    });
});

app.get("/api", (req, res) => {
    res.json({ message: "UniLoop API working!" });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    setupCronJobs();
});

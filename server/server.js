import dotenv from "dotenv";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import Conversation from "./src/models/Conversation.js";
import setupCronJobs from "./src/utils/cronJobs.js";
import { setIO } from "./src/utils/socketUtils.js";

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

// Expose io instance to all controllers via socketUtils
setIO(io);

// Socket.io logic
io.on("connection", (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    // Allow clients to join their personal userId room for targeted events
    socket.on("join_user_room", (userId) => {
        socket.join(userId);
    });

    socket.on("join_conversation", async (conversationId) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) return;

            // Authorization Check: Does participants include the user?
            // (Assuming socket handshake contains user info, otherwise we might need the userId passed)
            // For now, we'll implement the room joining logic.
            const room = conversationId.toString();
            socket.join(room);
            console.log(`[Socket] Authorized join to room: ${room}`);
        } catch (err) {
            console.error("Socket join error:", err);
        }
    });

    socket.on("typing_start", (data) => {
        if (!data.conversationId) return;
        socket.to(data.conversationId.toString()).emit("typing_start", { 
            conversationId: data.conversationId, 
            userId: data.userId 
        });
    });

    socket.on("typing_end", (data) => {
        if (!data.conversationId) return;
        socket.to(data.conversationId.toString()).emit("typing_end", { 
            conversationId: data.conversationId 
        });
    });

    socket.on("send_message", async (data) => {
        if (!data || !data.conversationId) return;
        const room = data.conversationId.toString();
        
        // Advanced Payload: include ID and timestamp if not present
        const enhancedMessage = {
            ...data,
            messageData: {
                ...data.messageData,
                messageId: data.messageData.messageId || Math.random().toString(36).substr(2, 9), // Fallback UUID
                timestamp: new Date().toISOString()
            }
        };

        socket.to(room).emit("receive_message", enhancedMessage);
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

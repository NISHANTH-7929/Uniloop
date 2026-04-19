import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import borrowRoutes from "./routes/borrowRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import communityRoutes from "./routes/community.js";
import dormdashRoutes from "./routes/dormdash.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

// Build allowed origins list — always include localhost for dev/testing
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://novella-mothier-clyde.ngrok-free.dev",
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
};

if (process.env.NODE_ENV === 'production') {
    app.use(cors(corsOptions));
} else {
    app.use(cors({ origin: true, credentials: true }));
}
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Security Middleware
app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 200 : 5000, // Limit each IP per window (higher in dev)
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/directory", directoryRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/dormdash", dormdashRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ message: "UniLoop Backend running..." });
})

export default app;
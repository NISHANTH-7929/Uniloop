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

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.use(cors({
        origin: ["http://localhost:5173", "https://novella-mothier-clyde.ngrok-free.dev", "http://localhost:5174", process.env.CLIENT_URL],
        credentials: true,
    }));
} else {
    // In development allow requests from any origin (useful when accessing via local network IP)
    app.use(cors({
        origin: true,
        credentials: true,
    }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Middleware
app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
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

app.get("/", (req, res) => {
    res.status(200).json({ message: "Uniloop Backend running..." });
})

export default app;
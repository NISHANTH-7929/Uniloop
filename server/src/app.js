import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.use(cors({
        origin: ["http://localhost:5173", "http://localhost:5174", process.env.CLIENT_URL],
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

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ message: "Uniloop Backend running..." });
})

export default app;
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import gymRoutes from "./routes/gym.route.js";
import trainerRoutes from "./routes/trainer.route.js";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Trust Proxy (Crucial for Railway/Health Checks)
app.set('trust proxy', 1);

// 2. Middleware
app.use(express.json());
app.use(cookieParser());

// Helmet config (allowing external scripts/styles if needed)
app.use(helmet({
    contentSecurityPolicy: false, 
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter); // Only limit API routes

// 3. API Routes
app.use("/api/v1/gym", gymRoutes);
app.use("/api/v1/trainers", trainerRoutes);
app.use("/api/v1/auth", authRoutes);

// 4. Static Files & Production Logic (MUST be before app.listen)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.resolve(__dirname, "../frontend/dist");

if (process.env.NODE_ENV === "production") {
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("Server is running... Please use the Frontend Dev Server");
    });
}

// 5. Connect to DB and then Start Server
app.listen(PORT, "0.0.0.0", () => {
    connectDB(); // Now the database actually connects
    console.log(`Server started on port ${PORT}`);
});
// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/uploadRoutes.js";
import { testConnection } from "./config/database.js"; //  Import from your DB config

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: true,
  })
);

// Test DB connection
testConnection(); // 👈 Log DB status

// Routes
app.use("/", uploadRoutes);

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;

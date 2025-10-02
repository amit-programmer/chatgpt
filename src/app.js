const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const chatRoutes = require("./routes/chat.routes");
const authRoutes = require("./routes/auth.routes");

// API routes with proper prefixes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Error handling for 404
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

module.exports = app;
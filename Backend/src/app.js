const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path")

// Routes
const chatRoutes = require("./routes/chat.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

// Enable CORS for the frontend dev server (and allow credentials for cookies)
// Set CLIENT_URL in your .env if your frontend runs on a different origin/port.
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173"; // Vite default
app.use(cors({
    origin: clientOrigin,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));


app.get("*name", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API routes with proper prefixes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Error handling for 404
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

module.exports = app;
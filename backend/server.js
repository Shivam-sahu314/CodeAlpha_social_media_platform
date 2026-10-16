
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const followRoutes = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const captureNotifications = require("./middleware/notificationCapture");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
}

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to CodeAlpha Social Media Platform!"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running successfully"
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);

app.use(captureNotifications);
app.use("/api/notifications", notificationRoutes);

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();


const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createToken = (userId) => {
    return jwt.sign(
        { userId: userId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
};

const register = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Please provide valid registration details"
            });
        }

        const cleanName = name.trim();
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanUsername || !cleanEmail || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (cleanName.length > 60) {
            return res.status(400).json({
                message: "Name must be at most 60 characters"
            });
        }

        if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
            return res.status(400).json({
                message: "Username must be 3-30 characters using letters, numbers or underscores"
            });
        }

        if (
            cleanEmail.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and at most 72 UTF-8 bytes"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: cleanEmail },
                { username: cleanUsername }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or username is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: cleanName,
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword
        });

        const token = createToken(user._id);

        return res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or username is already registered"
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = createToken(user._id);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Login failed"
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error("Profile error:", error.message);

        return res.status(500).json({
            message: "Could not fetch profile"
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};

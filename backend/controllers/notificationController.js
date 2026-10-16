
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [notifications, unreadCount] = await Promise.all([
            Notification.find({
                recipient: userId
            })
                .populate("sender", "name username avatar")
                .populate("post", "content imageUrl")
                .sort({ createdAt: -1 })
                .limit(100)
                .lean(),

            Notification.countDocuments({
                recipient: userId,
                isRead: false
            })
        ]);

        return res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);

        return res.status(500).json({
            message: "Could not fetch notifications"
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.isValidObjectId(notificationId)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                recipient: req.user.userId
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification error:", error.message);

        return res.status(500).json({
            message: "Could not update notification"
        });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.userId,
                isRead: false
            },
            {
                isRead: true
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark all read error:", error.message);

        return res.status(500).json({
            message: "Could not update notifications"
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};

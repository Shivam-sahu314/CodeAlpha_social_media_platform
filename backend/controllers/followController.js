
const mongoose = require("mongoose");
const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification");

const getFollowStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const targetUser = await User.findById(userId)
            .select("_id name username avatar bio");

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const [isFollowing, followersCount, followingCount] =
            await Promise.all([
                Follow.exists({
                    follower: currentUserId,
                    following: userId
                }),
                Follow.countDocuments({ following: userId }),
                Follow.countDocuments({ follower: userId })
            ]);

        return res.status(200).json({
            user: targetUser,
            isFollowing: Boolean(isFollowing),
            followersCount,
            followingCount,
            isMe: String(currentUserId) === String(userId)
        });
    } catch (error) {
        console.error("Get follow status error:", error.message);

        return res.status(500).json({
            message: "Could not fetch follow status"
        });
    }
};

const toggleFollow = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (String(currentUserId) === String(userId)) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const targetUser = await User.findById(userId).select("_id");

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingFollow = await Follow.findOne({
            follower: currentUserId,
            following: userId
        });

        if (existingFollow) {
            await existingFollow.deleteOne();

            const followersCount = await Follow.countDocuments({
                following: userId
            });

            return res.status(200).json({
                message: "User unfollowed successfully",
                isFollowing: false,
                followersCount
            });
        }

        await Follow.create({
            follower: currentUserId,
            following: userId
        });

        // Follow notification main account ke liye create karo.
        try {
            await Notification.create({
                recipient: userId,
                sender: currentUserId,
                type: "follow"
            });
        } catch (notificationError) {
            console.error(
                "Follow notification error:",
                notificationError.message
            );
        }

        const followersCount = await Follow.countDocuments({
            following: userId
        });

        return res.status(200).json({
            message: "User followed successfully",
            isFollowing: true,
            followersCount
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(200).json({
                message: "User is already followed",
                isFollowing: true
            });
        }

        console.error("Toggle follow error:", error.message);

        return res.status(500).json({
            message: "Could not update follow status"
        });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user.userId }
        })
            .select("_id name username avatar bio")
            .sort({ name: 1 })
            .limit(100)
            .lean();

        const userIds = users.map((user) => user._id);

        const follows = await Follow.find({
            follower: req.user.userId,
            following: { $in: userIds }
        })
            .select("following")
            .lean();

        const followedIds = new Set(
            follows.map((follow) => String(follow.following))
        );

        const result = await Promise.all(
            users.map(async (user) => {
                const followersCount = await Follow.countDocuments({
                    following: user._id
                });

                return {
                    ...user,
                    isFollowing: followedIds.has(String(user._id)),
                    followersCount
                };
            })
        );

        return res.status(200).json({ users: result });
    } catch (error) {
        console.error("List users error:", error.message);

        return res.status(500).json({
            message: "Could not fetch users"
        });
    }
};

module.exports = {
    getFollowStatus,
    toggleFollow,
    listUsers
};

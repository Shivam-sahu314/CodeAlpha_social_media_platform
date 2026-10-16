
const mongoose = require("mongoose");
const Like = require("../models/Like");
const Post = require("../models/Post");

const getLikes = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!mongoose.isValidObjectId(postId)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const postExists = await Post.exists({ _id: postId });

        if (!postExists) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const [count, userLike] = await Promise.all([
            Like.countDocuments({ post: postId }),
            Like.findOne({
                post: postId,
                user: req.user.userId
            }).select("_id")
        ]);

        return res.status(200).json({
            count,
            likedByMe: Boolean(userLike)
        });
    } catch (error) {
        console.error("Get likes error:", error.message);

        return res.status(500).json({
            message: "Could not fetch likes"
        });
    }
};

const toggleLike = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!mongoose.isValidObjectId(postId)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const postExists = await Post.exists({ _id: postId });

        if (!postExists) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const existingLike = await Like.findOne({
            post: postId,
            user: req.user.userId
        });

        if (existingLike) {
            await existingLike.deleteOne();

            const count = await Like.countDocuments({
                post: postId
            });

            return res.status(200).json({
                message: "Like removed",
                likedByMe: false,
                count
            });
        }

        try {
            await Like.create({
                post: postId,
                user: req.user.userId
            });
        } catch (error) {
            if (error.code !== 11000) {
                throw error;
            }
        }

        const count = await Like.countDocuments({
            post: postId
        });

        return res.status(200).json({
            message: "Post liked",
            likedByMe: true,
            count
        });
    } catch (error) {
        console.error("Toggle like error:", error.message);

        return res.status(500).json({
            message: "Could not update like"
        });
    }
};

module.exports = {
    getLikes,
    toggleLike
};


const mongoose = require("mongoose");
const Post = require("../models/Post");

const createPost = async (req, res) => {
    try {
        const { content, imageUrl } = req.body;

        if (content !== undefined && typeof content !== "string") {
            return res.status(400).json({
                message: "Post content must be text"
            });
        }

        if (imageUrl !== undefined && typeof imageUrl !== "string") {
            return res.status(400).json({
                message: "Image URL must be text"
            });
        }

        const cleanContent = (content || "").trim();
        const cleanImageUrl = (imageUrl || "").trim();

        if (cleanContent.length > 2000) {
            return res.status(400).json({
                message: "Post cannot exceed 2000 characters"
            });
        }

        if (!cleanContent && !cleanImageUrl) {
            return res.status(400).json({
                message: "Write something or add an image URL"
            });
        }

        if (cleanImageUrl) {
            try {
                const parsedUrl = new URL(cleanImageUrl);

                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    throw new Error("Invalid protocol");
                }
            } catch {
                return res.status(400).json({
                    message: "Please provide a valid HTTP or HTTPS image URL"
                });
            }
        }

        const post = await Post.create({
            author: req.user.userId,
            content: cleanContent,
            imageUrl: cleanImageUrl
        });

        await post.populate("author", "name username avatar");

        return res.status(201).json({
            message: "Post created successfully",
            post
        });
    } catch (error) {
        console.error("Create post error:", error.message);

        return res.status(500).json({
            message: "Could not create post"
        });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "name username avatar")
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({
            count: posts.length,
            posts
        });
    } catch (error) {
        console.error("Get posts error:", error.message);

        return res.status(500).json({
            message: "Could not fetch posts"
        });
    }
};

const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            author: req.user.userId
        })
            .populate("author", "name username avatar")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: posts.length,
            posts
        });
    } catch (error) {
        console.error("Get my posts error:", error.message);

        return res.status(500).json({
            message: "Could not fetch your posts"
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (String(post.author) !== String(req.user.userId)) {
            return res.status(403).json({
                message: "You can only delete your own posts"
            });
        }

        await post.deleteOne();

        return res.status(200).json({
            message: "Post deleted successfully"
        });
    } catch (error) {
        console.error("Delete post error:", error.message);

        return res.status(500).json({
            message: "Could not delete post"
        });
    }
};

module.exports = {
    createPost,
    getPosts,
    getMyPosts,
    deletePost
};

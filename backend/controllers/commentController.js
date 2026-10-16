
const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

const getComments = async (req, res) => {
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

        const comments = await Comment.find({ post: postId })
            .populate("author", "name username avatar")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            count: comments.length,
            comments
        });
    } catch (error) {
        console.error("Get comments error:", error.message);

        return res.status(500).json({
            message: "Could not fetch comments"
        });
    }
};

const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        if (!mongoose.isValidObjectId(postId)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        if (text.trim().length > 1000) {
            return res.status(400).json({
                message: "Comment cannot exceed 1000 characters"
            });
        }

        const postExists = await Post.exists({ _id: postId });

        if (!postExists) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const comment = await Comment.create({
            post: postId,
            author: req.user.userId,
            text: text.trim()
        });

        await comment.populate("author", "name username avatar");

        return res.status(201).json({
            message: "Comment added successfully",
            comment
        });
    } catch (error) {
        console.error("Create comment error:", error.message);

        return res.status(500).json({
            message: "Could not add comment"
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!mongoose.isValidObjectId(commentId)) {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.author.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You can only delete your own comments"
            });
        }

        await comment.deleteOne();

        return res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Delete comment error:", error.message);

        return res.status(500).json({
            message: "Could not delete comment"
        });
    }
};

module.exports = {
    getComments,
    createComment,
    deleteComment
};

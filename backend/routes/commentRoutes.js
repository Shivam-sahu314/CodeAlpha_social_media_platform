
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    getComments,
    createComment,
    deleteComment
} = require("../controllers/commentController");

const router = express.Router();

router.use(protect);

router.get("/post/:postId", getComments);
router.post("/post/:postId", createComment);
router.delete("/:commentId", deleteComment);

module.exports = router;

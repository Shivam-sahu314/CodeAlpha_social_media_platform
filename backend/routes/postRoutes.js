
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    createPost,
    getPosts,
    getMyPosts,
    deletePost
} = require("../controllers/postController");

const router = express.Router();

router.use(protect);

router.get("/", getPosts);
router.get("/mine", getMyPosts);
router.post("/", createPost);
router.delete("/:id", deletePost);

module.exports = router;

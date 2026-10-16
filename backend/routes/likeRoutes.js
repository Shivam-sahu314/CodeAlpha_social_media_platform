
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    getLikes,
    toggleLike
} = require("../controllers/likeController");

const router = express.Router();

router.use(protect);

router.get("/:postId", getLikes);
router.post("/:postId", toggleLike);

module.exports = router;

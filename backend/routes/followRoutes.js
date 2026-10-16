
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    getFollowStatus,
    toggleFollow,
    listUsers
} = require("../controllers/followController");

const router = express.Router();

router.use(protect);

router.get("/", listUsers);
router.get("/:userId", getFollowStatus);
router.post("/:userId", toggleFollow);

module.exports = router;

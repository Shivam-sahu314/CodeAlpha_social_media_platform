
const Notification = require("../models/Notification");
const Post = require("../models/Post");

const captureNotifications = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        const result = originalJson(body);

        const path = req.originalUrl.split("?")[0];
        const method = req.method;
        const actorId = req.user?.userId;

        if (!actorId || res.statusCode >= 400) {
            return result;
        }

        const createNotification = async (
            recipientId,
            type,
            postId = null
        ) => {
            if (
                !recipientId ||
                String(recipientId) === String(actorId)
            ) {
                return;
            }

            await Notification.create({
                recipient: recipientId,
                sender: actorId,
                type,
                post: postId
            });
        };

        const processNotification = async () => {
            try {
                if (
                    method === "POST" &&
                    path.startsWith("/api/follows/") &&
                    body?.isFollowing === true
                ) {
                    const recipientId = path
                        .split("/")
                        .filter(Boolean)[2];

                    await createNotification(
                        recipientId,
                        "follow"
                    );

                    return;
                }

                if (
                    method === "POST" &&
                    path.startsWith("/api/likes/") &&
                    body?.likedByMe === true
                ) {
                    const postId = path
                        .split("/")
                        .filter(Boolean)[2];

                    const post = await Post.findById(postId)
                        .select("author");

                    if (post) {
                        await createNotification(
                            post.author,
                            "like",
                            post._id
                        );
                    }

                    return;
                }

                if (
                    method === "POST" &&
                    /^\/api\/comments\/post\/[^/]+$/.test(path)
                ) {
                    const postId = path
                        .split("/")
                        .filter(Boolean)[3];

                    const post = await Post.findById(postId)
                        .select("author");

                    if (post) {
                        await createNotification(
                            post.author,
                            "comment",
                            post._id
                        );
                    }
                }
            } catch (error) {
                console.error(
                    "Notification creation error:",
                    error.message
                );
            }
        };

        void processNotification();

        return result;
    };

    next();
};

module.exports = captureNotifications;


const AUTH_API = "http://localhost:3000/api/auth";
const FOLLOW_API = "http://localhost:3000/api/follows";
const POSTS_API = "http://localhost:3000/api/posts";

const token = localStorage.getItem("token");

const profileMessage = document.getElementById("profileMessage");
const postsCountElement = document.getElementById("postsCount");
const followersCountElement = document.getElementById("followersCount");
const followingCountElement = document.getElementById("followingCount");
const myPostsContainer = document.getElementById("myPostsContainer");
const myPostsMessage = document.getElementById("myPostsMessage");
const profileNote = document.getElementById("profileNote");

const profileRequest = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
};

const showProfileMessage = (message, type = "error") => {
    profileMessage.textContent = message;
    profileMessage.className = `message ${type}`;
};

const showPostsMessage = (message, type = "success") => {
    myPostsMessage.textContent = message;
    myPostsMessage.className = `message ${type}`;
};

const formatPostDate = (dateString) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

const createMyPostCard = (post, currentUserId) => {
    const card = document.createElement("article");
    card.className = "post-card";

    const header = document.createElement("div");
    header.className = "post-card-header";

    const author = document.createElement("div");
    author.className = "post-author";

    const avatar = document.createElement("div");
    avatar.className = "post-avatar";

    if (post.author?.avatar) {
        const avatarImage = document.createElement("img");
        avatarImage.src = post.author.avatar;
        avatarImage.alt = "";
        avatarImage.style.width = "100%";
        avatarImage.style.height = "100%";
        avatarImage.style.objectFit = "cover";
        avatarImage.referrerPolicy = "no-referrer";

        avatarImage.onerror = () => {
            avatar.textContent = (post.author?.name || "U")
                .charAt(0)
                .toUpperCase();
        };

        avatar.appendChild(avatarImage);
    } else {
        avatar.textContent = (post.author?.name || "U")
            .charAt(0)
            .toUpperCase();
    }

    const authorInfo = document.createElement("div");
    authorInfo.className = "post-author-info";

    const name = document.createElement("strong");
    name.textContent = post.author?.name || "You";

    const username = document.createElement("p");
    username.textContent = `@${post.author?.username || "unknown"}`;

    authorInfo.append(name, username);
    author.append(avatar, authorInfo);

    const date = document.createElement("time");
    date.className = "post-time";
    date.dateTime = post.createdAt || "";
    date.textContent = formatPostDate(post.createdAt);

    header.append(author, date);
    card.appendChild(header);

    if (post.content) {
        const content = document.createElement("p");
        content.className = "post-content";
        content.textContent = post.content;
        card.appendChild(content);
    }

    if (post.imageUrl) {
        const image = document.createElement("img");
        image.className = "post-image";
        image.src = post.imageUrl;
        image.alt = "Post attachment";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.onerror = () => image.remove();

        card.appendChild(image);
    }

    const authorId = post.author?._id || post.author?.id;

    if (String(authorId) === String(currentUserId)) {
        const actions = document.createElement("div");
        actions.className = "post-actions";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-post-btn";
        deleteButton.textContent = "Delete post";

        deleteButton.addEventListener("click", async () => {
            if (!window.confirm("Are you sure you want to delete this post?")) {
                return;
            }

            deleteButton.disabled = true;
            deleteButton.textContent = "Deleting...";

            try {
                await profileRequest(`${POSTS_API}/${post._id}`, {
                    method: "DELETE"
                });

                await loadMyPosts(currentUserId);
                showProfileMessage("Post deleted successfully.", "success");
            } catch (error) {
                showPostsMessage(error.message, "error");
                deleteButton.disabled = false;
                deleteButton.textContent = "Delete post";
            }
        });

        actions.appendChild(deleteButton);
        card.appendChild(actions);
    }

    return card;
};

const loadMyPosts = async (currentUserId) => {
    myPostsContainer.replaceChildren();
    showPostsMessage("Loading your posts...");

    try {
        const data = await profileRequest(`${POSTS_API}/mine`);
        const posts = data.posts || [];

        postsCountElement.textContent = data.count ?? posts.length;

        if (profileNote) {
            profileNote.style.display = posts.length === 0 ? "" : "none";
        }

        if (posts.length === 0) {
            showPostsMessage("You haven't published any posts yet.", "success");
            return;
        }

        const fragment = document.createDocumentFragment();

        posts.forEach((post) => {
            fragment.appendChild(createMyPostCard(post, currentUserId));
        });

        myPostsContainer.appendChild(fragment);
        showPostsMessage(`${posts.length} of your posts loaded.`, "success");
    } catch (error) {
        postsCountElement.textContent = "—";
        showPostsMessage(error.message, "error");
        console.error("Load my posts error:", error);
    }
};

const loadProfile = async () => {
    if (!token) {
        window.location.replace("login.html");
        return;
    }

    try {
        const profileData = await profileRequest(`${AUTH_API}/me`);
        const user = profileData.user;

        const userId = user?._id || user?.id;

        if (!userId) {
            throw new Error("User ID profile response mein nahi mili.");
        }

        const followData = await profileRequest(
            `${FOLLOW_API}/${encodeURIComponent(userId)}`
        );

        followersCountElement.textContent = followData.followersCount ?? 0;
        followingCountElement.textContent = followData.followingCount ?? 0;

        await loadMyPosts(userId);
    } catch (error) {
        followersCountElement.textContent = "—";
        followingCountElement.textContent = "—";
        postsCountElement.textContent = "—";

        showProfileMessage(error.message, "error");
        showPostsMessage("Could not load your posts.", "error");

        console.error("Profile loading error:", error);
    }
};

loadProfile();


const POSTS_API = "http://localhost:3000/api/posts";
const AUTH_API = "http://localhost:3000/api/auth";
const COMMENTS_API = "http://localhost:3000/api/comments";
const LIKES_API = "http://localhost:3000/api/likes";

const token = localStorage.getItem("token");

const postsContainer = document.getElementById("postsContainer");
const postForm = document.getElementById("postForm");
const postContent = document.getElementById("postContent");
const postImageUrl = document.getElementById("postImageUrl");
const postMessage = document.getElementById("postMessage");
const feedMessage = document.getElementById("feedMessage");
const charCount = document.getElementById("charCount");
const publishBtn = document.getElementById("publishBtn");

const showMessage = (element, message, type = "error") => {
    element.textContent = message;
    element.className = `message ${type}`;
};

const apiRequest = async (url, options = {}) => {
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
        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("login.html");
        }

        throw new Error(data.message || "Request failed");
    }

    return data;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

const createAvatar = (user, className) => {
    const avatar = document.createElement("div");
    avatar.className = className;

    if (user.avatar) {
        const image = document.createElement("img");
        image.src = user.avatar;
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";

        image.onerror = () => {
            avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
        };

        avatar.appendChild(image);
    } else {
        avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }

    return avatar;
};

const createLikeSection = (post) => {
    const section = document.createElement("div");
    section.className = "like-section";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "like-btn";
    button.textContent = "♡ Like";
    button.disabled = true;
    button.setAttribute("aria-pressed", "false");

    const count = document.createElement("span");
    count.className = "like-count";
    count.textContent = "Loading likes...";

    button.addEventListener("click", async () => {
        button.disabled = true;

        try {
            const data = await apiRequest(`${LIKES_API}/${post._id}`, {
                method: "POST"
            });

            button.dataset.liked = String(data.likedByMe);
            button.setAttribute("aria-pressed", String(data.likedByMe));
            button.textContent = data.likedByMe ? "♥ Liked" : "♡ Like";
            button.classList.toggle("is-liked", data.likedByMe);

            count.textContent = `${data.count} ${
                data.count === 1 ? "like" : "likes"
            }`;
        } catch (error) {
            window.alert(error.message);
        } finally {
            button.disabled = false;
        }
    });

    section.append(button, count);

    const loadLikeStatus = async () => {
        try {
            const data = await apiRequest(`${LIKES_API}/${post._id}`);

            button.dataset.liked = String(data.likedByMe);
            button.setAttribute("aria-pressed", String(data.likedByMe));
            button.textContent = data.likedByMe ? "♥ Liked" : "♡ Like";
            button.classList.toggle("is-liked", data.likedByMe);

            count.textContent = `${data.count} ${
                data.count === 1 ? "like" : "likes"
            }`;
        } catch (error) {
            count.textContent = "Likes unavailable";
            console.error("Load likes error:", error.message);
        } finally {
            button.disabled = false;
        }
    };

    loadLikeStatus();

    return section;
};

const createCommentItem = (comment, currentUserId, postId) => {
    const item = document.createElement("div");
    item.className = "comment-item";

    const avatar = createAvatar(
        comment.author || { name: "U" },
        "comment-avatar"
    );

    const body = document.createElement("div");
    body.className = "comment-body";

    const top = document.createElement("div");
    top.className = "comment-top";

    const authorInfo = document.createElement("div");
    authorInfo.className = "comment-author-info";

    const name = document.createElement("strong");
    name.textContent = comment.author?.name || "Unknown user";

    const username = document.createElement("span");
    username.textContent = `@${comment.author?.username || "unknown"}`;

    authorInfo.append(name, username);

    const date = document.createElement("time");
    date.className = "comment-date";
    date.dateTime = comment.createdAt || "";
    date.textContent = formatDate(comment.createdAt);

    top.append(authorInfo, date);

    const text = document.createElement("p");
    text.className = "comment-text";
    text.textContent = comment.text;

    body.append(top, text);
    item.append(avatar, body);

    if (
        comment.author &&
        String(comment.author._id) === String(currentUserId)
    ) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-comment-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            if (!window.confirm("Delete this comment?")) {
                return;
            }

            deleteButton.disabled = true;

            try {
                await apiRequest(`${COMMENTS_API}/${comment._id}`, {
                    method: "DELETE"
                });

                await loadComments(postId, currentUserId);
            } catch (error) {
                window.alert(error.message);
                deleteButton.disabled = false;
            }
        });

        item.appendChild(deleteButton);
    }

    return item;
};

const loadComments = async (postId, currentUserId) => {
    const commentsContainer = document.getElementById(`comments-${postId}`);
    const countLabel = document.getElementById(`comment-count-${postId}`);

    if (!commentsContainer || !countLabel) {
        return;
    }

    commentsContainer.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "comments-loading";
    loading.textContent = "Loading comments...";
    commentsContainer.appendChild(loading);

    try {
        const data = await apiRequest(`${COMMENTS_API}/post/${postId}`);
        const comments = data.comments || [];

        countLabel.textContent = `${comments.length} ${
            comments.length === 1 ? "comment" : "comments"
        }`;

        commentsContainer.replaceChildren();

        if (comments.length === 0) {
            const empty = document.createElement("p");
            empty.className = "no-comments";
            empty.textContent = "No comments yet. Start the conversation!";
            commentsContainer.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();

        comments.forEach((comment) => {
            fragment.appendChild(
                createCommentItem(comment, currentUserId, postId)
            );
        });

        commentsContainer.appendChild(fragment);
    } catch (error) {
        commentsContainer.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "comments-error";
        errorMessage.textContent = error.message;

        commentsContainer.appendChild(errorMessage);
    }
};

const createCommentSection = (post, currentUserId) => {
    const section = document.createElement("section");
    section.className = "comments-section";

    const heading = document.createElement("div");
    heading.className = "comments-heading";

    const title = document.createElement("h3");
    title.textContent = "Comments";

    const count = document.createElement("span");
    count.id = `comment-count-${post._id}`;
    count.textContent = "Loading...";

    heading.append(title, count);

    const list = document.createElement("div");
    list.className = "comments-list";
    list.id = `comments-${post._id}`;

    const form = document.createElement("form");
    form.className = "comment-form";

    const input = document.createElement("textarea");
    input.className = "comment-input";
    input.placeholder = "Write a comment...";
    input.maxLength = 1000;
    input.rows = 2;
    input.required = true;
    input.setAttribute("aria-label", "Write a comment");

    const bottom = document.createElement("div");
    bottom.className = "comment-form-bottom";

    const charCount = document.createElement("span");
    charCount.className = "comment-char-count";
    charCount.textContent = "0 / 1000";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "comment-submit-btn";
    submit.textContent = "Comment";

    input.addEventListener("input", () => {
        charCount.textContent = `${input.value.length} / 1000`;
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const text = input.value.trim();

        if (!text) {
            input.focus();
            return;
        }

        submit.disabled = true;
        submit.textContent = "Sending...";

        try {
            await apiRequest(`${COMMENTS_API}/post/${post._id}`, {
                method: "POST",
                body: JSON.stringify({ text })
            });

            input.value = "";
            charCount.textContent = "0 / 1000";

            await loadComments(post._id, currentUserId);
        } catch (error) {
            window.alert(error.message);
        } finally {
            submit.disabled = false;
            submit.textContent = "Comment";
        }
    });

    bottom.append(charCount, submit);
    form.append(input, bottom);
    section.append(heading, list, form);

    return section;
};

const createPostCard = (post, currentUserId) => {
    const card = document.createElement("article");
    card.className = "post-card";

    const header = document.createElement("div");
    header.className = "post-card-header";

    const author = document.createElement("div");
    author.className = "post-author";

    const authorInfo = document.createElement("div");
    authorInfo.className = "post-author-info";

    const authorName = document.createElement("strong");
    authorName.textContent = post.author?.name || "Unknown user";

    const username = document.createElement("p");
    username.textContent = `@${post.author?.username || "unknown"}`;

    authorInfo.append(authorName, username);

    author.append(
        createAvatar(post.author || { name: "U" }, "post-avatar"),
        authorInfo
    );

    const date = document.createElement("time");
    date.className = "post-time";
    date.dateTime = post.createdAt || "";
    date.textContent = formatDate(post.createdAt);

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

    const actions = document.createElement("div");
    actions.className = "post-actions";

    if (
        post.author &&
        String(post.author._id) === String(currentUserId)
    ) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-post-btn";
        deleteButton.textContent = "Delete post";

        deleteButton.addEventListener("click", async () => {
            if (!window.confirm("Are you sure you want to delete this post?")) {
                return;
            }

            deleteButton.disabled = true;

            try {
                await apiRequest(`${POSTS_API}/${post._id}`, {
                    method: "DELETE"
                });

                await loadPosts();
                showMessage(feedMessage, "Post deleted successfully.", "success");
            } catch (error) {
                showMessage(feedMessage, error.message);
                deleteButton.disabled = false;
            }
        });

        actions.appendChild(deleteButton);
    }

    if (actions.children.length > 0) {
        card.appendChild(actions);
    }

    card.appendChild(createLikeSection(post));
    card.appendChild(createCommentSection(post, currentUserId));

    return card;
};

const loadPosts = async () => {
    postsContainer.replaceChildren();
    showMessage(feedMessage, "Loading posts...", "success");

    try {
        const [postsData, profileData] = await Promise.all([
            apiRequest(POSTS_API),
            apiRequest(`${AUTH_API}/me`)
        ]);

        const currentUser = profileData.user;

        document.getElementById("composerName").textContent =
            `Posting as ${currentUser.name}`;

        const composerAvatar = document.getElementById("composerAvatar");

        composerAvatar.replaceWith(
            createAvatar(currentUser, "composer-avatar")
        );

        const posts = postsData.posts || [];

        if (posts.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-feed";
            empty.textContent =
                "No posts yet. Be the first to share something with the community!";

            postsContainer.appendChild(empty);
            showMessage(feedMessage, "");
            return;
        }

        const fragment = document.createDocumentFragment();

        posts.forEach((post) => {
            fragment.appendChild(createPostCard(post, currentUser.id));
        });

        postsContainer.appendChild(fragment);
        showMessage(feedMessage, `${posts.length} posts loaded.`, "success");

        posts.forEach((post) => {
            loadComments(post._id, currentUser.id);
        });
    } catch (error) {
        showMessage(feedMessage, error.message);
    }
};

postContent.addEventListener("input", () => {
    charCount.textContent = `${postContent.value.length} / 2000`;
});

postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = postContent.value.trim();
    const imageUrl = postImageUrl.value.trim();

    if (!content && !imageUrl) {
        showMessage(postMessage, "Write something or add an image URL.");
        return;
    }

    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";
    showMessage(postMessage, "");

    try {
        await apiRequest(POSTS_API, {
            method: "POST",
            body: JSON.stringify({ content, imageUrl })
        });

        postForm.reset();
        charCount.textContent = "0 / 2000";

        showMessage(postMessage, "Your post has been published!", "success");
        await loadPosts();
    } catch (error) {
        showMessage(postMessage, error.message);
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = "Publish post →";
    }
});

document.getElementById("refreshBtn").addEventListener("click", loadPosts);

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

if (!token) {
    window.location.replace("login.html");
} else {
    loadPosts();
}

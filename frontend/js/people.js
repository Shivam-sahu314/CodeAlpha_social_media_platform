
const API_URL = "http://localhost:3000/api/follows";
const AUTH_URL = "http://localhost:3000/api/auth";

const token = localStorage.getItem("token");
const container = document.getElementById("peopleContainer");
const message = document.getElementById("peopleMessage");

const showMessage = (text, type = "success") => {
    message.textContent = text;
    message.className = `message ${type}`;
};

const request = async (url, options = {}) => {
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

const createPersonCard = (user) => {
    const card = document.createElement("article");
    card.className = "person-card";

    const avatar = document.createElement("div");
    avatar.className = "person-avatar";

    if (user.avatar) {
        const image = document.createElement("img");
        image.src = user.avatar;
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        image.onerror = () => {
            avatar.replaceChildren();
            avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
        };
        avatar.appendChild(image);
    } else {
        avatar.textContent = (user.name || "U").charAt(0).toUpperCase();
    }

    const name = document.createElement("h2");
    name.textContent = user.name || "Unknown user";

    const username = document.createElement("p");
    username.className = "person-username";
    username.textContent = `@${user.username || "unknown"}`;

    const bio = document.createElement("p");
    bio.className = "person-bio";
    bio.textContent = user.bio || "Welcome to the community!";

    const followers = document.createElement("p");
    followers.className = "person-followers";
    followers.textContent =
        `${user.followersCount || 0} followers`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = user.isFollowing
        ? "person-follow-btn following"
        : "person-follow-btn";
    button.textContent = user.isFollowing ? "Following" : "Follow";

    button.addEventListener("click", async () => {
        button.disabled = true;
        const wasFollowing = user.isFollowing;
        button.textContent = wasFollowing ? "Unfollowing..." : "Following...";

        try {
            const data = await request(`${API_URL}/${user._id}`, {
                method: "POST"
            });

            user.isFollowing = data.isFollowing;
            user.followersCount = data.followersCount;

            followers.textContent = `${user.followersCount} followers`;
            button.textContent = user.isFollowing ? "Following" : "Follow";
            button.classList.toggle("following", user.isFollowing);

            showMessage(data.message);
        } catch (error) {
            button.textContent = wasFollowing ? "Following" : "Follow";
            showMessage(error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    card.append(avatar, name, username, bio, followers, button);
    return card;
};

const loadPeople = async () => {
    container.replaceChildren();

    try {
        const data = await request(API_URL);
        const users = data.users || [];

        if (users.length === 0) {
            const empty = document.createElement("p");
            empty.textContent =
                "No other users found. Register another account to test following.";
            container.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();

        users.forEach((user) => {
            fragment.appendChild(createPersonCard(user));
        });

        container.appendChild(fragment);
        showMessage(`${users.length} people found.`);
    } catch (error) {
        showMessage(error.message, "error");
    }
};

document.getElementById("peopleLogoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

if (!token) {
    window.location.replace("login.html");
} else {
    loadPeople();
}

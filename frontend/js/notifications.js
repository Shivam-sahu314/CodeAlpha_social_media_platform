
const API_URL = "http://localhost:3000/api/notifications";
const token = localStorage.getItem("token");

const list = document.getElementById("notificationList");
const unreadCount = document.getElementById("unreadCount");
const message = document.getElementById("notificationMessage");
const markAllBtn = document.getElementById("markAllReadBtn");

const showMessage = (text, type = "success") => {
    message.textContent = text;
    message.className = `message ${type}`;
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

const notificationText = (notification) => {
    const name = notification.sender?.name || "Someone";

    if (notification.type === "follow") {
        return `${name} started following you.`;
    }

    if (notification.type === "like") {
        return `${name} liked your post.`;
    }

    if (notification.type === "comment") {
        return `${name} commented on your post.`;
    }

    return `${name} interacted with you.`;
};

const createNotificationItem = (notification) => {
    const item = document.createElement("article");
    item.className = "notification-item";

    if (!notification.isRead) {
        item.classList.add("unread");
    }

    const avatar = document.createElement("div");
    avatar.className = "notification-avatar";

    const sender = notification.sender || { name: "U" };

    if (sender.avatar) {
        const image = document.createElement("img");
        image.src = sender.avatar;
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        image.onerror = () => {
            avatar.replaceChildren();
            avatar.textContent = (sender.name || "U")
                .charAt(0)
                .toUpperCase();
        };
        avatar.appendChild(image);
    } else {
        avatar.textContent = (sender.name || "U")
            .charAt(0)
            .toUpperCase();
    }

    const content = document.createElement("div");
    content.className = "notification-content";

    const text = document.createElement("p");
    text.textContent = notificationText(notification);

    const time = document.createElement("time");
    time.className = "notification-time";
    time.dateTime = notification.createdAt || "";
    time.textContent = formatDate(notification.createdAt);

    content.append(text, time);
    item.append(avatar, content);

    if (!notification.isRead) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "notification-read-btn";
        button.textContent = "Mark read";

        button.addEventListener("click", async () => {
            button.disabled = true;

            try {
                await apiRequest(
                    `${API_URL}/${notification._id}/read`,
                    { method: "PATCH" }
                );

                notification.isRead = true;
                item.classList.remove("unread");
                button.remove();

                await loadNotifications();
                showMessage("Notification marked as read.");
            } catch (error) {
                button.disabled = false;
                showMessage(error.message, "error");
            }
        });

        item.appendChild(button);
    }

    return item;
};

const loadNotifications = async () => {
    list.replaceChildren();
    unreadCount.textContent = "Loading...";

    try {
        const data = await apiRequest(API_URL);
        const notifications = data.notifications || [];

        unreadCount.textContent =
            `${data.unreadCount || 0} unread notifications`;

        if (notifications.length === 0) {
            const empty = document.createElement("div");
            empty.className = "notification-empty";
            empty.textContent = "You're all caught up. No notifications yet.";
            list.appendChild(empty);
            markAllBtn.disabled = true;
            return;
        }

        markAllBtn.disabled = (data.unreadCount || 0) === 0;

        const fragment = document.createDocumentFragment();

        notifications.forEach((notification) => {
            fragment.appendChild(createNotificationItem(notification));
        });

        list.appendChild(fragment);
    } catch (error) {
        unreadCount.textContent = "Could not load notifications";
        showMessage(error.message, "error");
    }
};

markAllBtn.addEventListener("click", async () => {
    markAllBtn.disabled = true;

    try {
        const data = await apiRequest(`${API_URL}/read-all`, {
            method: "PATCH"
        });

        showMessage(data.message);
        await loadNotifications();
    } catch (error) {
        showMessage(error.message, "error");
        markAllBtn.disabled = false;
    }
});

document.getElementById("notificationLogoutBtn")
    .addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });

if (!token) {
    window.location.replace("login.html");
} else {
    loadNotifications();
}


const notificationToken = localStorage.getItem("token");
const notificationBadge = document.getElementById("notificationBadge");

const updateNotificationBadge = async () => {
    if (!notificationToken || !notificationBadge) {
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:3000/api/notifications",
            {
                headers: {
                    Authorization: `Bearer ${notificationToken}`
                }
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const count = data.unreadCount || 0;

        notificationBadge.textContent = count > 0 ? `(${count})` : "";
    } catch (error) {
        console.error("Notification badge error:", error.message);
    }
};

updateNotificationBadge();

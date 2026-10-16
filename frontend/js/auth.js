
const API_URL = "http://localhost:3000/api/auth";

const showMessage = (element, message, type = "error") => {
    element.textContent = message;
    element.className = `message ${type}`;
};

const getStoredToken = () => localStorage.getItem("token");

const saveSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
};

const requestAPI = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
};

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("message");
        const button = registerForm.querySelector('button[type="submit"]');

        const name = document.getElementById("name").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        button.disabled = true;
        button.textContent = "Creating account...";
        showMessage(message, "");

        try {
            const data = await requestAPI(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    password
                })
            });

            saveSession(data);
            showMessage(message, "Account created! Redirecting...", "success");

            window.location.href = "profile.html";
        } catch (error) {
            showMessage(message, error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Create account →";
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("message");
        const button = loginForm.querySelector('button[type="submit"]');

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        button.disabled = true;
        button.textContent = "Logging in...";
        showMessage(message, "");

        try {
            const data = await requestAPI(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            saveSession(data);
            showMessage(message, "Login successful! Redirecting...", "success");

            window.location.href = "profile.html";
        } catch (error) {
            showMessage(message, error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Log in →";
        }
    });
}

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}

const profileName = document.getElementById("profileName");

if (profileName) {
    const token = getStoredToken();

    if (!token) {
        window.location.replace("login.html");
    } else {
        const loadProfile = async () => {
            const message = document.getElementById("profileMessage");

            try {
                const data = await requestAPI(`${API_URL}/me`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const user = data.user;

                profileName.textContent = user.name;
                document.getElementById("profileUsername").textContent =
                    `@${user.username}`;
                document.getElementById("profileEmail").textContent =
                    user.email;
                document.getElementById("profileBio").textContent =
                    user.bio || "No bio added yet.";

                const avatar = document.getElementById("avatar");

                if (user.avatar) {
                    const image = document.createElement("img");
                    image.src = user.avatar;
                    image.alt = `${user.name}'s avatar`;
                    image.referrerPolicy = "no-referrer";
                    image.style.width = "100%";
                    image.style.height = "100%";
                    image.style.objectFit = "cover";
                    image.style.borderRadius = "50%";
                    avatar.replaceChildren(image);
                } else {
                    avatar.textContent = user.name.charAt(0).toUpperCase();
                }

                localStorage.setItem("user", JSON.stringify(user));
                showMessage(message, "Profile loaded successfully.", "success");
            } catch (error) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.replace("login.html");
            }
        };

        loadProfile();
    }
}

const AUTH_TOKEN_KEY = "vexa_auth_token";
const ACCOUNT_STORAGE_KEY = "vexa_account";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const usernameForm = document.getElementById("usernameForm");
const profileCard = document.getElementById("profileCard");
const profileInfo = document.getElementById("profileInfo");
const authStatus = document.getElementById("authStatus");
const updateUsername = document.getElementById("updateUsername");
const logoutBtn = document.getElementById("logoutBtn");

const setStatus = (message, isError = false) => {
  if (!authStatus) {
    return;
  }
  authStatus.textContent = message;
  authStatus.classList.toggle("error", Boolean(isError));
};

const getToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
};

const saveSession = ({ token, account }) => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } catch (error) {
    console.warn("Unable to persist session.", error);
  }
};

const clearSession = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to clear session.", error);
  }
};

const renderProfile = (account) => {
  if (!account) {
    if (profileCard) {
      profileCard.hidden = true;
    }
    return;
  }

  if (profileCard) {
    profileCard.hidden = false;
  }
  if (profileInfo) {
    profileInfo.textContent = `Email: ${account.email}`;
  }
  if (updateUsername) {
    updateUsername.value = account.username || "";
  }
};

const apiRequest = async (url, options = {}) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
};

const loadMe = async () => {
  try {
    const token = getToken();
    if (!token) {
      renderProfile(null);
      return;
    }
    const data = await apiRequest("/api/auth/me", { method: "GET" });
    saveSession({ token, account: data.account });
    renderProfile(data.account);
  } catch (error) {
    clearSession();
    renderProfile(null);
  }
};

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("registerEmail")?.value?.trim();
  const username = document.getElementById("registerUsername")?.value?.trim();
  try {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username }),
    });
    saveSession(data);
    renderProfile(data.account);
    setStatus("Account created successfully.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail")?.value?.trim();
  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    saveSession(data);
    renderProfile(data.account);
    setStatus("Logged in successfully.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

usernameForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = updateUsername?.value?.trim();
  try {
    const data = await apiRequest("/api/auth/username", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    });
    const token = getToken();
    if (token) {
      saveSession({ token, account: data.account });
    }
    renderProfile(data.account);
    setStatus("Username updated.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  } catch (error) {
    console.warn(error);
  }
  clearSession();
  renderProfile(null);
  setStatus("Logged out.");
});

loadMe();

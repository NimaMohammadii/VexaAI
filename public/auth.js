const AUTH_TOKEN_KEY = "vexa_auth_token";
const ACCOUNT_STORAGE_KEY = "vexa_account";

const authCard = document.getElementById("authCard");
const profileCard = document.getElementById("profileCard");
const profileInfo = document.getElementById("profileInfo");
const authStatus = document.getElementById("authStatus");
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
  const isLoggedIn = Boolean(account);
  if (profileCard) {
    profileCard.hidden = !isLoggedIn;
  }
  if (authCard) {
    authCard.hidden = isLoggedIn;
  }

  if (isLoggedIn && profileInfo) {
    profileInfo.textContent = `Email: ${account.email} • Provider: ${account.provider}`;
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

const handleOAuthResultFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("oauthResult");
  if (!encoded) {
    return;
  }

  try {
    const payload = JSON.parse(atob(decodeURIComponent(encoded)));
    if (payload?.error) {
      setStatus(payload.error, true);
    } else if (payload?.token && payload?.account) {
      saveSession(payload);
      renderProfile(payload.account);
      setStatus("Logged in successfully.");
    }
  } catch (error) {
    setStatus("OAuth response is invalid.", true);
  }

  params.delete("oauthResult");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
};

handleOAuthResultFromUrl();
loadMe();

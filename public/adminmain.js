const loginForm = document.getElementById("loginForm");
const adminCodeInput = document.getElementById("adminCode");
const loginError = document.getElementById("loginError");
const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const totalUsers = document.getElementById("totalUsers");
const userRows = document.getElementById("userRows");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

const formatDate = (timestamp) => {
  if (!timestamp) {
    return "Never";
  }
  return new Date(timestamp).toLocaleString();
};

const setLoginError = (message) => {
  if (loginError) {
    loginError.textContent = message;
  }
};

const setDashboardVisible = (visible) => {
  if (dashboard) {
    dashboard.hidden = !visible;
  }
  if (loginPanel) {
    loginPanel.hidden = visible;
  }
  if (refreshBtn) {
    refreshBtn.hidden = !visible;
  }
};

const fetchSummary = async () => {
  const response = await fetch("/api/admin/summary");
  if (!response.ok) {
    throw new Error("Unauthorized");
  }
  return response.json();
};

const fetchUsers = async (search = "") => {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  const response = await fetch(`/api/admin/users?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Unauthorized");
  }
  return response.json();
};

const renderUsers = (users) => {
  if (!userRows) {
    return;
  }
  if (!users.length) {
    userRows.innerHTML = `<tr><td class="empty-state" colspan="5">No users found.</td></tr>`;
    return;
  }
  userRows.innerHTML = users
    .map((user) => {
      const statusClass = user.online ? "online" : "offline";
      const statusText = user.online ? "Online" : "Offline";
      return `
        <tr>
          <td>${user.id}</td>
          <td>${user.credits}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
          <td>${formatDate(user.lastActivityAt)}</td>
          <td>
            <div class="credit-controls">
              <input type="number" min="1" value="50" data-credit-input="${user.id}" />
              <button class="btn" data-credit-add="${user.id}">Add</button>
              <button class="btn" data-credit-sub="${user.id}">Subtract</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
};

const loadDashboard = async (search = "") => {
  const [summary, userData] = await Promise.all([fetchSummary(), fetchUsers(search)]);
  if (totalUsers) {
    totalUsers.textContent = summary.totalUsers;
  }
  renderUsers(userData.users);
  setDashboardVisible(true);
};

const sendCreditUpdate = async (userId, delta) => {
  const response = await fetch(`/api/admin/users/${userId}/credits`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Unable to update credits.");
  }
};

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminCodeInput.value.trim() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid code.");
      }
      adminCodeInput.value = "";
      await loadDashboard();
    } catch (error) {
      setLoginError(error.message);
      setDashboardVisible(false);
    }
  });
}

if (searchForm) {
  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await loadDashboard(searchInput.value.trim());
    } catch (error) {
      setLoginError("Session expired. Please log in again.");
      setDashboardVisible(false);
    }
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    loadDashboard(searchInput.value.trim()).catch(() => {
      setLoginError("Session expired. Please log in again.");
      setDashboardVisible(false);
    });
  });
}

if (userRows) {
  userRows.addEventListener("click", async (event) => {
    const addTarget = event.target.closest("[data-credit-add]");
    const subTarget = event.target.closest("[data-credit-sub]");
    const target = addTarget || subTarget;
    if (!target) {
      return;
    }
    const userId = target.dataset.creditAdd || target.dataset.creditSub;
    const input = document.querySelector(`[data-credit-input="${userId}"]`);
    const rawValue = input ? Number(input.value) : 0;
    const delta = addTarget ? rawValue : -rawValue;
    if (!delta) {
      return;
    }
    try {
      await sendCreditUpdate(userId, delta);
      await loadDashboard(searchInput.value.trim());
    } catch (error) {
      setLoginError(error.message);
    }
  });
}

loadDashboard().catch(() => {
  setDashboardVisible(false);
});

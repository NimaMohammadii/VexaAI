import { applyThemeTokens, getDefaultTheme } from "./js/shared/theme-tokens.js";

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
const previewToggle = document.getElementById("previewToggle");
const previewTabBtn = document.getElementById("previewTabBtn");
const publishBtn = document.getElementById("publishBtn");
const rollbackBtn = document.getElementById("rollbackBtn");
const rollbackSelect = document.getElementById("rollbackSelect");
const themeStatus = document.getElementById("themeStatus");

const themeInputs = {
  colorBackground: document.getElementById("colorBackground"),
  colorPrimary: document.getElementById("colorPrimary"),
  colorSecondary: document.getElementById("colorSecondary"),
  colorText: document.getElementById("colorText"),
  colorMuted: document.getElementById("colorMuted"),
  fontFamily: document.getElementById("fontFamily"),
  baseFontSize: document.getElementById("baseFontSize"),
  headingScale: document.getElementById("headingScale"),
  pagePadding: document.getElementById("pagePadding"),
  sectionSpacing: document.getElementById("sectionSpacing"),
  containerWidth: document.getElementById("containerWidth"),
  buttonRadius: document.getElementById("buttonRadius"),
  cardRadius: document.getElementById("cardRadius"),
  inputHeight: document.getElementById("inputHeight"),
  toggleHistory: document.getElementById("toggleHistory"),
  toggleCredits: document.getElementById("toggleCredits"),
  toggleMenu: document.getElementById("toggleMenu"),
};

const themeState = {
  draft: getDefaultTheme(),
  published: null,
  previewEnabled: false,
};

let previewTimeout = null;

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

const setThemeStatus = (message) => {
  if (themeStatus) {
    themeStatus.textContent = message;
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

const fetchThemeState = async () => {
  const [current, history] = await Promise.all([
    fetch("/api/admin/theme/current").then((response) => response.json()),
    fetch("/api/admin/theme/history").then((response) => response.json()),
  ]);
  return { current, history };
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
  const [summary, userData, themeData] = await Promise.all([fetchSummary(), fetchUsers(search), fetchThemeState()]);
  if (totalUsers) {
    totalUsers.textContent = summary.totalUsers;
  }
  renderUsers(userData.users);
  hydrateTheme(themeData.current, themeData.history);
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

const hydrateTheme = (current, history) => {
  themeState.published = current?.published || themeState.draft;
  themeState.draft = current?.preview || current?.published || themeState.draft;
  applyThemeTokens(themeState.draft);
  setThemeStatus(current?.preview ? "Previewing draft changes." : "Draft ready.");
  if (previewToggle) {
    previewToggle.checked = Boolean(current?.preview);
    themeState.previewEnabled = previewToggle.checked;
  }
  if (rollbackSelect) {
    rollbackSelect.innerHTML = "";
    (history?.versions || []).forEach((version) => {
      const option = document.createElement("option");
      option.value = version.id;
      option.textContent = `${new Date(version.createdAt).toLocaleString()} • ${version.label}`;
      if (version.id === history?.publishedVersionId) {
        option.selected = true;
      }
      rollbackSelect.appendChild(option);
    });
  }
  syncThemeInputs(themeState.draft);
};

const syncThemeInputs = (theme) => {
  if (!theme) {
    return;
  }
  if (themeInputs.colorBackground) themeInputs.colorBackground.value = theme.colors.background;
  if (themeInputs.colorPrimary) themeInputs.colorPrimary.value = theme.colors.primary;
  if (themeInputs.colorSecondary) themeInputs.colorSecondary.value = theme.colors.secondary;
  if (themeInputs.colorText) themeInputs.colorText.value = theme.colors.text;
  if (themeInputs.colorMuted) themeInputs.colorMuted.value = theme.colors.muted;
  if (themeInputs.fontFamily) themeInputs.fontFamily.value = theme.typography.fontFamily;
  if (themeInputs.baseFontSize) themeInputs.baseFontSize.value = theme.typography.baseFontSize;
  if (themeInputs.headingScale) themeInputs.headingScale.value = theme.typography.headingScale;
  if (themeInputs.pagePadding) themeInputs.pagePadding.value = theme.layout.pagePadding;
  if (themeInputs.sectionSpacing) themeInputs.sectionSpacing.value = theme.layout.sectionSpacing;
  if (themeInputs.containerWidth) themeInputs.containerWidth.value = theme.layout.containerWidth;
  if (themeInputs.buttonRadius) themeInputs.buttonRadius.value = theme.components.buttonRadius;
  if (themeInputs.cardRadius) themeInputs.cardRadius.value = theme.components.cardRadius;
  if (themeInputs.inputHeight) themeInputs.inputHeight.value = theme.components.inputHeight;
  if (themeInputs.toggleHistory) themeInputs.toggleHistory.checked = theme.sections.showHistory;
  if (themeInputs.toggleCredits) themeInputs.toggleCredits.checked = theme.sections.showCredits;
  if (themeInputs.toggleMenu) themeInputs.toggleMenu.checked = theme.sections.showMenu;
};

const updateDraftTheme = (updater) => {
  themeState.draft = updater(themeState.draft);
  applyThemeTokens(themeState.draft);
  setThemeStatus(themeState.previewEnabled ? "Previewing draft changes." : "Draft ready.");
  if (themeState.previewEnabled) {
    schedulePreviewUpdate();
  }
};

const cloneTheme = (theme) => {
  if (typeof structuredClone === "function") {
    return structuredClone(theme);
  }
  return JSON.parse(JSON.stringify(theme));
};

const schedulePreviewUpdate = () => {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }
  previewTimeout = setTimeout(async () => {
    try {
      await fetch("/api/admin/theme/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeState.draft }),
      });
      setThemeStatus("Preview synced.");
    } catch (error) {
      setThemeStatus("Preview failed. Check connection.");
    }
  }, 250);
};

const handleThemeInput = (key, value) => {
  updateDraftTheme((current) => {
    const next = cloneTheme(current);
    switch (key) {
      case "colorBackground":
        next.colors.background = value;
        break;
      case "colorPrimary":
        next.colors.primary = value;
        break;
      case "colorSecondary":
        next.colors.secondary = value;
        break;
      case "colorText":
        next.colors.text = value;
        break;
      case "colorMuted":
        next.colors.muted = value;
        break;
      case "fontFamily":
        next.typography.fontFamily = value;
        break;
      case "baseFontSize":
        next.typography.baseFontSize = Number(value);
        break;
      case "headingScale":
        next.typography.headingScale = Number(value);
        break;
      case "pagePadding":
        next.layout.pagePadding = Number(value);
        break;
      case "sectionSpacing":
        next.layout.sectionSpacing = Number(value);
        break;
      case "containerWidth":
        next.layout.containerWidth = Number(value);
        break;
      case "buttonRadius":
        next.components.buttonRadius = Number(value);
        break;
      case "cardRadius":
        next.components.cardRadius = Number(value);
        break;
      case "inputHeight":
        next.components.inputHeight = Number(value);
        break;
      case "toggleHistory":
        next.sections.showHistory = Boolean(value);
        break;
      case "toggleCredits":
        next.sections.showCredits = Boolean(value);
        break;
      case "toggleMenu":
        next.sections.showMenu = Boolean(value);
        break;
      default:
        break;
    }
    return next;
  });
};

Object.entries(themeInputs).forEach(([key, input]) => {
  if (!input) {
    return;
  }
  const handler = () => {
    const value = input.type === "checkbox" ? input.checked : input.value;
    handleThemeInput(key, value);
  };
  input.addEventListener("input", handler);
  input.addEventListener("change", handler);
});

if (previewToggle) {
  previewToggle.addEventListener("change", () => {
    themeState.previewEnabled = previewToggle.checked;
    setThemeStatus(themeState.previewEnabled ? "Preview mode enabled." : "Preview mode disabled.");
    if (themeState.previewEnabled) {
      schedulePreviewUpdate();
      return;
    }
    fetch("/api/admin/theme/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    }).catch(() => {
      setThemeStatus("Unable to clear preview.");
    });
  });
}

if (previewTabBtn) {
  previewTabBtn.addEventListener("click", () => {
    window.open("/text-to-speech.html?preview=1", "_blank", "noopener");
  });
}

if (publishBtn) {
  publishBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/admin/theme/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeState.draft, label: "Published via admin" }),
      });
      if (!response.ok) {
        throw new Error("Publish failed.");
      }
      setThemeStatus("Theme published to all users.");
      await loadDashboard(searchInput?.value?.trim() || "");
    } catch (error) {
      setThemeStatus("Publish failed. Try again.");
    }
  });
}

if (rollbackBtn && rollbackSelect) {
  rollbackBtn.addEventListener("click", async () => {
    if (!rollbackSelect.value) {
      return;
    }
    try {
      const response = await fetch("/api/admin/theme/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: rollbackSelect.value }),
      });
      if (!response.ok) {
        throw new Error("Rollback failed.");
      }
      setThemeStatus("Rolled back to selected version.");
      await loadDashboard(searchInput?.value?.trim() || "");
    } catch (error) {
      setThemeStatus("Rollback failed. Try again.");
    }
  });
}

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

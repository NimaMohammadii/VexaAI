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
const siteSettingsPanel = document.getElementById("siteSettingsPanel");
const siteSettingsForm = document.getElementById("siteSettingsForm");
const settingsStatus = document.getElementById("settingsStatus");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const pageMaxWidthInput = document.getElementById("pageMaxWidth");
const homeGridMaxWidthInput = document.getElementById("homeGridMaxWidth");
const ttsMaxWidthInput = document.getElementById("ttsMaxWidth");
const bgColorInput = document.getElementById("bgColor");
const bgAltColorInput = document.getElementById("bgAltColor");
const surfaceColorInput = document.getElementById("surfaceColor");
const panelColorInput = document.getElementById("panelColor");
const primaryColorInput = document.getElementById("primaryColor");
const headerBgInput = document.getElementById("headerBg");
const baseFontSizeInput = document.getElementById("baseFontSize");
const basePaddingYInput = document.getElementById("basePaddingY");
const basePaddingXInput = document.getElementById("basePaddingX");
const ctaFontSizeInput = document.getElementById("ctaFontSize");
const ctaPaddingYInput = document.getElementById("ctaPaddingY");
const ctaPaddingXInput = document.getElementById("ctaPaddingX");
const stickerCards = document.querySelectorAll(".sticker-card");

let currentSiteSettings = null;
const pendingStickers = {};

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
  if (siteSettingsPanel) {
    siteSettingsPanel.hidden = !visible;
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

const fetchSiteSettings = async () => {
  const response = await fetch("/api/admin/site-settings");
  if (!response.ok) {
    throw new Error("Unable to load settings.");
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

const setSettingsStatus = (message, isError = false) => {
  if (!settingsStatus) {
    return;
  }
  settingsStatus.textContent = message;
  settingsStatus.classList.toggle("error", isError);
};

const setStickerPreview = (card, src) => {
  const preview = card.querySelector(".sticker-preview");
  if (!preview) {
    return;
  }
  preview.innerHTML = "";
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Sticker preview";
    preview.appendChild(img);
  } else {
    const fallback = document.createElement("span");
    fallback.textContent = "—";
    preview.appendChild(fallback);
  }
};

const populateSettingsForm = (settings) => {
  currentSiteSettings = settings;
  if (pageMaxWidthInput) pageMaxWidthInput.value = settings.layout.pageMaxWidth;
  if (homeGridMaxWidthInput) homeGridMaxWidthInput.value = settings.layout.homeGridMaxWidth;
  if (ttsMaxWidthInput) ttsMaxWidthInput.value = settings.layout.ttsMaxWidth;
  if (bgColorInput) bgColorInput.value = settings.colors.bg;
  if (bgAltColorInput) bgAltColorInput.value = settings.colors.bgAlt;
  if (surfaceColorInput) surfaceColorInput.value = settings.colors.surface;
  if (panelColorInput) panelColorInput.value = settings.colors.panel;
  if (primaryColorInput) primaryColorInput.value = settings.colors.primary;
  if (headerBgInput) headerBgInput.value = settings.colors.headerBg;
  if (baseFontSizeInput) baseFontSizeInput.value = settings.buttons.baseFontSize;
  if (basePaddingYInput) basePaddingYInput.value = settings.buttons.basePaddingY;
  if (basePaddingXInput) basePaddingXInput.value = settings.buttons.basePaddingX;
  if (ctaFontSizeInput) ctaFontSizeInput.value = settings.buttons.ctaFontSize;
  if (ctaPaddingYInput) ctaPaddingYInput.value = settings.buttons.ctaPaddingY;
  if (ctaPaddingXInput) ctaPaddingXInput.value = settings.buttons.ctaPaddingX;

  stickerCards.forEach((card) => {
    const key = card.dataset.stickerSlot;
    setStickerPreview(card, settings.stickers?.[key]);
  });

  Object.keys(pendingStickers).forEach((key) => {
    delete pendingStickers[key];
  });
  setSettingsStatus("");
};

const loadSiteSettings = async () => {
  const settings = await fetchSiteSettings();
  populateSettingsForm(settings);
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
      await loadSiteSettings();
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
    Promise.all([loadDashboard(searchInput.value.trim()), loadSiteSettings()]).catch(() => {
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

if (siteSettingsForm) {
  siteSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentSiteSettings) {
      return;
    }
    const readNumber = (input) => {
      const value = Number(input?.value);
      return Number.isFinite(value) ? value : null;
    };
    const payload = {
      layout: {
        pageMaxWidth: readNumber(pageMaxWidthInput),
        homeGridMaxWidth: readNumber(homeGridMaxWidthInput),
        ttsMaxWidth: readNumber(ttsMaxWidthInput),
      },
      colors: {
        bg: bgColorInput?.value,
        bgAlt: bgAltColorInput?.value,
        surface: surfaceColorInput?.value,
        panel: panelColorInput?.value,
        primary: primaryColorInput?.value,
        headerBg: headerBgInput?.value,
      },
      buttons: {
        baseFontSize: readNumber(baseFontSizeInput),
        basePaddingY: readNumber(basePaddingYInput),
        basePaddingX: readNumber(basePaddingXInput),
        ctaFontSize: readNumber(ctaFontSizeInput),
        ctaPaddingY: readNumber(ctaPaddingYInput),
        ctaPaddingX: readNumber(ctaPaddingXInput),
      },
      stickers: {
        ...currentSiteSettings.stickers,
        ...pendingStickers,
      },
    };

    try {
      setSettingsStatus("Saving...");
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Unable to save settings.");
      }
      const data = await response.json();
      populateSettingsForm(data);
      setSettingsStatus("Settings saved.");
    } catch (error) {
      setSettingsStatus(error.message, true);
    }
  });
}

if (resetSettingsBtn) {
  resetSettingsBtn.addEventListener("click", async () => {
    try {
      setSettingsStatus("Resetting...");
      const response = await fetch("/api/admin/site-settings/reset", { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Unable to reset settings.");
      }
      const data = await response.json();
      populateSettingsForm(data);
      setSettingsStatus("Defaults restored.");
    } catch (error) {
      setSettingsStatus(error.message, true);
    }
  });
}

if (stickerCards.length) {
  stickerCards.forEach((card) => {
    const fileInput = card.querySelector("input[type=\"file\"]");
    const key = card.dataset.stickerSlot;
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const src = String(reader.result || "");
          pendingStickers[key] = src;
          setStickerPreview(card, src);
        };
        reader.readAsDataURL(file);
      });
    }
  });
}

if (siteSettingsPanel) {
  siteSettingsPanel.addEventListener("click", (event) => {
    const clearButton = event.target.closest("[data-sticker-clear]");
    if (!clearButton) {
      return;
    }
    const key = clearButton.dataset.stickerClear;
    pendingStickers[key] = "";
    const card = siteSettingsPanel.querySelector(`[data-sticker-slot="${key}"]`);
    if (card) {
      setStickerPreview(card, "");
    }
  });
}

loadDashboard()
  .then(() => loadSiteSettings())
  .catch(() => {
    setDashboardVisible(false);
  });

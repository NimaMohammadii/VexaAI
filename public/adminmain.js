const loginForm = document.getElementById(“loginForm”);
const adminCodeInput = document.getElementById(“adminCode”);
const loginError = document.getElementById(“loginError”);
const loginPanel = document.getElementById(“loginPanel”);
const dashboard = document.getElementById(“dashboard”);
const totalUsers = document.getElementById(“totalUsers”);
const userRows = document.getElementById(“userRows”);
const searchForm = document.getElementById(“searchForm”);
const searchInput = document.getElementById(“searchInput”);
const refreshBtn = document.getElementById(“refreshBtn”);
const siteSettingsPanel = document.getElementById(“siteSettingsPanel”);
const siteSettingsForm = document.getElementById(“siteSettingsForm”);
const settingsStatus = document.getElementById(“settingsStatus”);
const resetSettingsBtn = document.getElementById(“resetSettingsBtn”);
const pageMaxWidthInput = document.getElementById(“pageMaxWidth”);
const homeGridMaxWidthInput = document.getElementById(“homeGridMaxWidth”);
const ttsMaxWidthInput = document.getElementById(“ttsMaxWidth”);
const gnOffsetInput = document.getElementById(“gnOffset”);
const bgColorInput = document.getElementById(“bgColor”);
const bgAltColorInput = document.getElementById(“bgAltColor”);
const surfaceColorInput = document.getElementById(“surfaceColor”);
const panelColorInput = document.getElementById(“panelColor”);
const primaryColorInput = document.getElementById(“primaryColor”);
const headerBgInput = document.getElementById(“headerBg”);
const baseFontSizeInput = document.getElementById(“baseFontSize”);
const basePaddingYInput = document.getElementById(“basePaddingY”);
const basePaddingXInput = document.getElementById(“basePaddingX”);
const ctaFontSizeInput = document.getElementById(“ctaFontSize”);
const ctaPaddingYInput = document.getElementById(“ctaPaddingY”);
const ctaPaddingXInput = document.getElementById(“ctaPaddingX”);
const stickerCards = document.querySelectorAll(”.sticker-card”);
const layoutStudioPanel = document.getElementById(“layoutStudioPanel”);
const layoutPageSelect = document.getElementById(“layoutPageSelect”);
const layoutScaleInput = document.getElementById(“layoutScale”);
const layoutOffsetXInput = document.getElementById(“layoutOffsetX”);
const layoutOffsetYInput = document.getElementById(“layoutOffsetY”);
const layoutElementHint = document.getElementById(“layoutElementHint”);
const layoutElementXInput = document.getElementById(“layoutElementX”);
const layoutElementYInput = document.getElementById(“layoutElementY”);
const layoutElementWidthInput = document.getElementById(“layoutElementWidth”);
const layoutElementHeightInput = document.getElementById(“layoutElementHeight”);
const layoutResetElementBtn = document.getElementById(“layoutResetElementBtn”);
const layoutResetPageBtn = document.getElementById(“layoutResetPageBtn”);
const layoutFrameWidthInput = document.getElementById(“layoutFrameWidth”);
const layoutFrameHeightInput = document.getElementById(“layoutFrameHeight”);
const layoutSaveBtn = document.getElementById(“layoutSaveBtn”);
const layoutStatus = document.getElementById(“layoutStatus”);
const layoutRefreshBtn = document.getElementById(“layoutRefreshBtn”);
const layoutEditModeBtn = document.getElementById(“layoutEditModeBtn”);
const layoutFrame = document.getElementById(“layoutFrame”);
const layoutFrameWrap = document.getElementById(“layoutFrameWrap”);
const GN_FIXED_VALUE = 90;

let currentSiteSettings = null;
const pendingStickers = {};
let layoutSelectedElement = null;
let layoutSelectedId = null;
let frameReady = false;
let EDIT_MODE = false;

const formatDate = (timestamp) => {
if (!timestamp) {
return “Never”;
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
if (layoutStudioPanel) {
layoutStudioPanel.hidden = !visible;
}
};

const fetchSummary = async () => {
const response = await fetch(”/api/admin/summary”);
if (!response.ok) {
throw new Error(“Unauthorized”);
}
return response.json();
};

const fetchUsers = async (search = “”) => {
const params = new URLSearchParams();
if (search) {
params.set(“search”, search);
}
const response = await fetch(`/api/admin/users?${params.toString()}`);
if (!response.ok) {
throw new Error(“Unauthorized”);
}
return response.json();
};

const fetchSiteSettings = async () => {
const response = await fetch(”/api/admin/site-settings”);
if (!response.ok) {
throw new Error(“Unable to load settings.”);
}
return response.json();
};

const layoutPages = {
home: “/index.html”,
“text-to-speech”: “/text-to-speech.html”,
“live-translate”: “/live-translate.html”,
“vexa-assistant”: “/vexa-assistant.html”,
voices: “/voices.html”,
about: “/about.html”,
pricing: “/pricing.html”,
credits: “/credits.html”,
“how-it-works”: “/how-it-works.html”,
};

const getLayoutEditor = () => {
if (!currentSiteSettings) {
return { pages: {} };
}
if (!currentSiteSettings.layoutEditor) {
currentSiteSettings.layoutEditor = { pages: {} };
}
return currentSiteSettings.layoutEditor;
};

const getPageSettings = (pageKey) => {
const editor = getLayoutEditor();
if (!editor.pages[pageKey]) {
editor.pages[pageKey] = {
canvas: { scale: 1, offsetX: 0, offsetY: 0 },
elements: {},
frame: { width: 390, height: 844 },
};
}
return editor.pages[pageKey];
};

const setLayoutStatus = (message, isError = false) => {
if (!layoutStatus) {
return;
}
layoutStatus.textContent = message;
layoutStatus.classList.toggle(“error”, isError);
};

const applyLayoutControls = (pageSettings) => {
if (layoutScaleInput) layoutScaleInput.value = pageSettings.canvas.scale;
if (layoutOffsetXInput) layoutOffsetXInput.value = pageSettings.canvas.offsetX;
if (layoutOffsetYInput) layoutOffsetYInput.value = pageSettings.canvas.offsetY;
if (layoutFrameWidthInput) layoutFrameWidthInput.value = pageSettings.frame.width;
if (layoutFrameHeightInput) layoutFrameHeightInput.value = pageSettings.frame.height;
};

const updateFrameSize = (pageSettings) => {
if (!layoutFrameWrap) {
return;
}
layoutFrameWrap.style.width = `${pageSettings.frame.width}px`;
layoutFrameWrap.style.height = `${pageSettings.frame.height}px`;
};

const ensureFrameStyles = (doc) => {
if (!doc || doc.getElementById(“admin-layout-style”)) {
return;
}
const style = doc.createElement(“style”);
style.id = “admin-layout-style”;
style.textContent = `[data-admin-id] { outline: none; cursor: auto; } [data-admin-id].admin-selected { outline: none; cursor: auto; } .admin-resize-handle { display: none; position: absolute; width: 14px; height: 14px; right: -6px; bottom: -6px; border-radius: 50%; background: #8f92ff; border: 2px solid #0b0f18; cursor: se-resize; z-index: 9999; } .admin-layout-edit-mode [data-admin-id] { outline: 1px dashed rgba(143, 146, 255, 0.45); cursor: grab; } .admin-layout-edit-mode [data-admin-id].admin-selected { outline: 2px solid rgba(143, 146, 255, 0.95); cursor: grabbing; } .admin-layout-edit-mode .admin-resize-handle { display: block; } .admin-layout-edit-mode button, .admin-layout-edit-mode a, .admin-layout-edit-mode [role="button"], .admin-layout-edit-mode [role="menu"], .admin-layout-edit-mode [role="menuitem"], .admin-layout-edit-mode .menu-overlay, .admin-layout-edit-mode .side-menu, .admin-layout-edit-mode .menu-toggle, .admin-layout-edit-mode .menu-close, .admin-layout-edit-mode .menu-link { pointer-events: none !important; } .admin-layout-edit-mode [data-editable="true"], .admin-layout-edit-mode [data-editable="true"] * { pointer-events: auto; }`;
doc.head.appendChild(style);
};

const ensureFrameAdminIds = (doc) => {
const root = doc.body || doc.documentElement;
const candidates = root ? root.querySelectorAll(”*”) : doc.querySelectorAll(”*”);
const existingIds = new Set();

// Tags that should NOT be made editable/draggable (interactive elements)
const nonEditableTags = [“SCRIPT”, “STYLE”, “META”, “LINK”, “HEAD”, “A”, “BUTTON”, “INPUT”, “SELECT”, “TEXTAREA”];

candidates.forEach((element) => {
if (!(element instanceof Element)) {
return;
}
const tag = element.tagName;
if (nonEditableTags.includes(tag)) {
return;
}
if (element.dataset.adminId) {
existingIds.add(element.dataset.adminId);
}
});

let index = existingIds.size;
candidates.forEach((element) => {
if (!(element instanceof Element)) {
return;
}
const tag = element.tagName;
if (nonEditableTags.includes(tag)) {
return;
}

```
// Only mark container/layout elements as editable
element.dataset.editable = "true";

if (element.dataset.adminId) {
  return;
}
element.dataset.adminId = `auto-${index}`;
index += 1;
```

});
};

const applyElementOverrideToFrame = (element, override) => {
if (!element) {
return;
}
if (!element.dataset.adminBaseTransform) {
element.dataset.adminBaseTransform = element.style.transform || “”;
}
const baseTransform = element.dataset.adminBaseTransform;
const x = Number.isFinite(override?.x) ? override.x : 0;
const y = Number.isFinite(override?.y) ? override.y : 0;
const transform = [baseTransform, `translate(${x}px, ${y}px)`]
.filter(Boolean)
.join(” “);
element.style.transform = transform;
element.style.width = Number.isFinite(override?.width) ? `${override.width}px` : “”;
element.style.height = Number.isFinite(override?.height) ? `${override.height}px` : “”;
};

const applyCanvasOverrideToFrame = (doc, pageSettings) => {
const main = doc?.querySelector(“main”);
if (!main) {
return;
}
const scale = Number.isFinite(pageSettings?.canvas?.scale) ? pageSettings.canvas.scale : 1;
const offsetX = Number.isFinite(pageSettings?.canvas?.offsetX) ? pageSettings.canvas.offsetX : 0;
const offsetY = Number.isFinite(pageSettings?.canvas?.offsetY) ? pageSettings.canvas.offsetY : 0;
main.style.transformOrigin = “top center”;
main.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
};

const updateEditModeButton = () => {
if (!layoutEditModeBtn) {
return;
}
layoutEditModeBtn.textContent = EDIT_MODE ? “Disable edit mode” : “Enable edit mode”;
layoutEditModeBtn.setAttribute(“aria-pressed”, String(EDIT_MODE));
layoutEditModeBtn.classList.toggle(“primary”, EDIT_MODE);
};

const applyFrameEditMode = (doc) => {
if (!doc?.body) {
return;
}
doc.body.classList.toggle(“admin-layout-edit-mode”, EDIT_MODE);
};

const refreshLayoutPreview = () => {
const pageKey = layoutPageSelect?.value || “home”;
const pageSettings = getPageSettings(pageKey);
applyLayoutControls(pageSettings);
updateFrameSize(pageSettings);
layoutSelectedElement = null;
layoutSelectedId = null;
updateEditModeButton();
setLayoutStatus(EDIT_MODE ? “Edit mode is enabled.” : “”);
if (layoutFrame) {
frameReady = false;
layoutFrame.src = layoutPages[pageKey] || “/index.html”;
}
};

const selectLayoutElement = (element, pageSettings) => {
if (!element) {
return;
}
if (layoutSelectedElement && layoutSelectedElement !== element) {
layoutSelectedElement.classList.remove(“admin-selected”);
const handle = layoutSelectedElement.querySelector(”.admin-resize-handle”);
handle?.remove();
}
layoutSelectedElement = element;
layoutSelectedId = element.dataset.adminId;
element.classList.add(“admin-selected”);
if (!element.querySelector(”.admin-resize-handle”)) {
const handle = element.ownerDocument.createElement(“span”);
handle.className = “admin-resize-handle”;
element.style.position = element.style.position || “relative”;
element.appendChild(handle);
}
const override = pageSettings.elements[layoutSelectedId] || { x: 0, y: 0 };
const rect = element.getBoundingClientRect();
if (layoutElementXInput) layoutElementXInput.value = override.x ?? 0;
if (layoutElementYInput) layoutElementYInput.value = override.y ?? 0;
if (layoutElementWidthInput)
layoutElementWidthInput.value = Number.isFinite(override.width) ? override.width : Math.round(rect.width);
if (layoutElementHeightInput)
layoutElementHeightInput.value = Number.isFinite(override.height) ? override.height : Math.round(rect.height);
if (layoutElementHint) {
layoutElementHint.textContent = `Selected: ${layoutSelectedId}`;
}
};

const updateSelectedOverride = (pageSettings, updates) => {
if (!layoutSelectedId) {
return;
}
const current = pageSettings.elements[layoutSelectedId] || { x: 0, y: 0 };
const next = { …current, …updates };
pageSettings.elements[layoutSelectedId] = next;
applyElementOverrideToFrame(layoutSelectedElement, next);
};

const clearSelectedOverride = (pageSettings) => {
if (!layoutSelectedId || !layoutSelectedElement) {
return;
}
delete pageSettings.elements[layoutSelectedId];
layoutSelectedElement.style.transform = layoutSelectedElement.dataset.adminBaseTransform || “”;
layoutSelectedElement.style.width = “”;
layoutSelectedElement.style.height = “”;
if (layoutElementXInput) layoutElementXInput.value = 0;
if (layoutElementYInput) layoutElementYInput.value = 0;
if (layoutElementWidthInput)
layoutElementWidthInput.value = Math.round(layoutSelectedElement.getBoundingClientRect().width);
if (layoutElementHeightInput)
layoutElementHeightInput.value = Math.round(layoutSelectedElement.getBoundingClientRect().height);
setLayoutStatus(“Element reset.”);
};

const setupFrameInteractions = (doc, pageSettings) => {
if (!doc) {
return;
}
let dragState = null;

const onPointerMove = (event) => {
if (!dragState) {
return;
}
const deltaX = event.clientX - dragState.startX;
const deltaY = event.clientY - dragState.startY;
if (dragState.mode === “resize”) {
const nextWidth = Math.max(24, Math.round(dragState.startWidth + deltaX));
const nextHeight = Math.max(24, Math.round(dragState.startHeight + deltaY));
updateSelectedOverride(pageSettings, { width: nextWidth, height: nextHeight });
if (layoutElementWidthInput) layoutElementWidthInput.value = nextWidth;
if (layoutElementHeightInput) layoutElementHeightInput.value = nextHeight;
} else {
const nextX = Math.round(dragState.startOffsetX + deltaX);
const nextY = Math.round(dragState.startOffsetY + deltaY);
updateSelectedOverride(pageSettings, { x: nextX, y: nextY });
if (layoutElementXInput) layoutElementXInput.value = nextX;
if (layoutElementYInput) layoutElementYInput.value = nextY;
}
};

const onPointerUp = () => {
dragState = null;
doc.removeEventListener(“mousemove”, onPointerMove);
doc.removeEventListener(“mouseup”, onPointerUp);
};

const onPointerDown = (event) => {
if (!EDIT_MODE) {
return;
}
event.preventDefault();
event.stopPropagation();
event.stopImmediatePropagation();

```
let target = event.target;
if (target && target.nodeType === Node.TEXT_NODE) {
  target = target.parentElement;
}
target = target instanceof Element ? target : null;
if (!target) {
  return;
}
const resizeHandle = target.closest(".admin-resize-handle");
const selectedTarget = resizeHandle
  ? resizeHandle.parentElement
  : target.closest('[data-editable="true"]');
if (!selectedTarget) {
  return;
}
selectLayoutElement(selectedTarget, pageSettings);
console.log("Selected editable element:", selectedTarget);
const override = pageSettings.elements[layoutSelectedId] || { x: 0, y: 0 };
dragState = {
  mode: resizeHandle ? "resize" : "drag",
  startX: event.clientX,
  startY: event.clientY,
  startOffsetX: override.x ?? 0,
  startOffsetY: override.y ?? 0,
  startWidth: Number.isFinite(override.width)
    ? override.width
    : Math.round(selectedTarget.getBoundingClientRect().width),
  startHeight: Number.isFinite(override.height)
    ? override.height
    : Math.round(selectedTarget.getBoundingClientRect().height),
};
doc.addEventListener("mousemove", onPointerMove);
doc.addEventListener("mouseup", onPointerUp);
```

};

doc.addEventListener(“pointerdown”, onPointerDown, { capture: true });
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
const statusClass = user.online ? “online” : “offline”;
const statusText = user.online ? “Online” : “Offline”;
return `<tr> <td>${user.id}</td> <td>${user.credits}</td> <td><span class="status ${statusClass}">${statusText}</span></td> <td>${formatDate(user.lastActivityAt)}</td> <td> <div class="credit-controls"> <input type="number" min="1" value="50" data-credit-input="${user.id}" /> <button class="btn" data-credit-add="${user.id}">Add</button> <button class="btn" data-credit-sub="${user.id}">Subtract</button> </div> </td> </tr>`;
})
.join(””);
};

const loadDashboard = async (search = “”) => {
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
settingsStatus.classList.toggle(“error”, isError);
};

const setStickerPreview = (card, src) => {
const preview = card.querySelector(”.sticker-preview”);
if (!preview) {
return;
}
preview.innerHTML = “”;
if (src) {
const img = document.createElement(“img”);
img.src = src;
img.alt = “Sticker preview”;
preview.appendChild(img);
} else {
const fallback = document.createElement(“span”);
fallback.textContent = “—”;
preview.appendChild(fallback);
}
};

const populateSettingsForm = (settings) => {
currentSiteSettings = settings;
if (pageMaxWidthInput) pageMaxWidthInput.value = settings.layout.pageMaxWidth;
if (homeGridMaxWidthInput) homeGridMaxWidthInput.value = settings.layout.homeGridMaxWidth;
if (ttsMaxWidthInput) ttsMaxWidthInput.value = settings.layout.ttsMaxWidth;
if (gnOffsetInput) {
gnOffsetInput.value = GN_FIXED_VALUE;
gnOffsetInput.disabled = true;
}
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
setSettingsStatus(””);

if (layoutPageSelect) {
const pageKey = layoutPageSelect.value || “home”;
const pageSettings = getPageSettings(pageKey);
applyLayoutControls(pageSettings);
updateFrameSize(pageSettings);
}
};

const loadSiteSettings = async () => {
const settings = await fetchSiteSettings();
populateSettingsForm(settings);
if (layoutFrame && layoutPageSelect) {
refreshLayoutPreview();
}
};

const sendCreditUpdate = async (userId, delta) => {
const response = await fetch(`/api/admin/users/${userId}/credits`, {
method: “PATCH”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({ delta }),
});
if (!response.ok) {
const error = await response.json();
throw new Error(error.error || “Unable to update credits.”);
}
};

if (loginForm) {
loginForm.addEventListener(“submit”, async (event) => {
event.preventDefault();
setLoginError(””);
try {
const response = await fetch(”/api/admin/login”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({ key: adminCodeInput.value.trim() }),
});
if (!response.ok) {
const error = await response.json();
throw new Error(error.error || “Invalid code.”);
}
adminCodeInput.value = “”;
await loadDashboard();
await loadSiteSettings();
} catch (error) {
setLoginError(error.message);
setDashboardVisible(false);
}
});
}

if (searchForm) {
searchForm.addEventListener(“submit”, async (event) => {
event.preventDefault();
try {
await loadDashboard(searchInput.value.trim());
} catch (error) {
setLoginError(“Session expired. Please log in again.”);
setDashboardVisible(false);
}
});
}

if (refreshBtn) {
refreshBtn.addEventListener(“click”, () => {
Promise.all([loadDashboard(searchInput.value.trim()), loadSiteSettings()]).catch(() => {
setLoginError(“Session expired. Please log in again.”);
setDashboardVisible(false);
});
});
}

if (userRows) {
userRows.addEventListener(“click”, async (event) => {
const addTarget = event.target.closest(”[data-credit-add]”);
const subTarget = event.target.closest(”[data-credit-sub]”);
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
siteSettingsForm.addEventListener(“submit”, async (event) => {
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
gn: GN_FIXED_VALUE,
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
…currentSiteSettings.stickers,
…pendingStickers,
},
layoutEditor: currentSiteSettings.layoutEditor,
};

```
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
```

});
}

if (resetSettingsBtn) {
resetSettingsBtn.addEventListener(“click”, async () => {
try {
setSettingsStatus(“Resetting…”);
const response = await fetch(”/api/admin/site-settings/reset”, { method: “POST” });
if (!response.ok) {
const error = await response.json();
throw new Error(error.error || “Unable to reset settings.”);
}
const data = await response.json();
populateSettingsForm(data);
setSettingsStatus(“Defaults restored.”);
} catch (error) {
setSettingsStatus(error.message, true);
}
});
}

if (stickerCards.length) {
stickerCards.forEach((card) => {
const fileInput = card.querySelector(“input[type="file"]”);
const key = card.dataset.stickerSlot;
if (fileInput) {
fileInput.addEventListener(“change”, () => {
const file = fileInput.files?.[0];
if (!file) {
return;
}
const reader = new FileReader();
reader.onload = () => {
const src = String(reader.result || “”);
pendingStickers[key] = src;
setStickerPreview(card, src);
};
reader.readAsDataURL(file);
});
}
});
}

if (siteSettingsPanel) {
siteSettingsPanel.addEventListener(“click”, (event) => {
const clearButton = event.target.closest(”[data-sticker-clear]”);
if (!clearButton) {
return;
}
const key = clearButton.dataset.stickerClear;
pendingStickers[key] = “”;
const card = siteSettingsPanel.querySelector(`[data-sticker-slot="${key}"]`);
if (card) {
setStickerPreview(card, “”);
}
});
}

if (layoutPageSelect) {
layoutPageSelect.addEventListener(“change”, () => {
refreshLayoutPreview();
});
}

if (layoutRefreshBtn) {
layoutRefreshBtn.addEventListener(“click”, () => {
refreshLayoutPreview();
});
}

if (layoutEditModeBtn) {
updateEditModeButton();
layoutEditModeBtn.addEventListener(“click”, () => {
EDIT_MODE = !EDIT_MODE;
updateEditModeButton();
applyFrameEditMode(layoutFrame?.contentDocument);
if (layoutElementHint) {
layoutElementHint.textContent = EDIT_MODE
? “Click any element inside the preview.”
: “Enable edit mode to drag and resize items.”;
}
setLayoutStatus(EDIT_MODE ? “Edit mode is enabled.” : “Edit mode is disabled.”);
});
}

if (layoutFrame) {
layoutFrame.addEventListener(“load”, () => {
const doc = layoutFrame.contentDocument;
if (!doc) {
return;
}
frameReady = true;
const pageKey = layoutPageSelect?.value || “home”;
const pageSettings = getPageSettings(pageKey);
ensureFrameStyles(doc);
ensureFrameAdminIds(doc);
applyFrameEditMode(doc);
applyCanvasOverrideToFrame(doc, pageSettings);
Object.entries(pageSettings.elements).forEach(([elementId, override]) => {
const element = doc.querySelector(`[data-admin-id="${elementId}"]`);
if (element) {
applyElementOverrideToFrame(element, override);
}
});
setupFrameInteractions(doc, pageSettings);
if (layoutElementHint) {
layoutElementHint.textContent = EDIT_MODE
? “Click any element inside the preview.”
: “Enable edit mode to drag and resize items.”;
}
});
}

if (layoutScaleInput) {
layoutScaleInput.addEventListener(“input”, () => {
if (!frameReady) {
return;
}
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
pageSettings.canvas.scale = Number(layoutScaleInput.value) || 1;
applyCanvasOverrideToFrame(layoutFrame?.contentDocument, pageSettings);
});
}

if (layoutOffsetXInput) {
layoutOffsetXInput.addEventListener(“input”, () => {
if (!frameReady) {
return;
}
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
pageSettings.canvas.offsetX = Number(layoutOffsetXInput.value) || 0;
applyCanvasOverrideToFrame(layoutFrame?.contentDocument, pageSettings);
});
}

if (layoutOffsetYInput) {
layoutOffsetYInput.addEventListener(“input”, () => {
if (!frameReady) {
return;
}
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
pageSettings.canvas.offsetY = Number(layoutOffsetYInput.value) || 0;
applyCanvasOverrideToFrame(layoutFrame?.contentDocument, pageSettings);
});
}

const bindElementInput = (input, key) => {
if (!input) {
return;
}
input.addEventListener(“input”, () => {
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
const value = Number(input.value);
if (!Number.isFinite(value)) {
return;
}
updateSelectedOverride(pageSettings, { [key]: value });
});
};

bindElementInput(layoutElementXInput, “x”);
bindElementInput(layoutElementYInput, “y”);
bindElementInput(layoutElementWidthInput, “width”);
bindElementInput(layoutElementHeightInput, “height”);

if (layoutResetElementBtn) {
layoutResetElementBtn.addEventListener(“click”, () => {
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
clearSelectedOverride(pageSettings);
});
}

if (layoutResetPageBtn) {
layoutResetPageBtn.addEventListener(“click”, () => {
const pageKey = layoutPageSelect?.value || “home”;
const pageSettings = getPageSettings(pageKey);
pageSettings.canvas = { scale: 1, offsetX: 0, offsetY: 0 };
pageSettings.elements = {};
pageSettings.frame = { width: 390, height: 844 };
applyLayoutControls(pageSettings);
updateFrameSize(pageSettings);
if (frameReady) {
applyCanvasOverrideToFrame(layoutFrame?.contentDocument, pageSettings);
refreshLayoutPreview();
}
setLayoutStatus(“Page reset.”);
});
}

if (layoutFrameWidthInput) {
layoutFrameWidthInput.addEventListener(“input”, () => {
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
pageSettings.frame.width = Number(layoutFrameWidthInput.value) || pageSettings.frame.width;
updateFrameSize(pageSettings);
});
}

if (layoutFrameHeightInput) {
layoutFrameHeightInput.addEventListener(“input”, () => {
const pageSettings = getPageSettings(layoutPageSelect?.value || “home”);
pageSettings.frame.height = Number(layoutFrameHeightInput.value) || pageSettings.frame.height;
updateFrameSize(pageSettings);
});
}

if (layoutSaveBtn) {
layoutSaveBtn.addEventListener(“click”, async () => {
if (!currentSiteSettings) {
return;
}
try {
setLayoutStatus(“Saving…”);
const response = await fetch(”/api/admin/site-settings”, {
method: “PUT”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({ layoutEditor: currentSiteSettings.layoutEditor }),
});
if (!response.ok) {
const error = await response.json();
throw new Error(error.error || “Unable to save layout.”);
}
const data = await response.json();
populateSettingsForm(data);
setLayoutStatus(“Layout saved.”);
} catch (error) {
setLayoutStatus(error.message, true);
}
});
}

loadDashboard()
.then(() => loadSiteSettings())
.catch(() => {
setDashboardVisible(false);
});

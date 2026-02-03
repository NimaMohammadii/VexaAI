const DEFAULT_THEME = {
  colors: {
    background: "#0b0c0f",
    primary: "#8f92ff",
    secondary: "#2dd4bf",
    text: "#f4f4f6",
    muted: "#9b9da4",
  },
  typography: {
    fontFamily: "Inter",
    baseFontSize: 16,
    headingScale: 1,
  },
  layout: {
    pagePadding: 32,
    sectionSpacing: 60,
    containerWidth: 1120,
  },
  components: {
    buttonRadius: 999,
    cardRadius: 22,
    inputHeight: 48,
  },
  sections: {
    showHistory: true,
    showCredits: true,
    showMenu: true,
  },
};

const toPx = (value) => `${value}px`;

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const digits =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const value = Number.parseInt(digits, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;

const mixColor = (hex, amount) => {
  const { r, g, b } = hexToRgb(hex);
  const factor = amount;
  const mix = factor > 0 ? 255 : 0;
  return rgbToHex({
    r: r + (mix - r) * Math.abs(factor),
    g: g + (mix - g) * Math.abs(factor),
    b: b + (mix - b) * Math.abs(factor),
  });
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isDark = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
};

const applySectionVisibility = (sections = DEFAULT_THEME.sections) => {
  const historyToggle = document.getElementById("historyToggle");
  const historyPanel = document.getElementById("historyPanel");
  if (historyToggle) {
    historyToggle.hidden = !sections.showHistory;
  }
  if (historyPanel) {
    historyPanel.hidden = !sections.showHistory;
  }

  const creditsRemaining = document.getElementById("creditsRemaining");
  const creditsWrap = creditsRemaining?.closest(".credits-inline");
  if (creditsWrap) {
    creditsWrap.hidden = !sections.showCredits;
  }

  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  const menuOverlay = document.getElementById("menuOverlay");
  if (menuToggle) {
    menuToggle.hidden = !sections.showMenu;
  }
  if (sideMenu) {
    sideMenu.hidden = !sections.showMenu;
    if (!sections.showMenu) {
      sideMenu.classList.remove("is-open");
    }
  }
  if (menuOverlay) {
    if (!sections.showMenu) {
      menuOverlay.hidden = true;
    }
  }
};

export const applyThemeTokens = (theme = DEFAULT_THEME) => {
  const safeTheme = theme || DEFAULT_THEME;
  const root = document.documentElement;
  const background = safeTheme.colors.background;
  const darkMode = isDark(background);
  const bgAlt = mixColor(background, darkMode ? 0.08 : -0.06);
  const surface = mixColor(background, darkMode ? 0.14 : -0.08);
  const panel = mixColor(background, darkMode ? 0.06 : -0.04);
  const border = mixColor(background, darkMode ? 0.2 : -0.15);
  root.style.setProperty("--bg", safeTheme.colors.background);
  root.style.setProperty("--bg-alt", bgAlt);
  root.style.setProperty("--surface", surface);
  root.style.setProperty("--panel", panel);
  root.style.setProperty("--border", border);
  root.style.setProperty("--header-bg", withAlpha(panel, 0.92));
  root.style.setProperty("--tag-bg", mixColor(background, darkMode ? 0.12 : -0.06));
  root.style.setProperty("--chip-bg", mixColor(background, darkMode ? 0.1 : -0.05));
  root.style.setProperty("--primary", safeTheme.colors.primary);
  root.style.setProperty("--primary-dark", safeTheme.colors.primary);
  root.style.setProperty("--secondary", safeTheme.colors.secondary);
  root.style.setProperty("--text", safeTheme.colors.text);
  root.style.setProperty("--muted", safeTheme.colors.muted);
  root.style.setProperty("--container-width", toPx(safeTheme.layout.containerWidth));
  root.style.setProperty("--page-padding", toPx(safeTheme.layout.pagePadding));
  root.style.setProperty("--section-spacing", toPx(safeTheme.layout.sectionSpacing));
  root.style.setProperty("--button-radius", toPx(safeTheme.components.buttonRadius));
  root.style.setProperty("--card-radius", toPx(safeTheme.components.cardRadius));
  root.style.setProperty("--input-height", toPx(safeTheme.components.inputHeight));
  root.style.setProperty("--base-font-size", toPx(safeTheme.typography.baseFontSize));
  root.style.setProperty("--heading-scale", safeTheme.typography.headingScale);
  root.style.setProperty("--font-family", `"${safeTheme.typography.fontFamily}", "Inter", "Vazirmatn", "Segoe UI", system-ui, sans-serif`);
  root.style.setProperty("--tts-shell-max-width", toPx(safeTheme.layout.containerWidth));
  root.style.setProperty("--tts-shell-padding-x", toPx(safeTheme.layout.pagePadding));
  root.style.setProperty("--tts-shell-gap", toPx(Math.max(16, safeTheme.layout.sectionSpacing / 3)));
  root.style.setProperty("--tts-actions-padding-left", toPx(Math.max(0, safeTheme.layout.pagePadding / 5)));
  root.style.setProperty("--tts-player-padding-left", toPx(Math.max(0, safeTheme.layout.pagePadding / 5)));
  root.style.setProperty("--tts-footer-padding-x", toPx(Math.max(0, safeTheme.layout.pagePadding / 5)));
  applySectionVisibility(safeTheme.sections);
};

const fetchTheme = async (preview) => {
  const url = preview ? "/api/theme?preview=1" : "/api/theme";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load theme.");
  }
  return response.json();
};

export const initThemeTokens = async ({ preview = false } = {}) => {
  try {
    const data = await fetchTheme(preview);
    applyThemeTokens(data.theme || DEFAULT_THEME);
  } catch (error) {
    if (preview) {
      const data = await fetchTheme(false);
      applyThemeTokens(data.theme || DEFAULT_THEME);
    } else {
      applyThemeTokens(DEFAULT_THEME);
    }
  }

  const streamUrl = preview ? "/api/theme/stream?preview=1" : "/api/theme/stream";
  const source = new EventSource(streamUrl);
  source.addEventListener("theme", (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload?.theme) {
        applyThemeTokens(payload.theme);
      }
    } catch (error) {
      console.warn("Unable to apply theme update.", error);
    }
  });
  source.addEventListener("error", () => {
    source.close();
  });

  return source;
};

export const getDefaultTheme = () => JSON.parse(JSON.stringify(DEFAULT_THEME));

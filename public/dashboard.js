const usernameForm = document.getElementById("usernameForm");
const usernameInput = document.getElementById("usernameInput");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const usernameDisplay = document.getElementById("usernameDisplay");
const usernameValue = document.getElementById("usernameValue");
const dashboardStatus = document.getElementById("dashboardStatus");

let supabaseClient = null;
let currentUser = null;

const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

const openMenu = () => {
  if (!sideMenu || !menuOverlay) {
    return;
  }
  sideMenu.classList.add("is-open");
  menuOverlay.hidden = false;
  menuToggle?.setAttribute("aria-expanded", "true");
};

const closeMenu = () => {
  if (!sideMenu || !menuOverlay) {
    return;
  }
  sideMenu.classList.remove("is-open");
  menuOverlay.hidden = true;
  menuToggle?.setAttribute("aria-expanded", "false");
};

const toggleMenu = () => {
  if (!sideMenu) {
    return;
  }

  if (sideMenu.classList.contains("is-open")) {
    closeMenu();
    return;
  }

  openMenu();
};

const setStatus = (message = "", isError = false) => {
  if (!dashboardStatus) {
    return;
  }

  dashboardStatus.textContent = message;
  dashboardStatus.classList.toggle("success", Boolean(message) && !isError);
  dashboardStatus.classList.toggle("error", Boolean(message) && isError);
};

const loadPublicConfig = async () => {
  const response = await fetch("/api/public-config");
  if (!response.ok) {
    throw new Error("public-config request failed");
  }

  const data = await response.json();
  return {
    url: String(data?.SUPABASE_URL || "").trim(),
    key: String(data?.SUPABASE_PUBLISHABLE_KEY || "").trim(),
  };
};

const getSupabaseClient = async () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, key } = await loadPublicConfig();
  if (!url || !key) {
    throw new Error("supabase config is missing");
  }

  supabaseClient = window.supabase.createClient(url, key);
  return supabaseClient;
};

const showUsername = (username) => {
  if (usernameValue) {
    usernameValue.textContent = username;
  }

  if (usernameDisplay) {
    usernameDisplay.hidden = false;
  }

  if (usernameForm) {
    usernameForm.hidden = true;
  }
};

const showUsernameEditor = () => {
  if (usernameDisplay) {
    usernameDisplay.hidden = true;
  }

  if (usernameForm) {
    usernameForm.hidden = false;
  }
};

const loadDashboard = async () => {
  try {
    const client = await getSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      window.location.assign("/account.html");
      return;
    }

    currentUser = user;

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("profile lookup skipped:", profileError);
      showUsernameEditor();
      setStatus("Profile unavailable right now. You can continue without it.");
      return;
    }

    const username = String(profile?.username || "").trim();
    if (!username) {
      showUsernameEditor();
      return;
    }

    showUsername(username);
  } catch (error) {
    console.error("dashboard load error:", error);
    setStatus("Unable to load dashboard", true);
  }
};

const saveUsername = async (event) => {
  event.preventDefault();

  if (!currentUser) {
    window.location.assign("/account.html");
    return;
  }

  const username = String(usernameInput?.value || "").trim();
  if (!username) {
    setStatus("Please enter a username", true);
    return;
  }

  if (saveUsernameBtn) {
    saveUsernameBtn.disabled = true;
  }

  setStatus("");

  try {
    const client = await getSupabaseClient();
    const { error } = await client.from("profiles").update({ username }).eq("id", currentUser.id);

    if (error) {
      console.warn("username update skipped:", error);
      showUsername(username);
      setStatus("Username saved locally. Profile storage is unavailable right now.");
      return;
    }

    showUsername(username);
    setStatus("Username saved");
  } catch (error) {
    console.error("username save error:", error);
    setStatus("Unable to save username", true);
  } finally {
    if (saveUsernameBtn) {
      saveUsernameBtn.disabled = false;
    }
  }
};

usernameForm?.addEventListener("submit", (event) => {
  void saveUsername(event);
});

void loadDashboard();

if (menuToggle) {
  menuToggle.addEventListener("click", toggleMenu);
}

if (menuClose) {
  menuClose.addEventListener("click", closeMenu);
}

if (menuOverlay) {
  menuOverlay.addEventListener("click", closeMenu);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

const usernameForm = document.getElementById("usernameForm");
const usernameInput = document.getElementById("usernameInput");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const usernameDisplay = document.getElementById("usernameDisplay");
const usernameValue = document.getElementById("usernameValue");
const dashboardStatus = document.getElementById("dashboardStatus");

let supabaseClient = null;
let currentUser = null;

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
      console.error("profile lookup error:", profileError);
      setStatus("Unable to load profile", true);
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
      console.error("username update error:", error);
      setStatus("Unable to save username", true);
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

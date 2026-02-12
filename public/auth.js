const magicLinkForm = document.getElementById("magicLinkForm");
const emailInput = document.getElementById("emailInput");
const sendMagicLinkBtn = document.getElementById("sendMagicLinkBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const userEmail = document.getElementById("user-email");
const loggedInState = document.getElementById("loggedInState");
const authStatus = document.getElementById("authStatus");

let supabaseClient = null;

const setMessage = (message = "", isError = false) => {
  if (!authStatus) {
    return;
  }

  authStatus.textContent = message;
  authStatus.classList.toggle("success", Boolean(message) && !isError);
  authStatus.classList.toggle("error", Boolean(message) && isError);
};

const setLoggedInState = (session) => {
  const email = session?.user?.email || "";
  const isLoggedIn = Boolean(email);

  if (magicLinkForm) {
    magicLinkForm.hidden = isLoggedIn;
  }

  if (googleSignInBtn) {
    googleSignInBtn.hidden = isLoggedIn;
  }

  if (loggedInState) {
    loggedInState.hidden = !isLoggedIn;
  }

  if (userEmail) {
    userEmail.textContent = email;
  }

  if (isLoggedIn) {
    setMessage("You are logged in");
  }
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

const submitMagicLink = async (event) => {
  event.preventDefault();

  const email = String(emailInput?.value || "").trim();
  if (!email) {
    setMessage("Please enter your email", true);
    return;
  }

  if (sendMagicLinkBtn) {
    sendMagicLinkBtn.disabled = true;
  }
  setMessage("");

  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + "/account.html",
      },
    });

    console.log("magic link response:", data);
    console.error("magic link error:", error);

    if (error) {
      setMessage("Unable to send magic link", true);
      return;
    }

    setMessage("Check your email to continue");
  } catch (error) {
    console.log("magic link response:", null);
    console.error("magic link error:", error);
    setMessage("Unable to send magic link", true);
  } finally {
    if (sendMagicLinkBtn) {
      sendMagicLinkBtn.disabled = false;
    }
  }
};

const continueWithGoogle = async () => {
  if (googleSignInBtn) {
    googleSignInBtn.disabled = true;
  }

  setMessage("");

  try {
    const client = await getSupabaseClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/account.html",
      },
    });

    if (error) {
      setMessage("Unable to continue with Google", true);
      if (googleSignInBtn) {
        googleSignInBtn.disabled = false;
      }
    }
  } catch (error) {
    console.error("google oauth error:", error);
    setMessage("Unable to continue with Google", true);
    if (googleSignInBtn) {
      googleSignInBtn.disabled = false;
    }
  }
};

const initializeAuthState = async () => {
  try {
    const client = await getSupabaseClient();
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      setMessage("Unable to load session", true);
      return;
    }

    const user = session?.user;
    if (!user) {
      return;
    }

    setLoggedInState(session);

    const { data: existingProfile, error: profileError } = await client
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("profile lookup skipped:", profileError);
      window.location.assign("/dashboard.html");
      return;
    }

    if (!existingProfile) {
      const { error: insertError } = await client.from("profiles").insert({
        id: user.id,
        email: user.email,
        username: null,
        created_at: new Date(),
      });

      if (insertError) {
        console.warn("profile insert skipped:", insertError);
        window.location.assign("/dashboard.html");
        return;
      }
    }

    window.location.assign("/dashboard.html");
  } catch (error) {
    console.error("session load error:", error);
    setMessage("Unable to load session", true);
  }
};

magicLinkForm?.addEventListener("submit", (event) => {
  void submitMagicLink(event);
});

googleSignInBtn?.addEventListener("click", () => {
  void continueWithGoogle();
});

void initializeAuthState();

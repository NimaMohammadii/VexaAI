const magicLinkForm = document.getElementById("magicLinkForm");
const emailInput = document.getElementById("emailInput");
const sendMagicLinkBtn = document.getElementById("sendMagicLinkBtn");
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

magicLinkForm?.addEventListener("submit", (event) => {
  void submitMagicLink(event);
});

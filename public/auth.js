const ACCOUNT_STORAGE_KEY = "vexa_account";

const authCard = document.getElementById("authCard");
const profileCard = document.getElementById("profileCard");
const profileInfo = document.getElementById("profileInfo");
const authStatus = document.getElementById("authStatus");
const logoutBtn = document.getElementById("logoutBtn");
const sendCodeForm = document.getElementById("sendCodeForm");
const verifyCodeForm = document.getElementById("verifyCodeForm");
const emailInput = document.getElementById("emailInput");
const otpInput = document.getElementById("otpInput");

let supabaseClient = null;

const setStatus = (message, isError = false) => {
  if (!authStatus) {
    return;
  }
  authStatus.textContent = message;
  authStatus.classList.toggle("error", Boolean(isError));
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const saveAccount = (user) => {
  if (!user?.id || !user?.email) {
    return;
  }
  try {
    localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify({
        id: user.id,
        email: user.email,
        provider: "email_otp",
      })
    );
  } catch (error) {
    console.warn("Unable to persist account.", error);
  }
};

const clearAccount = () => {
  try {
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to clear account.", error);
  }
};

const renderProfile = (user) => {
  const isLoggedIn = Boolean(user);
  if (profileCard) {
    profileCard.hidden = !isLoggedIn;
  }
  if (authCard) {
    authCard.hidden = isLoggedIn;
  }

  if (profileInfo && isLoggedIn) {
    profileInfo.textContent = `Email: ${user.email}`;
  }
};

const mapOtpError = (message = "") => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid email")) {
    return "ایمیل نامعتبر است.";
  }
  if (lower.includes("expired") || lower.includes("has expired")) {
    return "کد منقضی شده است.";
  }
  if (lower.includes("invalid token") || lower.includes("token") || lower.includes("otp")) {
    return "کد اشتباه است.";
  }
  return "خطا در احراز هویت. دوباره تلاش کنید.";
};

const loadConfig = async () => {
  const response = await fetch("/api/public-config");
  if (!response.ok) {
    throw new Error("Unable to load auth config.");
  }
  const data = await response.json();
  const url = data?.SUPABASE_URL;
  const key = data?.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase config is missing.");
  }
  return { url, key };
};

const initSupabase = async () => {
  const { url, key } = await loadConfig();
  supabaseClient = window.supabase.createClient(url, key);

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    saveAccount(session.user);
    renderProfile(session.user);
  }

  supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
    if (currentSession?.user) {
      saveAccount(currentSession.user);
      renderProfile(currentSession.user);
    } else {
      clearAccount();
      renderProfile(null);
    }
  });
};

sendCodeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const email = normalizeEmail(emailInput?.value);
  if (!isValidEmail(email)) {
    setStatus("ایمیل نامعتبر است.", true);
    return;
  }

  try {
    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    if (error) {
      throw error;
    }
    setStatus("کد تایید ارسال شد. ایمیل خود را بررسی کنید.");
  } catch (error) {
    setStatus(mapOtpError(error?.message), true);
  }
});

verifyCodeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const email = normalizeEmail(emailInput?.value);
  const token = (otpInput?.value || "").trim();

  if (!isValidEmail(email)) {
    setStatus("ایمیل نامعتبر است.", true);
    return;
  }

  if (!/^\d{6}$/.test(token)) {
    setStatus("کد باید ۶ رقمی باشد.", true);
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      throw error;
    }

    if (data?.user) {
      saveAccount(data.user);
    }

    setStatus("ورود با موفقیت انجام شد.");
    window.location.assign("/index.html");
  } catch (error) {
    setStatus(mapOtpError(error?.message), true);
  }
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.warn(error);
  }
  clearAccount();
  renderProfile(null);
  setStatus("Logged out.");
});

initSupabase().catch((error) => {
  console.error(error);
  setStatus("تنظیمات احراز هویت Supabase ناقص است.", true);
});

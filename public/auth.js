const ACCOUNT_STORAGE_KEY = "vexa_account";

const authCard = document.getElementById("authCard");
const verifyCodeCard = document.getElementById("verifyCodeCard");
const completeProfileCard = document.getElementById("completeProfileCard");
const dashboardCard = document.getElementById("dashboardCard");

const sendCodeForm = document.getElementById("sendCodeForm");
const verifyCodeForm = document.getElementById("verifyCodeForm");
const completeProfileForm = document.getElementById("completeProfileForm");

const emailInput = document.getElementById("emailInput");
const otpInput = document.getElementById("otpInput");
const usernameInput = document.getElementById("usernameInput");

const sendCodeBtn = document.getElementById("sendCodeBtn");
const verifyCodeBtn = document.getElementById("verifyCodeBtn");
const completeProfileBtn = document.getElementById("completeProfileBtn");
const backToEmailBtn = document.getElementById("backToEmailBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authStatus = document.getElementById("authStatus");
const dashboardEmail = document.getElementById("dashboardEmail");
const dashboardState = document.getElementById("dashboardState");
const verifyEmailValue = document.getElementById("verifyEmailValue");

let supabaseClient = null;
const state = {
  view: "enter_email",
  loading: false,
  success: "",
  error: "",
  session: null,
  email: "",
};

const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const mapOtpError = (message = "") => {
  const lower = message.toLowerCase();
  if (lower.includes("signups not allowed") || lower.includes("signup is disabled")) {
    return "ساخت اکانت جدید در تنظیمات Supabase غیرفعال است.";
  }
  if (lower.includes("email rate limit") || lower.includes("rate limit")) {
    return "تعداد درخواست‌های ارسال کد زیاد است. چند دقیقه بعد دوباره تلاش کنید.";
  }
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

const setMessage = ({ success = "", error = "" }) => {
  state.success = success;
  state.error = error;
  if (!authStatus) {
    return;
  }
  authStatus.textContent = error || success;
  authStatus.classList.toggle("error", Boolean(error));
  authStatus.classList.toggle("success", Boolean(success));
};

const setLoading = (loading) => {
  state.loading = loading;
  [sendCodeBtn, verifyCodeBtn, completeProfileBtn, logoutBtn, backToEmailBtn].forEach((button) => {
    if (button) {
      button.disabled = loading;
    }
  });
};

const saveAccount = (user) => {
  if (!user?.id || !user?.email) {
    return;
  }
  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      provider: "email_otp",
    })
  );
};

const clearAccount = () => {
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
};

const render = () => {
  const isEnterEmail = state.view === "enter_email";
  const isEnterCode = state.view === "enter_code";
  const isCompleteProfile = state.view === "complete_profile";
  const isDashboard = state.view === "dashboard";

  if (authCard) {
    authCard.hidden = !isEnterEmail;
  }
  if (verifyCodeCard) {
    verifyCodeCard.hidden = !isEnterCode;
  }

  if (verifyEmailValue) {
    verifyEmailValue.textContent = state.email || normalizeEmail(emailInput?.value || "") || "-";
  }
  if (completeProfileCard) {
    completeProfileCard.hidden = !isCompleteProfile;
  }
  if (dashboardCard) {
    dashboardCard.hidden = !isDashboard;
  }

  if (dashboardEmail) {
    dashboardEmail.textContent = state.session?.user?.email || "-";
  }

  if (dashboardState) {
    dashboardState.textContent = state.session?.user ? "Logged in" : "Logged out";
  }
};

const setView = (view) => {
  state.view = view;
  render();
};

const userNeedsProfile = (user) => !user?.user_metadata?.username;

const syncProfileRecord = async ({ userId, email, username }) => {
  const client = await getSupabaseClient();
  const { error } = await client.from("users").upsert(
    {
      id: userId,
      email,
      username,
    },
    { onConflict: "username" }
  );

  if (error) {
    throw error;
  }
};

const sendOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    setMessage({ error: "ایمیل را وارد کنید." });
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    setMessage({ error: "ایمیل نامعتبر است." });
    return;
  }

  console.log("Sending OTP request to Supabase");

  setLoading(true);
  setMessage({});
  try {
    const client = await getSupabaseClient();
    const { error } = await client.auth.signInWithOtp({ email: normalizedEmail });
    if (error) {
      console.error("sendOtp error:", error.message);
      setMessage({ error: mapOtpError(error.message) });
      return;
    }

    state.email = normalizedEmail;
    if (emailInput) {
      emailInput.value = normalizedEmail;
    }
    if (otpInput) {
      otpInput.value = "";
      otpInput.focus();
    }
    setView("enter_code");
    setMessage({ success: "کد به ایمیل ارسال شد." });
  } catch (error) {
    console.error("sendOtp fatal error:", error);
    setMessage({ error: mapOtpError(String(error?.message || "")) });
  } finally {
    setLoading(false);
  }
};

const verifyOtp = async (email, code) => {
  const normalizedEmail = normalizeEmail(email);
  const token = (code || "").trim();

  if (!isValidEmail(normalizedEmail)) {
    setMessage({ error: "ایمیل نامعتبر است." });
    return;
  }

  if (!/^\d{6}$/.test(token)) {
    setMessage({ error: "کد باید ۶ رقمی باشد." });
    return;
  }

  setLoading(true);
  setMessage({});

  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "email",
    });

    if (error) {
      setMessage({ error: mapOtpError(error.message) });
      return;
    }

    state.session = data?.session || null;
    saveAccount(data?.user);

    if (userNeedsProfile(data?.user)) {
      setView("complete_profile");
      setMessage({ success: "اکانت شما ساخته شد. لطفاً پروفایل را تکمیل کنید." });
      return;
    }

    setView("dashboard");
    setMessage({ success: "ورود با موفقیت انجام شد." });
  } catch (error) {
    console.error("verifyOtp fatal error:", error);
    setMessage({ error: mapOtpError(String(error?.message || "")) });
  } finally {
    setLoading(false);
  }
};

const completeProfile = async () => {
  const username = (usernameInput?.value || "").trim().toLowerCase();
  if (!username) {
    setMessage({ error: "username الزامی است." });
    return;
  }

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    setMessage({ error: "username باید بین ۳ تا ۲۴ کاراکتر و فقط شامل حروف انگلیسی، عدد یا _ باشد." });
    return;
  }

  const user = state.session?.user;
  if (!user?.id || !user?.email) {
    setMessage({ error: "جلسه معتبر نیست. دوباره وارد شوید." });
    setView("enter_email");
    return;
  }

  setLoading(true);
  setMessage({});

  try {
    const client = await getSupabaseClient();
    const { error: metadataError } = await client.auth.updateUser({
      data: { username },
    });

    if (metadataError) {
      throw metadataError;
    }

    await syncProfileRecord({
      userId: user.id,
      email: user.email,
      username,
    });

    const {
      data: { session },
    } = await client.auth.getSession();

    state.session = session;
    setView("dashboard");
    setMessage({ success: "پروفایل تکمیل شد." });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("duplicate") || message.includes("unique")) {
      setMessage({ error: "این username قبلاً استفاده شده است." });
      return;
    }
    setMessage({ error: "ثبت پروفایل ناموفق بود. دوباره تلاش کنید." });
  } finally {
    setLoading(false);
  }
};

const handleSession = (session) => {
  state.session = session || null;

  if (!session?.user) {
    clearAccount();
    setView("enter_email");
    return;
  }

  saveAccount(session.user);

  if (userNeedsProfile(session.user)) {
    setView("complete_profile");
    return;
  }

  setView("dashboard");
};

const initSupabase = async () => {
  const client = await getSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  handleSession(session);

  client.auth.onAuthStateChange((_event, currentSession) => {
    handleSession(currentSession);
  });
};

sendCodeForm?.addEventListener("submit", (event) => event.preventDefault());
verifyCodeForm?.addEventListener("submit", (event) => event.preventDefault());
completeProfileForm?.addEventListener("submit", (event) => event.preventDefault());

sendCodeBtn?.addEventListener("click", () => {
  void sendOtp(emailInput?.value);
});

verifyCodeBtn?.addEventListener("click", () => {
  void verifyOtp(emailInput?.value || state.email, otpInput?.value);
});

completeProfileBtn?.addEventListener("click", () => {
  void completeProfile();
});

backToEmailBtn?.addEventListener("click", () => {
  if (otpInput) {
    otpInput.value = "";
  }
  state.email = "";
  setView("enter_email");
  setMessage({});
});

logoutBtn?.addEventListener("click", async () => {
  setLoading(true);
  try {
    const client = await getSupabaseClient();
    await client.auth.signOut();
    handleSession(null);
    setMessage({ success: "Logged out." });
  } catch (error) {
    setMessage({ error: "خروج از حساب ناموفق بود." });
  } finally {
    setLoading(false);
  }
});

initSupabase().catch((error) => {
  console.error(error);
  setMessage({ error: "تنظیمات احراز هویت Supabase ناقص است." });
});

const adminLoginForm = document.getElementById("adminLoginForm");
const adminKeyInput = document.getElementById("adminKey");

const setErrorState = (isError) => {
  adminKeyInput.classList.toggle("is-error", isError);
};

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setErrorState(false);

  const key = adminKeyInput.value.trim();
  if (!key) {
    setErrorState(true);
    return;
  }

  adminKeyInput.disabled = true;
  const submitButton = adminLoginForm.querySelector("button");
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      setErrorState(true);
      adminKeyInput.value = "";
      return;
    }

    window.location.href = "/admin";
  } catch (error) {
    setErrorState(true);
  } finally {
    adminKeyInput.disabled = false;
    submitButton.disabled = false;
    adminKeyInput.focus();
  }
});

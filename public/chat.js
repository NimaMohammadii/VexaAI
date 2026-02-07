const messageList = document.getElementById("messageList");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

const messageTemplate = document.getElementById("messageTemplate");
const systemTemplate = document.getElementById("systemTemplate");
const typingTemplate = document.getElementById("typingTemplate");

const scriptedReplies = [
  "Absolutely — tell me the tone you want, and I can draft the perfect response.",
  "Great prompt. I can structure this into a concise plan in seconds.",
  "Understood. Want this to sound more formal, friendly, or direct?",
  "I can help with that. Share one more detail and I'll tailor it for you.",
];

let isResponding = false;
let replyCursor = 0;
let userPinnedToBottom = true;

const clampTextarea = () => {
  chatInput.style.height = "auto";
  const nextHeight = Math.min(chatInput.scrollHeight, 180);
  chatInput.style.height = `${nextHeight}px`;
};

const isNearBottom = () => {
  const threshold = 64;
  const distanceFromBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
  return distanceFromBottom <= threshold;
};

const scrollToLatest = (behavior = "smooth") => {
  messageList.scrollTo({
    top: messageList.scrollHeight,
    behavior,
  });
};

const maintainBottomLock = () => {
  if (userPinnedToBottom || document.activeElement === chatInput) {
    scrollToLatest("auto");
  }
};

const appendMessage = ({ role, content }) => {
  const node = messageTemplate.content.firstElementChild.cloneNode(true);
  node.classList.add(role === "user" ? "message--user" : "message--assistant");
  node.querySelector(".message-text").textContent = content;
  messageList.appendChild(node);
  scrollToLatest();
  return node;
};

const appendSystemMessage = (content) => {
  if (!systemTemplate) {
    return;
  }

  const node = systemTemplate.content.firstElementChild.cloneNode(true);
  node.textContent = content;
  messageList.appendChild(node);
  scrollToLatest();
};

const showTypingIndicator = () => {
  const node = typingTemplate.content.firstElementChild.cloneNode(true);
  messageList.appendChild(node);
  scrollToLatest();
  return node;
};

const updateSendState = () => {
  const canSend = chatInput.value.trim().length > 0;
  sendButton.disabled = !canSend || isResponding;
};

const updateViewportSizing = () => {
  const viewport = window.visualViewport;
  if (!viewport) {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    return;
  }

  const appHeight = Math.round(viewport.height + viewport.offsetTop);
  document.documentElement.style.setProperty("--app-height", `${appHeight}px`);
};

const sendMessage = async () => {
  const value = chatInput.value.trim();
  if (!value || isResponding) {
    return;
  }

  appendMessage({ role: "user", content: value });
  chatInput.value = "";
  isResponding = true;
  clampTextarea();
  updateSendState();

  const typingNode = showTypingIndicator();
  const waitMs = Math.max(650, Math.min(1500, 350 + value.length * 14));
  await new Promise((resolve) => setTimeout(resolve, waitMs));

  typingNode.remove();
  const response = scriptedReplies[replyCursor % scriptedReplies.length];
  replyCursor += 1;
  appendMessage({ role: "assistant", content: response });

  isResponding = false;
  updateSendState();
  chatInput.focus({ preventScroll: true });
};

chatInput.addEventListener("input", () => {
  clampTextarea();
  updateSendState();
  maintainBottomLock();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener("focus", () => {
  updateViewportSizing();
  requestAnimationFrame(() => scrollToLatest("auto"));
});

chatInput.addEventListener("blur", () => {
  setTimeout(() => {
    updateViewportSizing();
    maintainBottomLock();
  }, 80);
});

messageList.addEventListener(
  "scroll",
  () => {
    userPinnedToBottom = isNearBottom();
  },
  { passive: true }
);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    updateViewportSizing();
    maintainBottomLock();
  });
  window.visualViewport.addEventListener("scroll", updateViewportSizing);
}

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    updateViewportSizing();
    maintainBottomLock();
  }, 120);
});

window.addEventListener("resize", updateViewportSizing);

appendSystemMessage("Vexa is online");
appendMessage({
  role: "assistant",
  content: "Hi! I'm Vexa. Ask me anything and I'll jump right in.",
});

clampTextarea();
updateSendState();
updateViewportSizing();
chatInput.focus({ preventScroll: true });

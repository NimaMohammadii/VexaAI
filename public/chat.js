const messageList = document.getElementById("messageList");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

const messageTemplate = document.getElementById("messageTemplate");
const systemTemplate = document.getElementById("systemTemplate");
const typingTemplate = document.getElementById("typingTemplate");

const chatHistory = [];
const MAX_HISTORY = 12;

let isResponding = false;
let userPinnedToBottom = true;

const RTL_TEXT_PATTERN = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

const resolveDirection = (text = "") => (RTL_TEXT_PATTERN.test(text) ? "rtl" : "ltr");


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
  const messageText = node.querySelector(".message-text");
  const direction = resolveDirection(content);
  messageText.textContent = content;
  messageText.setAttribute("dir", direction);
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

const updateInputDirection = () => {
  const direction = resolveDirection(chatInput.value);
  chatInput.setAttribute("dir", direction);
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

  try {
    chatHistory.push({ role: "user", content: value });
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: value,
        history: chatHistory,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || "Chat request failed.");
    }

    const data = await response.json();
    const reply = data?.message || "No response received. Please try again.";
    typingNode.remove();
    appendMessage({ role: "assistant", content: reply });

    chatHistory.push({ role: "assistant", content: reply });
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }
  } catch (error) {
    typingNode.remove();
    appendMessage({
      role: "assistant",
      content: "Sorry, I can't reach GPT right now. Please try again in a moment.",
    });
  } finally {
    isResponding = false;
    updateSendState();
    chatInput.focus({ preventScroll: true });
  }
};

chatInput.addEventListener("input", () => {
  clampTextarea();
  updateSendState();
  updateInputDirection();
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
updateInputDirection();
updateViewportSizing();
chatInput.focus({ preventScroll: true });

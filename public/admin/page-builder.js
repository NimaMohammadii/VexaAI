const editModeToggle = document.getElementById("editModeToggle");
const builderCanvas = document.getElementById("builderCanvas");
const removeComponentBtn = document.getElementById("removeComponentBtn");
const builderStatus = document.getElementById("builderStatus");
const addToggle = document.getElementById("addToggle");
const addPanel = document.getElementById("addPanel");

const DEFAULT_LAYOUT = [
  { id: "header", type: "Header", props: { title: "Text to Speech" } },
  { id: "voiceSelector", type: "VoiceSelector", props: { selectedVoice: "Rachel" } },
  { id: "welcomeText", type: "TextBlock", props: { text: "Generate instant voice from any script." } },
];

const state = {
  layout: [],
  editMode: false,
  selectedId: null,
  draggingId: null,
};

const allowedTypes = new Set(["Header", "VoiceSelector", "Menu", "Button", "TextBlock"]);

const safeText = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const generateId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const fetchLayout = async () => {
  const response = await fetch("/api/admin/layout");
  if (!response.ok) {
    throw new Error("Unable to load layout.");
  }
  const data = await response.json();
  return Array.isArray(data.layout) ? data.layout : DEFAULT_LAYOUT;
};

const saveLayout = async () => {
  await fetch("/api/admin/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout: state.layout }),
  });
};

const setEditMode = (enabled) => {
  state.editMode = enabled;
  if (builderStatus) {
    builderStatus.textContent = enabled ? "Edit mode enabled" : "View mode";
  }
  if (!enabled) {
    state.selectedId = null;
  }
  updateSelection();
  renderLayout();
};

const updateSelection = () => {
  if (removeComponentBtn) {
    removeComponentBtn.disabled = !state.selectedId;
  }
};

const selectComponent = (id) => {
  if (!state.editMode) {
    return;
  }
  state.selectedId = id;
  updateSelection();
  renderLayout();
};

const renderLayout = () => {
  if (!builderCanvas) {
    return;
  }
  builderCanvas.innerHTML = "";
  state.layout.forEach((item) => {
    const component = renderComponent(item);
    if (state.editMode) {
      component.dataset.draggable = "true";
      component.addEventListener("pointerdown", onDragStart);
    }
    builderCanvas.appendChild(component);
  });
};

const renderComponent = (item) => {
  const wrapper = document.createElement("div");
  wrapper.className = "builder-component";
  wrapper.dataset.id = item.id;
  wrapper.dataset.type = item.type;
  if (item.id === state.selectedId) {
    wrapper.classList.add("is-selected");
  }
  wrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    selectComponent(item.id);
  });

  if (item.type === "Header") {
    const title = document.createElement("h2");
    title.className = "editable-text";
    title.textContent = safeText(item.props?.title, "Page title");
    attachEditable(title, item.id, "title");
    wrapper.appendChild(title);
  }

  if (item.type === "VoiceSelector") {
    const row = document.createElement("div");
    row.className = "voice-selector";
    const label = document.createElement("span");
    label.textContent = "Selected voice";
    const select = document.createElement("select");
    ["Rachel", "Maya", "Arman", "Noah"].forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice;
      option.textContent = voice;
      if (voice === item.props?.selectedVoice) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.disabled = !state.editMode;
    select.addEventListener("change", () => {
      updateComponentProps(item.id, { selectedVoice: select.value });
    });
    row.appendChild(label);
    row.appendChild(select);
    wrapper.appendChild(row);
  }

  if (item.type === "Menu") {
    const title = document.createElement("p");
    title.className = "editable-text";
    title.textContent = "Menu";
    const list = document.createElement("ul");
    list.className = "menu-list";
    const items = Array.isArray(item.props?.items) ? item.props.items : ["Home", "Features", "Pricing"];
    items.forEach((entry, index) => {
      const pill = document.createElement("li");
      pill.className = "menu-pill editable-text";
      pill.textContent = safeText(entry, `Menu ${index + 1}`);
      attachEditable(pill, item.id, "items", index);
      list.appendChild(pill);
    });
    wrapper.appendChild(title);
    wrapper.appendChild(list);
  }

  if (item.type === "Button") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary editable-text";
    button.textContent = safeText(item.props?.label, "Click me");
    attachEditable(button, item.id, "label");
    wrapper.appendChild(button);
  }

  if (item.type === "TextBlock") {
    const text = document.createElement("p");
    text.className = "editable-text";
    text.textContent = safeText(item.props?.text, "Editable text block");
    attachEditable(text, item.id, "text");
    wrapper.appendChild(text);
  }

  if (state.editMode) {
    const hint = document.createElement("div");
    hint.className = "drag-hint";
    hint.textContent = "Drag to reorder • Click text to edit";
    wrapper.appendChild(hint);
  }

  return wrapper;
};

const attachEditable = (element, id, key, index = null) => {
  element.addEventListener("click", (event) => {
    if (!state.editMode) {
      return;
    }
    event.stopPropagation();
    element.setAttribute("contenteditable", "true");
    element.focus();
  });

  element.addEventListener("blur", async () => {
    if (!state.editMode) {
      return;
    }
    element.setAttribute("contenteditable", "false");
    const newValue = element.textContent || "";
    if (key === "items") {
      const current = Array.isArray(getComponent(id)?.props?.items) ? [...getComponent(id).props.items] : [];
      current[index] = safeText(newValue, `Menu ${index + 1}`);
      await updateComponentProps(id, { items: current });
      return;
    }
    await updateComponentProps(id, { [key]: safeText(newValue, "Editable") });
  });
};

const getComponent = (id) => state.layout.find((item) => item.id === id);

const updateComponentProps = async (id, nextProps) => {
  state.layout = state.layout.map((item) => {
    if (item.id !== id) {
      return item;
    }
    return {
      ...item,
      props: {
        ...item.props,
        ...nextProps,
      },
    };
  });
  renderLayout();
  await saveLayout();
};

const addComponent = async (type) => {
  if (!allowedTypes.has(type)) {
    return;
  }
  const next = { id: generateId(), type, props: {} };
  if (type === "Menu") {
    next.props.items = ["Home", "Features", "Pricing"];
  }
  if (type === "Button") {
    next.props.label = "Click me";
  }
  if (type === "TextBlock") {
    next.props.text = "Editable text block";
  }
  state.layout = [...state.layout, next];
  renderLayout();
  await saveLayout();
};

const removeSelected = async () => {
  if (!state.selectedId) {
    return;
  }
  state.layout = state.layout.filter((item) => item.id !== state.selectedId);
  state.selectedId = null;
  renderLayout();
  updateSelection();
  await saveLayout();
};

const onDragStart = (event) => {
  if (!state.editMode) {
    return;
  }
  if (event.target.closest(".editable-text")) {
    return;
  }
  const component = event.currentTarget;
  const id = component.dataset.id;
  state.draggingId = id;
  component.classList.add("is-dragging");
  component.setPointerCapture(event.pointerId);
  component.addEventListener("pointermove", onDragMove);
  component.addEventListener("pointerup", onDragEnd);
  component.addEventListener("pointercancel", onDragEnd);
};

const onDragMove = (event) => {
  if (!state.draggingId) {
    return;
  }
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const dropTarget = target?.closest(".builder-component");
  if (!dropTarget || dropTarget.dataset.id === state.draggingId) {
    return;
  }
  const dragIndex = state.layout.findIndex((item) => item.id === state.draggingId);
  const dropIndex = state.layout.findIndex((item) => item.id === dropTarget.dataset.id);
  if (dragIndex < 0 || dropIndex < 0) {
    return;
  }
  const next = [...state.layout];
  const [moved] = next.splice(dragIndex, 1);
  next.splice(dropIndex, 0, moved);
  state.layout = next;
  renderLayout();
};

const onDragEnd = async (event) => {
  const component = event.currentTarget;
  component.classList.remove("is-dragging");
  component.releasePointerCapture(event.pointerId);
  component.removeEventListener("pointermove", onDragMove);
  component.removeEventListener("pointerup", onDragEnd);
  component.removeEventListener("pointercancel", onDragEnd);
  state.draggingId = null;
  await saveLayout();
};

const handleCanvasClick = () => {
  if (!state.editMode) {
    return;
  }
  state.selectedId = null;
  updateSelection();
  renderLayout();
};

const init = async () => {
  try {
    state.layout = await fetchLayout();
  } catch (error) {
    state.layout = DEFAULT_LAYOUT;
  }
  renderLayout();
  builderCanvas?.addEventListener("click", handleCanvasClick);
  editModeToggle?.addEventListener("change", (event) => setEditMode(event.target.checked));
  removeComponentBtn?.addEventListener("click", removeSelected);
  addToggle?.addEventListener("click", () => {
    if (!addPanel) {
      return;
    }
    addPanel.hidden = !addPanel.hidden;
  });
  addPanel?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-add]");
    if (!button) {
      return;
    }
    await addComponent(button.dataset.add);
    addPanel.hidden = true;
  });
};

init();

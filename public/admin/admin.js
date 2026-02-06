const STORAGE_KEY = "vexa-admin-style-overrides";
const pageSelector = document.getElementById("pageSelector");
const elementSelector = document.getElementById("elementSelector");
const fieldsContainer = document.getElementById("fieldsContainer");
const siteFrame = document.getElementById("siteFrame");

const fieldConfig = [
  { key: "left", label: "موقعیت افقی (X)" },
  { key: "top", label: "موقعیت عمودی (Y)" },
  { key: "width", label: "عرض" },
  { key: "height", label: "ارتفاع" },
  { key: "fontSize", label: "اندازه فونت" },
  { key: "borderRadius", label: "گردی گوشه" },
  { key: "padding", label: "پدینگ" },
  { key: "margin", label: "مارجین" },
];

let frameDoc = null;
let currentPageKey = "home";

const pageKeyMap = {
  "index.html": "home",
  "text-to-speech.html": "text-to-speech",
  "live-translate.html": "live-translate",
  "vexa-assistant.html": "vexa-assistant",
  "voices.html": "voices",
  "about.html": "about",
  "pricing.html": "pricing",
  "credits.html": "credits",
  "how-it-works.html": "how-it-works",
};

const resolvePageKey = (urlPath) => {
  const file = urlPath.split("/").pop() || "index.html";
  return pageKeyMap[file] || file.replace(".html", "");
};

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const saveStorage = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const isVisibleElement = (element) => {
  const style = frameDoc.defaultView.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
};

const getElements = () => {
  const nodes = [...frameDoc.querySelectorAll("[data-admin-id]")].filter(isVisibleElement);
  nodes.sort((a, b) => (a.dataset.adminName || "").localeCompare(b.dataset.adminName || "fa"));
  return nodes;
};

const parseNumber = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const getSelectedElement = () => frameDoc.querySelector(`[data-admin-id="${elementSelector.value}"]`);

const buildFields = () => {
  fieldsContainer.innerHTML = "";
  const selected = getSelectedElement();
  if (!selected) {
    return;
  }

  const computed = frameDoc.defaultView.getComputedStyle(selected);

  fieldConfig.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.textContent = item.label;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "1";
    input.value = parseNumber(computed[item.key]);

    input.addEventListener("input", () => {
      const value = parseNumber(input.value);
      if (["left", "top"].includes(item.key)) {
        const currentPosition = frameDoc.defaultView.getComputedStyle(selected).position;
        if (currentPosition === "static") {
          selected.style.position = "relative";
        }
      }
      selected.style[item.key] = `${value}px`;

      const storage = readStorage();
      storage[currentPageKey] = storage[currentPageKey] || {};
      storage[currentPageKey][selected.dataset.adminId] = storage[currentPageKey][selected.dataset.adminId] || {};
      storage[currentPageKey][selected.dataset.adminId][item.key] = value;
      saveStorage(storage);
    });

    wrap.append(label, input);
    fieldsContainer.appendChild(wrap);
  });
};

const fillElementList = () => {
  const elements = getElements();
  elementSelector.innerHTML = "";
  elements.forEach((element) => {
    const option = document.createElement("option");
    option.value = element.dataset.adminId;
    option.textContent = `${element.dataset.adminName} (${element.dataset.adminId})`;
    elementSelector.appendChild(option);
  });
  if (elements.length) {
    elementSelector.value = elements[0].dataset.adminId;
  }
  buildFields();
};

const loadPage = () => {
  const target = pageSelector.value;
  currentPageKey = resolvePageKey(target);
  siteFrame.src = target;
};

siteFrame.addEventListener("load", () => {
  frameDoc = siteFrame.contentDocument;
  fillElementList();
});

pageSelector.addEventListener("change", loadPage);
elementSelector.addEventListener("change", buildFields);

loadPage();

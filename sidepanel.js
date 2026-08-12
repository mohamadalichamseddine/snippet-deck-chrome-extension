const STORAGE_KEY = "snippetdeck_blocks";

/** @type {{id: string, title: string, content: string}[]} */
let blocks = [];
let editingId = null; // null = creating a new card
let searchQuery = "";

const els = {
  list: document.getElementById("cardList"),
  search: document.getElementById("searchInput"),
  newBtn: document.getElementById("newCardBtn"),
  overlay: document.getElementById("editorOverlay"),
  heading: document.getElementById("editorHeading"),
  title: document.getElementById("editorTitle"),
  content: document.getElementById("editorContent"),
  saveBtn: document.getElementById("saveBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  closeBtn: document.getElementById("editorClose"),
  deleteBtn: document.getElementById("deleteBtn"),
  toast: document.getElementById("toast"),
};

init();

async function init() {
  blocks = await loadBlocks();
  render();

  els.search.addEventListener("input", () => {
    searchQuery = els.search.value.trim().toLowerCase();
    render();
  });

  els.newBtn.addEventListener("click", () => openEditor(null));
  els.cancelBtn.addEventListener("click", closeEditor);
  els.closeBtn.addEventListener("click", closeEditor);
  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay) closeEditor();
  });
  els.saveBtn.addEventListener("click", saveEditor);
  els.deleteBtn.addEventListener("click", deleteEditing);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.overlay.hidden) closeEditor();
  });
}

// ---------- storage ----------

function loadBlocks() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []);
    });
  });
}

function persist() {
  chrome.storage.local.set({ [STORAGE_KEY]: blocks });
}

// ---------- rendering ----------

function render() {
  const filtered = searchQuery
    ? blocks.filter((b) => b.title.toLowerCase().includes(searchQuery))
    : blocks;

  els.list.innerHTML = "";

  if (searchQuery && filtered.length === 0) {
    const msg = document.createElement("p");
    msg.className = "empty-body";
    msg.style.padding = "12px 2px";
    msg.textContent = `No cards match "${els.search.value.trim()}".`;
    els.list.appendChild(msg);
    return;
  }

  for (const block of filtered) {
    els.list.appendChild(renderCard(block));
  }
}

function renderCard(block) {
  const card = document.createElement("div");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Copy card: ${block.title}`);
  card.dataset.id = block.id;

  const row = document.createElement("div");
  row.className = "card-row";

  const textWrap = document.createElement("div");
  textWrap.style.minWidth = "0";
  textWrap.style.flex = "1";

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = block.title;

  const preview = document.createElement("p");
  preview.className = "card-preview";
  preview.textContent = block.content;

  textWrap.appendChild(title);
  textWrap.appendChild(preview);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.type = "button";
  editBtn.setAttribute("aria-label", `Edit ${block.title}`);
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openEditor(block.id);
  });

  actions.appendChild(editBtn);

  row.appendChild(textWrap);
  row.appendChild(actions);
  card.appendChild(row);

  const activate = () => copyBlock(block, card);
  card.addEventListener("click", activate);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  });

  return card;
}

// ---------- copy ----------

async function copyBlock(block, cardEl) {
  try {
    await navigator.clipboard.writeText(block.content);
  } catch (err) {
    showToast("Couldn't copy — try again");
    return;
  }
  cardEl.classList.remove("stamped");
  // restart animation if clicked again quickly
  void cardEl.offsetWidth;
  cardEl.classList.add("stamped");
  showToast(`Copied "${block.title}"`);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  // restart animation
  els.toast.style.animation = "none";
  void els.toast.offsetWidth;
  els.toast.style.animation = "";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.toast.hidden = true;
  }, 1600);
}

// ---------- editor ----------

function openEditor(id) {
  editingId = id;
  const existing = id ? blocks.find((b) => b.id === id) : null;

  els.heading.textContent = existing ? "Edit card" : "New card";
  els.title.value = existing ? existing.title : "";
  els.content.value = existing ? existing.content : "";
  els.deleteBtn.hidden = !existing;

  els.overlay.hidden = false;
  els.title.focus();
}

function closeEditor() {
  els.overlay.hidden = true;
  editingId = null;
}

function saveEditor() {
  const title = els.title.value.trim();
  const content = els.content.value.trim();

  if (!title || !content) {
    showToast("A card needs both a title and content");
    return;
  }

  if (editingId) {
    const block = blocks.find((b) => b.id === editingId);
    block.title = title;
    block.content = content;
  } else {
    blocks.unshift({ id: makeId(), title, content });
  }

  persist();
  closeEditor();
  render();
}

function deleteEditing() {
  if (!editingId) return;
  blocks = blocks.filter((b) => b.id !== editingId);
  persist();
  closeEditor();
  render();
}

function makeId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

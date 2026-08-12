const STORAGE_KEY = "snippetdeck_blocks";

/** @type {{id: string, title: string, content: string}[]} */
let blocks = [];
let editingId = null; // null = creating a new card

const els = {
  list: document.getElementById("cardList"),
  newBtn: document.getElementById("newCardBtn"),
  overlay: document.getElementById("editorOverlay"),
  heading: document.getElementById("editorHeading"),
  title: document.getElementById("editorTitle"),
  content: document.getElementById("editorContent"),
  saveBtn: document.getElementById("saveBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  closeBtn: document.getElementById("editorClose"),
  deleteBtn: document.getElementById("deleteBtn"),
};

init();

async function init() {
  blocks = await loadBlocks();
  render();

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
  els.list.innerHTML = "";

  for (const block of blocks) {
    els.list.appendChild(renderCard(block));
  }
}

function renderCard(block) {
  const card = document.createElement("div");
  card.className = "card";
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
  editBtn.addEventListener("click", () => openEditor(block.id));

  actions.appendChild(editBtn);

  row.appendChild(textWrap);
  row.appendChild(actions);
  card.appendChild(row);

  return card;
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
    (title ? els.content : els.title).focus();
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

const STORAGE_KEY = "snippetdeck_blocks";

/** @type {{id: string, title: string, content: string}[]} */
let blocks = [];

const els = {
  list: document.getElementById("cardList"),
};

init();

async function init() {
  blocks = await loadBlocks();
  render();
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

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = block.title;

  const preview = document.createElement("p");
  preview.className = "card-preview";
  preview.textContent = block.content;

  card.appendChild(title);
  card.appendChild(preview);

  return card;
}

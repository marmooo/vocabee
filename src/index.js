function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function init() {
  loadPlansFromIndexedDB();
}

customElements.define(
  "plan-box",
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById("plan-box").content.cloneNode(
        true,
      );
      this.attachShadow({ mode: "open" }).appendChild(template);
    }
  },
);

function getPlanRange(level) {
  switch (true) {
    case level <= 1800:
      return 200;
    case level <= 2600:
      return 400;
    default:
      return 1000;
  }
}

// function getSheetPos(level) {
//   switch (true) {
//     case level <= 1600:
//       return level / 200;
//     case level <= 2600:
//       return (level - 1800) / 400 + 9;
//     default:
//       return (level - 3000) / 1000 + 12;
//   }
// }

function loadPlan(key, value, rate) {
  const progress = document.getElementById("progress" + key);
  if (progress) {
    const max = getPlanRange(key);
    progress.max = max;
    progress.value = value;
    progress.title = Math.ceil(rate) + "%";
    if (95 <= rate) {
      const td = progress.parentNode.parentNode.firstChild;
      td.textContent = "✔️";
    }
  }
}

function openDB(callback) {
  const req = indexedDB.open("vocabee");
  req.onsuccess = (e) => callback(e.target.result);
  req.onerror = () => console.log("failed to open db");
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    db.createObjectStore("index", { keyPath: "level" });
    const words = db.createObjectStore("words", { keyPath: "lemma" });
    words.createIndex("level", "level", { unique: false });
  };
}

function getIndex(db) {
  return new Promise((resolve, reject) => {
    let index;
    const storeName = "index";
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    tx.oncomplete = () => resolve(index);
    tx.onerror = (e) => reject(e);
    req.onsuccess = (e) => {
      index = e.target.result;
    };
  });
}

function loadPlansFromIndexedDB() {
  openDB((db) => {
    getIndex(db).then((plans) => {
      plans.forEach((plan) => {
        const level = plan.level;
        const known = plan.known || 0;
        const num = getPlanRange(level);
        const rate = known * 100 / num || 0;
        loadPlan(level, known, rate);
      });
    });
  });
}

loadConfig();
init();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;

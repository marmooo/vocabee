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
  loadPlansFromIndexedDB((clearedLevel) => {
    updatePlan(clearedLevel);
  });
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

function updatePlan(clearedLevel) {
  const progresses = document.getElementById("progresses");
  const trElements = progresses.getElementsByTagName("tr");
  const trs = [...trElements].slice(1);
  if (clearedLevel < 5000) {
    const p5kTr = document.getElementById("progress5000").parentNode.parentNode;
    const pos = trs.findIndex((tr) => tr == p5kTr);
    trs.slice(0, pos).forEach((tr) => {
      tr.classList.remove("d-none");
    });
    trs.slice(pos + 1).forEach((tr) => {
      tr.classList.add("d-none");
    });
  } else {
    const pos = trs.findIndex((tr) => {
      const level = parseInt(tr.children[1].textContent);
      if (clearedLevel < level) {
        return true;
      }
    });
    trs.slice(0, pos - 6).forEach((tr) => {
      tr.classList.add("d-none");
    });
    const afterElements = trs.slice(pos);
    for (let i = 0; i <= 3 - afterElements.length; i++) {
      const key = clearedLevel + 1000 * (afterElements.length + i);
      const progress = document.getElementById("progress" + key);
      if (progress) {
        const tr = progress.parentNode.parentNode;
        tr.classList.remove("d-none");
      } else {
        const plan = createPlan(key - 999, key);
        progresses.getElementsByTagName("tr")[0].parentNode.appendChild(plan);
      }
    }
  }
}

function getAward(_level) {
  switch (true) {
    case _level = 200:
      return "小6";
    case _level = 400:
      return "中1";
    case _level = 600:
      return "中2";
    case _level = 800:
      return "中3";
    case _level = 1200:
      return "高1";
    case _level = 1600:
      return "高2";
    case _level = 2200:
      return "高3";
    case _level = 3000:
      return "大学生";
    case _level = 5000:
      return "社会人";
    case _level = 10000:
      return "expatriater";
    case _level = 15000:
      return "fighter";
    case _level = 20000:
      return "knight";
    case _level = 25000:
      return "interpreter";
    case _level = 30000:
      return "native";
    case _level = 35000:
      return "magician";
    case _level = 40000:
      return "demon";
    default:
      return "";
  }
}

function createPlan(from, to) {
  const planBox = document.createElement("plan-box").shadowRoot;
  const a = planBox.querySelector("a");
  a.href = `/vocabee/drill/?q=${from}-${to}`;
  a.textContent = to;
  const progress = planBox.querySelector("progress");
  progress.id = "progress" + to;
  const award = planBox.querySelector("td:nth-child(3)");
  award.textContent = getAward(to);
  return planBox;
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

function loadPlansFromIndexedDB(callback) {
  openDB((db) => {
    getIndex(db).then((plans) => {
      let clearedLevel = 0;
      plans.forEach((plan) => {
        const level = plan.level;
        const known = plan.known || 0;
        const num = getPlanRange(level);
        const rate = known * 100 / num || 0;
        if (!document.getElementById("progress" + level)) {
          const plan = createPlan(level - num + 1, level);
          progresses.appendChild(plan);
        }
        loadPlan(level, known, rate);
        if (95 <= rate && clearedLevel < level) {
          clearedLevel = level;
        }
      });
      callback(clearedLevel);
    });
  });
}

loadConfig();
init();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;

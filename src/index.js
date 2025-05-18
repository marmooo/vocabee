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

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vocabee");
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(new Error("failed to open db"));
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore("index", { keyPath: "level" });
      const words = db.createObjectStore("words", { keyPath: "lemma" });
      words.createIndex("level", "level", { unique: false });
    };
  });
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

async function loadPlansFromIndexedDB() {
  const db = await openDB();
  const plans = await getIndex(db);
  plans.forEach((plan) => {
    const level = plan.level;
    const known = plan.known || 0;
    const num = getPlanRange(level);
    const rate = known * 100 / num || 0;
    loadPlan(level, known, rate);
  });
}

function exportIndexedDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(db.objectStoreNames, "readonly");
      const exportData = {};
      let pendingStores = db.objectStoreNames.length;
      for (const storeName of db.objectStoreNames) {
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          exportData[storeName] = getAllRequest.result;
          if (--pendingStores === 0) {
            resolve(JSON.stringify(exportData, null, 2));
          }
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      }
    };
  });
}

function importIndexedDB(dbName, jsonData) {
  const data = JSON.parse(jsonData);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName in data) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(Object.keys(data), "readwrite");
      for (const storeName in data) {
        const store = transaction.objectStore(storeName);
        for (const item of data[storeName]) {
          store.put(item);
        }
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function deleteIndexedDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => {
      alert("データを削除しました。");
      resolve();
    };
    request.onerror = () => {
      alert("データの削除に失敗しました。");
      reject(request.error);
    };
    request.onblocked = () => {
      alert("データの削除がブロックされました。タブを閉じてください。");
    };
  });
}

async function importDB() {
  const json = await navigator.clipboard.readText();
  try {
    await importIndexedDB("vocabee", json);
    alert("データの読み込みに成功しました。");
  } catch {
    alert("データの読み込みに失敗しました。");
  }
}

async function exportDB() {
  const json = await exportIndexedDB("vocabee");
  await navigator.clipboard.writeText(json);
  alert("クリップボードにコピーしました。");
}

async function deleteDB() {
  await deleteIndexedDB("vocabee");
}

loadConfig();
loadPlansFromIndexedDB();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("importDB").onclick = importDB;
document.getElementById("exportDB").onclick = exportDB;
document.getElementById("deleteDB").onclick = deleteDB;

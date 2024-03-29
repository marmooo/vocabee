const CLIENT_ID =
  "945330460050-osmelc2uen8vhdesa6kd55vvjivkm5vs.apps.googleusercontent.com";
const API_KEY = "AIzaSyD_EbPMAwZ9EDHiLHqGToi7-31ZnwXHams";
const DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
];
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const authorizeParts = document.getElementById("authorize");
const authorizeButton = document.getElementById("authorize_button");
const signoutButton = document.getElementById("signout_button");
loadConfig();

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
  const spreadsheetId = localStorage.getItem("vocabee.spreadsheetId");
  if (spreadsheetId) {
    document.getElementById("spreadsheetId").value = spreadsheetId;
  }
  loadPlansFromIndexedDB((clearedLevel) => {
    updatePlan(clearedLevel);
  });
}

function updateSpreadsheetId(event) {
  const spreadsheetId = event.target.value;
  localStorage.setItem("vocabee.spreadsheetId", spreadsheetId);
  loadPlansOrCreate();
}

function _handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES,
  }).then((_response) => {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }).catch((err) => {
    console.log(err);
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeParts.style.display = "none";
    signoutButton.style.display = "inline-block";
    document.getElementById("signed").classList.remove("d-none");
    loadPlansOrCreate();
  } else {
    loadPlansFromIndexedDB((clearedLevel) => {
      updatePlan(clearedLevel);
    });
    authorizeParts.style.display = "inline-block";
    signoutButton.style.display = "none";
  }
}

function _renderButton() {
  gapi.signin2.render("authorize_button", {
    scope: "profile email",
    longtitle: true,
    theme: "dark",
  });
}

function handleAuthClick(_event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(_event) {
  gapi.auth2.getAuthInstance().signOut();
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

function createSpreadsheet() {
  const request = gapi.client.sheets.spreadsheets.create({}, {
    properties: { title: "Vocabee" },
    sheets: [
      { properties: { title: "index" } },
      { properties: { title: "words" } },
    ],
  });
  request.then((response) => {
    const spreadsheetId = response.result.spreadsheetId;
    document.getElementById("spreadsheetId").value = spreadsheetId;
    localStorage.setItem("vocabee.spreadsheetId", spreadsheetId);
  }, function (reason) {
    console.error("error: " + reason.result.error.message);
  });
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

// TODO: deno lint
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

function putIndices() {
  const progresses = document.getElementById("progresses");
  const trElements = progresses.getElementsByTagName("tr");
  const trs = [...trElements].slice(1);
  const states = trs.map((tr) => {
    const progress = tr.children[5].firstChild;
    const level = parseInt(progress.id.slice(8));
    let known = parseInt(progress.value);
    if (known == 0) known = undefined;
    return [level, known];
  });
  states.forEach((state) => {
    const [level, known] = state;
    putIndex(level, known);
  });
}

function putIndex(level, known, callback) {
  openDB((db) => {
    const storeName = "index";
    const data = { level: level, known: known };
    const req = db.transaction(storeName, "readwrite")
      .objectStore(storeName).put(data);
    req.onsuccess = (e) => {
      if (callback) callback(e);
    };
    req.onerror = () => console.log("failed to put");
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

function loadPlansFromSheet(range) {
  let clearedLevel = 0;
  if (range.values) {
    for (let i = 0; i < range.values.length; i++) {
      const row = range.values[i];
      const level = parseInt(row[0]);
      const known = parseInt(row[1]) || 0;
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
    }
  }
  return clearedLevel;
}

function loadPlansOrCreate() {
  const spreadsheetId = document.getElementById("spreadsheetId").value;
  if (spreadsheetId != "") {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "index!A1:B49",
    }).then((response) => {
      document.getElementById("spreadsheetIdError").classList.add("d-none");
      const clearedLevel = loadPlansFromSheet(response.result);
      updatePlan(clearedLevel);
      putIndices();
    }).catch((err) => {
      switch (err.status) {
        case 400:
          addSheet(spreadsheetId, "index");
          break;
        case 404:
          document.getElementById("spreadsheetIdError").classList.remove(
            "d-none",
          );
          break;
        default:
          console.log(err);
      }
    });
  } else {
    createSpreadsheet();
  }
}

function addSheet(spreadsheetId, title, callback) {
  return gapi.client.sheets.spreadsheets.batchUpdate(
    { spreadsheetId: spreadsheetId },
    {
      requests: [
        { addSheet: { properties: { title: title } } },
      ],
    },
  ).then((response) => {
    if (callback) callback(response);
  }).catch((err) => {
    console.log(err);
  });
}

init();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("spreadsheetId").onchange = updateSpreadsheetId;

import {
  Carousel,
  Modal,
} from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/+esm";

const progresses = document.querySelectorAll("#seqTest progress");
let level;
let enjaList = [];
let draggies = [];
let test1method;
let test2count = 0;
let test2score = 0;
let test2problems = [];
let englishVoices = [];
let testLength = 20;
let audioContext;
const audioBufferCache = {};
const maxTestLength = 20; // 多すぎると復習しにくい
const carousel = new Carousel(document.getElementById("main"), {
  interval: false,
  touch: false,
});
const modalNode = document.getElementById("modal");
const modal = new Modal(modalNode);
loadVoices();
loadConfig();
initFromIndexedDB();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("voice") != 1) {
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
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

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("correct", "/vocabee/mp3/correct3.mp3");
    loadAudio("incorrect", "/vocabee/mp3/incorrect1.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function toggleVoice() {
  speechSynthesis.cancel();
  if (localStorage.getItem("voice") == 1) {
    localStorage.setItem("voice", 0);
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
  } else {
    localStorage.setItem("voice", 1);
    document.getElementById("voiceOn").classList.remove("d-none");
    document.getElementById("voiceOff").classList.add("d-none");
  }
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  const jokeVoices = [
    // "com.apple.eloquence.en-US.Flo",
    "com.apple.speech.synthesis.voice.Bahh",
    "com.apple.speech.synthesis.voice.Albert",
    // "com.apple.speech.synthesis.voice.Fred",
    "com.apple.speech.synthesis.voice.Hysterical",
    "com.apple.speech.synthesis.voice.Organ",
    "com.apple.speech.synthesis.voice.Cellos",
    "com.apple.speech.synthesis.voice.Zarvox",
    // "com.apple.eloquence.en-US.Rocko",
    // "com.apple.eloquence.en-US.Shelley",
    // "com.apple.speech.synthesis.voice.Princess",
    // "com.apple.eloquence.en-US.Grandma",
    // "com.apple.eloquence.en-US.Eddy",
    "com.apple.speech.synthesis.voice.Bells",
    // "com.apple.eloquence.en-US.Grandpa",
    "com.apple.speech.synthesis.voice.Trinoids",
    // "com.apple.speech.synthesis.voice.Kathy",
    // "com.apple.eloquence.en-US.Reed",
    "com.apple.speech.synthesis.voice.Boing",
    "com.apple.speech.synthesis.voice.Whisper",
    "com.apple.speech.synthesis.voice.Deranged",
    "com.apple.speech.synthesis.voice.GoodNews",
    "com.apple.speech.synthesis.voice.BadNews",
    "com.apple.speech.synthesis.voice.Bubbles",
    // "com.apple.voice.compact.en-US.Samantha",
    // "com.apple.eloquence.en-US.Sandy",
    // "com.apple.speech.synthesis.voice.Junior",
    // "com.apple.speech.synthesis.voice.Ralph",
  ];
  allVoicesObtained.then((voices) => {
    englishVoices = voices
      .filter((voice) => voice.lang == "en-US")
      .filter((voice) => !jokeVoices.includes(voice.voiceURI));
  });
}

function loopVoice(text, n) {
  speechSynthesis.cancel();
  text = new Array(n).fill(`${text}.`).join(" ");
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "en-US";
  speechSynthesis.speak(msg);
}

function setLearningButton(id, value) {
  const btnCounter = document.getElementById(id);
  btnCounter.textContent = value;
  if (value == 0) {
    btnCounter.parentNode.setAttribute("disabled", true);
  } else {
    btnCounter.parentNode.removeAttribute("disabled");
  }
}

function setTest2LearningButton() {
  const test2learning = document.getElementById("test2learning");
  const learning = document.getElementById("learning").textContent;
  if (learning == 0) {
    test2learning.setAttribute("disabled", true);
  } else {
    test2learning.removeAttribute("disabled");
  }
}

async function loadEnjaListFromIndexedDB(level, callback) {
  const db = await openDB();
  const dict = {};
  getAllWords(db, level).then((words) => {
    words.forEach((word) => {
      dict[word.lemma] = word.state;
    });
    enjaList = [];
    fetch("/vocabee/data/" + level + ".csv")
      .then((response) => response.text())
      .then((text) => {
        text.split("\n").forEach((line) => {
          const [en, ja] = line.split(",");
          enjaList.push([en, ja, dict[en]]);
        });
        callback();
      });
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

function loadPlans(state) {
  const [unlearned, known] = state;
  const learning = getPlanRange(level) - known - unlearned;
  setLearningButton("known", known);
  setLearningButton("unlearned", unlearned);
  setLearningButton("learning", learning);
  setTest2LearningButton();
}

function loadProgresses(states) {
  const level = Number(document.getElementById("levelFrom").textContent);
  const trs = document.getElementById("seqTest").querySelectorAll("tr");
  const num = enjaList.length / 10;
  for (let i = 0; i < trs.length; i++) {
    const tds = trs[i].getElementsByTagName("td");
    const label = tds[0];
    const range = `${level + num * i}-${level + num * (i + 1) - 1}`;
    label.textContent = range;
    const progress = tds[1].querySelector("progress");
    const [_unlearned, known] = states[i];
    const rate = Math.ceil(known / enjaList.length * 1000);
    progress.max = num;
    progress.value = known;
    progress.title = rate + "%";
    progress.dataset.range = range;
  }
}

function updatePlan(id, count) {
  const counter = document.getElementById(id);
  counter.textContent = count;
  const btn = counter.parentNode;
  btn.classList.add("animate__animated", "animate__flipInY");
  btn.removeAttribute("disabled");
}

function updatePlans(known, unlearned, learning) {
  const prevKnown = parseInt(document.getElementById("known").textContent);
  const prevUnlearned = parseInt(
    document.getElementById("unlearned").textContent,
  );
  const prevLearning = parseInt(
    document.getElementById("learning").textContent,
  );
  const currKnown = prevKnown + known;
  const currUnlearned = prevUnlearned + unlearned;
  const currLearning = prevLearning + learning;
  updatePlan("known", currKnown);
  updatePlan("unlearned", currUnlearned);
  updatePlan("learning", currLearning);
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

function getAllWords(db, level) {
  return new Promise((resolve, reject) => {
    let words;
    const storeName = "words";
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).index("level").getAll(level);
    tx.oncomplete = () => resolve(words);
    tx.onerror = (e) => reject(e);
    req.onsuccess = (e) => {
      words = e.target.result;
    };
  });
}

function getWordState(db, lemma) {
  return new Promise((resolve, reject) => {
    let state;
    const storeName = "words";
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(lemma);
    tx.oncomplete = () => resolve(state);
    tx.onerror = (e) => reject(e);
    req.onsuccess = (e) => {
      const result = e.target.result;
      result ? state = result.state : undefined;
    };
  });
}

async function putIndex(callback) {
  const db = await openDB();
  const storeName = "index";
  let known = 0;
  enjaList.forEach((enja) => {
    if (enja[2] && enja[2].slice(-1) == "o") {
      known += 1;
    }
  });
  const data = { level: level, known: known };
  const req = db.transaction(storeName, "readwrite")
    .objectStore(storeName).put(data);
  req.onsuccess = (e) => {
    if (callback) callback(e);
  };
  req.onerror = () => console.log("failed to put");
}

function putWordState(db, lemma, state, callback) {
  const storeName = "words";
  const data = { lemma: lemma, level: level, state: state };
  const req = db.transaction(storeName, "readwrite")
    .objectStore(storeName).put(data);
  req.onsuccess = (e) => {
    if (callback) callback(e);
  };
  req.onerror = () => console.log("failed to put");
}

async function putWord(lemma, currentState) {
  const db = await openDB();
  getWordState(db, lemma).then((state) => {
    state ? state += currentState : state = currentState;
    putWordState(db, lemma, state);
  });
}

async function putWords() {
  const db = await openDB();
  enjaList.forEach((enja) => {
    const lemma = enja[0];
    const state = enja[2];
    putWordState(db, lemma, state);
  });
}

function putWordsBase(id, state) {
  const objs = [...document.getElementById(id).lastElementChild.children];
  const lemmas = objs.map((e) => e.textContent);
  const poses = lemmas.map((lemma) => {
    return enjaList.findIndex((enja) => enja[0] == lemma); // TODO: slow?
  });
  lemmas.forEach(async (lemma, i) => {
    updateEnjaListState(poses[i], state);
    await putWord(lemma, state);
  });
  return poses;
}

function putWordsFromTest1() {
  const knownPoses = putWordsBase("test1known", "o");
  const learningPoses = putWordsBase("test1learning", "x");
  updateProgresses(knownPoses, 1);
  return [knownPoses.length, learningPoses.length];
}

function updateEnjaListState(lemmaPos, state) {
  const prevState = enjaList[lemmaPos][2];
  if (prevState) {
    enjaList[lemmaPos][2] += state;
  } else {
    enjaList[lemmaPos][2] = state;
  }
}

function updateProgresses(lemmaPoses, knownCount) {
  const data = {};
  lemmaPoses.forEach((lemmaPos) => {
    const progressPos = Math.floor(lemmaPos / (enjaList.length / 10));
    if (progressPos in data) {
      data[progressPos] += knownCount;
    } else {
      data[progressPos] = knownCount;
    }
  });
  let total = 0;
  for (const [progressKey, known] of Object.entries(data)) {
    const progressPos = parseInt(progressKey);
    const progress = progresses[progressPos];
    const knownValue = parseInt(progress.value) + known;
    const maxValue = parseInt(progress.max);
    progress.value = knownValue;
    progress.title = Math.ceil(knownValue / maxValue * 100) + "%";
    progress.classList.add("animate__animated", "animate__bounceInLeft");
    total += known;
  }
  return total;
}

function updateProgress(lemmaPos, knownCount) {
  const progressPos = Math.floor(lemmaPos / (enjaList.length / 10));
  const progress = progresses[progressPos];
  const knownValue = parseInt(progress.value) + knownCount;
  const maxValue = parseInt(progress.max);
  progress.value = knownValue;
  progress.title = Math.ceil(knownValue / maxValue * 100) + "%";
  progress.classList.add("animate__animated", "animate__bounceInLeft");
}

function updateViewByKnown() {
  putWordsBase("test1known", "o");
  const learningPoses = putWordsBase("test1learning", "x");
  const knownCount = updateProgresses(learningPoses, -1);
  updatePlans(knownCount, 0, -knownCount);
}

function updateViewByLearning() {
  const knownPoses = putWordsBase("test1known", "o");
  putWordsBase("test1learning", "x");
  const knownCount = updateProgresses(knownPoses, 1);
  updatePlans(knownCount, 0, -knownCount);
}

async function test1moveTop() {
  switch (test1method) {
    case "known": {
      updateViewByKnown();
      break;
    }
    case "unlearned": {
      const [known, learning] = putWordsFromTest1();
      updatePlans(known, -known - learning, learning);
      break;
    }
    case "learning": {
      updateViewByLearning();
      break;
    }
  }
  await putIndex();
  moveTop();
}

function searchByGoogle(event) {
  event.preventDefault();
  const input = document.getElementById("cse-search-input-box-id");
  document.getElementById("searchResults").classList.remove("d-none");
  const element = google.search.cse.element.getElement("searchresults-only0");
  if (input.value == "") {
    element.clearAllResults();
  } else {
    element.execute(input.value);
  }
}
document.getElementById("cse-search-box-form-id").onsubmit = searchByGoogle;

function search(event) {
  const name = event.target.id.slice(6);
  const lemma = document.getElementById("modal-title").textContent;
  switch (name) {
    case "Google":
      globalThis.open(`https://www.google.com/search?q=${lemma}+意味`);
      return;
    case "Eijiro":
      globalThis.open(`https://eow.alc.co.jp/search?q=${lemma}`);
      return;
    case "Weblio1":
      globalThis.open(`https://ejje.weblio.jp/content/${lemma}`);
      return;
    case "DBMxNet":
      globalThis.open(`https://dbmx.net/dict/search_union.cgi?q=${lemma}`);
      return;
    case "Weblio2":
      globalThis.open(`https://ejje.weblio.jp/sentence/content/${lemma}`);
      return;
    case "ReversoContext":
      globalThis.open(`https://context.reverso.net/翻訳/英語-日本語/${lemma}`);
      return;
  }
}

function addDragEvent(obj, meaning, reset) {
  const test1known = document.getElementById("test1known");
  const test1learning = document.getElementById("test1learning");
  const dragZone = document.getElementById("dragZone");
  const draggie = new Draggabilly(obj);
  if (!reset) {
    obj.textContent = meaning[0];
    obj.classList.add("btn-lg");
  }
  draggie.on("staticClick", () => {
    document.getElementById("meaning").textContent = meaning[1]
      .split("|").join(", ");
    document.getElementById("modal-title").textContent = meaning[0];
    modal.show();
  });
  draggie.on("dragStart", (_event, _pointer) => {
    const rect1 = obj.getBoundingClientRect();
    document.body.appendChild(obj);
    const rect2 = obj.getBoundingClientRect();
    draggie.setPosition(rect1.left - rect2.left, rect1.top - rect2.top);
  });
  draggie.on("dragEnd", (_event, _pointer) => {
    obj.removeAttribute("style");
    obj.classList.remove("btn-lg");
    if (draggie.position.y < 0) {
      const root = test1known.lastElementChild;
      root.insertBefore(obj, root.firstElementChild);
    } else {
      const root = test1learning.lastElementChild;
      root.insertBefore(obj, root.firstElementChild);
    }
    draggies = draggies.filter((d) => d != draggie);
    draggie.destroy();
    addDragEvent(obj, meaning, true);
    if (dragZone.children.length == 0) {
      document.getElementById("test1moveTop").classList.remove("d-none"); // moveTop
    }
  });
  draggies.push(draggie);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function setProblems(method, targetState) {
  test1method = method;
  const problems = getTargetStateProblems(targetState);
  const dragZone = document.getElementById("dragZone");
  const lemmas = [...dragZone.children];
  const test1noneed = document.getElementById("test1noneed");
  lemmas.forEach((lemma, i) => {
    if (i >= problems.length) {
      test1noneed.appendChild(lemma);
    } else {
      addDragEvent(lemma, problems[i]);
    }
  });
}

function getTargetStateProblems(targetState) {
  const problems = [];
  enjaList.some((enja) => {
    if (enja[2] && enja[2].slice(-1) == targetState) {
      problems.push(enja);
      if (problems.length >= maxTestLength) {
        return true;
      }
    }
  });
  return problems;
}

function getUnlearnedProblems() {
  const result = [];
  enjaList.some((p) => {
    if (!p[2]) {
      result.push(p);
      if (result.length >= maxTestLength) {
        return true;
      }
    }
  });
  return result;
}

function setUnlearnedProblems() {
  test1method = "unlearned";
  const problems = getUnlearnedProblems();
  const dragZone = document.getElementById("dragZone");
  const test1noneed = document.getElementById("test1noneed");
  [...dragZone.children].forEach((lemma, i) => {
    if (i >= problems.length) {
      test1noneed.appendChild(lemma);
    } else {
      addDragEvent(lemma, problems[i]);
    }
  });
}

function moveTop() {
  carousel.to(0);
  draggies.forEach((draggie) => {
    draggie.destroy();
  });
  draggies = [];
}

function test1cleanup() {
  document.getElementById("test1moveTop").classList.add("d-none");
  const dragZone = document.getElementById("dragZone");
  const test1known = document.getElementById("test1known");
  const test1learning = document.getElementById("test1learning");
  const test1noneed = document.getElementById("test1noneed");
  const movedLemma = [...test1known.lastElementChild.children]
    .concat([...test1learning.lastElementChild.children])
    .concat([...test1noneed.children]);
  movedLemma.forEach((lemma) => {
    dragZone.appendChild(lemma);
  });
  carousel.to(1);
}

function test1(type) {
  test1cleanup();
  switch (type) {
    case "known":
      return setProblems("known", "o");
    case "unlearned":
      return setUnlearnedProblems();
    case "learning":
      return setProblems("learning", "x");
  }
}

class Choice {
  constructor(en, ja, desc, isAnswer) {
    this.en = en;
    this.ja = ja;
    this.desc = desc;
    this.isAnswer = isAnswer;
  }
}

function test2selectAnswers(type, progress) {
  const tmpProblems = enjaList.concat();
  switch (type) {
    case "all": {
      shuffle(tmpProblems);
      return tmpProblems.slice(0, maxTestLength);
    }
    case "learning": {
      const target = tmpProblems.filter((enja) =>
        enja[2] && enja[2].slice(-1) == "x"
      );
      if (target.length < maxTestLength) {
        return target;
      } else {
        return target.slice(0, maxTestLength);
      }
    }
    default: {
      const range = progress.dataset.range;
      document.getElementById("currRange").textContent = range;
      const [from, to] = range.split("-").map((x) => Number(x));
      const levelFrom = level - (to - from + 1) * 10;
      const problemFrom = from - levelFrom - 1;
      const problemTo = to - levelFrom;
      const answers = tmpProblems.slice(problemFrom, problemTo);
      return shuffle(answers).slice(0, maxTestLength);
    }
  }
}

function test2generateProblems(type, progress) {
  const answers = test2selectAnswers(type, progress);
  testLength = answers.length;
  const problems = [];
  answers.forEach((answer) => {
    const choices = test2generateChoices(answer);
    problems.push(choices);
  });
  return problems;
}

function generateChoice(enja, isAnswer) {
  const arr = enja[1].split("|");
  shuffle(arr);
  const ja = arr.slice(0, 3).join(", ");
  const [en, desc] = enja;
  return new Choice(en, ja, desc.split("|"), isAnswer);
}

function test2generateChoices(answer) {
  const choices = [generateChoice(answer, true)];
  while (choices.length != 4) {
    const enja = enjaList[getRandomInt(enjaList.length)];
    if (enja[0] != answer[0]) {
      const candidate = generateChoice(enja, false);
      if (choices.every((c) => !c.desc.includes(candidate.ja))) { // 同じ意味がないとき
        choices.push(candidate);
      }
    }
  }
  return choices;
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function test2setButtons(eiwa, buttons, choices) {
  if (eiwa) {
    document.getElementById("test2lemma").textContent = choices[0].en;
    loopVoice(choices[0].en, 3);
  } else {
    const ja = choices[0].ja.replace(/［[^［]*］/g, "");
    document.getElementById("test2lemma").textContent = ja;
  }
  shuffle(choices).forEach((choice, i) => {
    buttons[i].classList.remove("text-danger");
    if (eiwa) {
      const ja = choice.ja.replace(/［[^［]*］/g, "");
      buttons[i].textContent = ja;
    } else {
      buttons[i].textContent = choice.en;
    }
    if (choice.isAnswer) {
      buttons[i].setAttribute("data-answer", "true");
    } else {
      buttons[i].removeAttribute("data-answer");
    }
  });
}

function test2getTrs() {
  const trs1 = [
    ...document.getElementById("test2table1").getElementsByTagName("tr"),
  ];
  const trs2 = [
    ...document.getElementById("test2table2").getElementsByTagName("tr"),
  ];
  return trs1.concat(trs2);
}

function test2setResult(count, choices) {
  const trs = test2getTrs();
  const tr = trs[count - 1];
  const tds = tr.children;
  tds[0].firstChild.textContent = "🔊";
  tds[1].textContent = choices[0].en;
  tds[2].textContent = choices[0].desc;
}

function test2cleanResult() {
  const trs = test2getTrs();
  trs.forEach((tr) => {
    const tds = tr.children;
    tds[0].firstChild.textContent = "";
    tds[1].textContent = "";
    tds[2].textContent = "";
  });
}

function test2all() {
  test2base("all");
}

function test2learning() {
  test2base("learning");
}

function test2seq(event) {
  test2base("seq", event.currentTarget);
}

function test2base(type, progress) {
  const results = test2getTrs();
  results.forEach((result) => {
    result.classList.remove("table-danger");
  });
  test2problems = test2generateProblems(type, progress);
  if (test2problems.length == 0) return;
  test2count = 1;
  test2score = 0;
  const buttons = [...document.getElementById("choices").children];
  const eiwa = document.getElementById("testType1").checked;
  test2cleanResult();
  test2setResult(test2count, test2problems[0]);
  test2setButtons(eiwa, buttons, test2problems[0]);
  if (eiwa) {
    document.getElementById("test2voice").classList.remove("d-none");
  } else {
    document.getElementById("test2voice").classList.add("d-none");
  }
  carousel.to(2);
}

function test2countScore() {
  const buttons = [...document.getElementById("choices").children];
  return buttons.every((b) => !b.classList.contains("text-danger"));
}

function test2moveTop() {
  putIndex();
  moveTop();
}

async function test2put(lemma, isCorrect) {
  const lemmaPos = enjaList.findIndex((enja) => enja[0] == lemma);
  let state = enjaList[lemmaPos][2];
  let currentState;
  let known = 0, unlearned = 0, learning = 0;
  if (isCorrect) {
    currentState = "o";
    updateEnjaListState(lemmaPos, currentState);
    if (!state) {
      unlearned -= 1;
      known += 1;
      updateProgress(lemmaPos, 1);
    } else if (state.slice(-1) == "x") {
      learning -= 1;
      known += 1;
      updateProgress(lemmaPos, 1);
    }
  } else {
    currentState = "x";
    updateEnjaListState(lemmaPos, currentState);
    if (!state) {
      unlearned -= 1;
      learning += 1;
    } else if (state.slice(-1) == "o") {
      known -= 1;
      learning += 1;
      updateProgress(lemmaPos, -1);
    }
  }
  const db = await openDB();
  state ? state += currentState : state = currentState;
  putWordState(db, lemma, state);
  updatePlans(known, unlearned, learning);
}

async function test2select(event) {
  const buttons = [...document.getElementById("choices").children];
  const choices = test2problems[test2count - 1];
  const eiwa = document.getElementById("testType1").checked;
  if (event.target.dataset.answer) {
    test2count += 1;
    const isCorrect = test2countScore();
    test2score += isCorrect;
    playAudio("correct", 0.3);
    const answer = choices.find((c) => c.isAnswer);
    event.target.textContent = "⭕ " + answer.ja;
    await test2put(answer.en, isCorrect);
    if (test2count > testLength) {
      document.getElementById("score").textContent = test2score;
      document.getElementById("testLength").textContent = testLength;
      carousel.to(3);
    } else {
      const nextChoices = test2problems[test2count - 1];
      test2setResult(test2count, nextChoices);
      test2setButtons(eiwa, buttons, nextChoices);
    }
  } else {
    speechSynthesis.cancel();
    playAudio("incorrect", 0.3);
    const pos = buttons.findIndex((btn) => btn == event.target);
    const choice = choices[pos];
    event.target.textContent = choice.en + ": " + choice.ja;
    event.target.classList.add("text-danger");
    const results = test2getTrs();
    results[test2count - 1].classList.add("table-danger");
  }
}

function countupStates() {
  const planStates = [0, 0];
  const progressStates = [...Array(10)].map(() => Array(2).fill(0));
  enjaList.forEach((enja) => {
    const [lemma, _ja, state] = enja;
    const lemmaPos = enjaList.findIndex((p) => p[0] == lemma); // TODO: slow?
    const progressPos = Math.floor(lemmaPos / (enjaList.length / 10));
    if (!state) {
      planStates[0] += 1;
      progressStates[progressPos][0] += 1;
    } else if (state.slice(-1) == "o") {
      planStates[1] += 1;
      progressStates[progressPos][1] += 1;
    }
  });
  return [planStates, progressStates];
}

function initProblemRange() {
  let from, to;
  const query = new URLSearchParams(location.search);
  if (query.has("q")) {
    [from, to] = query.get("q").split("-");
    from = parseInt(from);
    to = parseInt(to);
    level = to;
  } else {
    from = 1, to = 200, level = 200;
  }
  document.getElementById("levelText").textContent = getAward(level);
  document.getElementById("levelFrom").textContent = from;
  document.getElementById("levelTo").textContent = to;
  return [from, to];
}

function initFromIndexedDB() {
  initProblemRange();
  loadEnjaListFromIndexedDB(level, () => {
    const [planStates, progressStates] = countupStates();
    loadPlans(planStates);
    loadProgresses(progressStates);
  });
}

function getAward(level) {
  switch (true) {
    case level <= 200:
      return "小6";
    case level <= 400:
      return "中1";
    case level <= 600:
      return "中2";
    case level <= 1000:
      return "中3";
    case level <= 1200:
      return "高1";
    case level <= 1600:
      return "高2";
    case level <= 2200:
      return "高3";
    case level <= 3000:
      return "大学生";
    case level <= 5000:
      return "社会人";
    case level <= 7000:
      return "海外中学";
    case level <= 9000:
      return "海外高校";
    case level <= 10000:
      return "海外大学";
    case level <= 12000:
      return "英語専門職";
    case level <= 15000:
      return "翻訳者";
    case level <= 17000:
      return "英語の達人";
    case level <= 18000:
      return "海外大学院";
    case level <= 20000:
      return "英語探検家";
    case level <= 22000:
      return "英語博士";
    case level <= 25000:
      return "言語研究者";
    case level <= 27000:
      return "英語画家";
    case level <= 28000:
      return "英語音楽家";
    default:
      return "英語ist";
  }
}

// function createPlan(from, to) {
//   const planBox = document.createElement("plan-box").shadowRoot;
//   const a = planBox.querySelector("a");
//   a.href = `/vocabee/drill/?q=${from}-${to}`;
//   a.textContent = to;
//   const progress = planBox.querySelector("progress");
//   progress.id = "progress" + to;
//   const award = planBox.querySelector("td:nth-child(2)");
//   award.textContent = getAward(to);
//   return planBox;
// }

document.getElementById("voice").onclick = toggleVoice;
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("test1moveTop").onclick = test1moveTop;
document.getElementById("searchByGoogle").onclick = searchByGoogle;
document.getElementById("searchGoogle").onclick = search;
document.getElementById("searchEijiro").onclick = search;
document.getElementById("searchWeblio1").onclick = search;
document.getElementById("searchWeblio2").onclick = search;
document.getElementById("searchDBMxNet").onclick = search;
document.getElementById("searchReversoContext").onclick = search;
document.getElementById("knownButton").onclick = () => {
  test1("known");
};
document.getElementById("unlearnedButton").onclick = () => {
  test1("unlearned");
};
document.getElementById("learningButton").onclick = () => {
  test1("learning");
};
document.getElementById("test2moveTop").onclick = test2moveTop;
document.getElementById("test2all").onclick = test2all;
document.getElementById("test2learning").onclick = test2learning;
[...document.getElementsByClassName("moveTop")].forEach((btn) => {
  btn.onclick = moveTop;
});
[...document.getElementById("choices").children].forEach((btn) => {
  btn.onclick = test2select;
});
for (let i = 0; i < progresses.length; i++) {
  progresses[i].onclick = test2seq;
}
modalNode.addEventListener("shown.bs.modal", () => {
  const obj = document.getElementById("modal-voice");
  const en = obj.previousElementSibling.textContent;
  document.getElementById("cse-search-input-box-id").value = en;
  document.getElementById("searchResults").classList.add("d-none");
  if (localStorage.getItem("voice") != 0) {
    loopVoice(en, 3);
  }
});
document.getElementById("test2voice").onclick = (event) => {
  const text = event.target.previousElementSibling.textContent;
  loopVoice(text, 3);
};
document.getElementById("modal-voice").onclick = (event) => {
  const text = event.target.previousElementSibling.textContent;
  loopVoice(text, 3);
};
test2getTrs().forEach((tr) => {
  const tds = tr.children;
  const button = tds[0].firstChild;
  button.onclick = () => {
    loopVoice(tds[1].textContent, 1);
  };
});
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

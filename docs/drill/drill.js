const CLIENT_ID = '945330460050-osmelc2uen8vhdesa6kd55vvjivkm5vs.apps.googleusercontent.com';
const API_KEY = 'AIzaSyD_EbPMAwZ9EDHiLHqGToi7-31ZnwXHams';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";
let level;
let enjaList = [];
let draggies = [];
let test1method;
let test2count = 0;
let test2score = 0;
let test2problems = [];
let englishVoices = [];  loadVoices();
let pendingPush;
let testLength = 20;
const maxTestLength = 20;  // 多すぎると復習しにくい
const correctAudio = new Audio('/vocabee/mp3/correct3.mp3');
const incorrectAudio = new Audio('/vocabee/mp3/incorrect1.mp3');
loadConfig();
initFromIndexedDB();
const carousel = new bootstrap.Carousel(document.getElementById('main'), { interval:false, touch:false });
const modalNode = document.getElementById('modal');
const modal = new bootstrap.Modal(modalNode);
modalNode.addEventListener('shown.bs.modal', function(e) {
  const obj = document.getElementById('modal-voice');
  const en = obj.previousElementSibling.textContent;
  document.getElementById('cse-search-input-box-id').value = en;
  document.getElementById('___gcse_0').classList.add('d-none');
  loopVoice(en, 3);
});
document.getElementById('test2voice').onclick = function() {
  const text = this.previousElementSibling.textContent;
  loopVoice(text, 3);
}
document.getElementById('modal-voice').onclick = function(obj) {
  const text = obj.previousElementSibling.textContent;
  loopVoice(text, 3);
}


function loadConfig() {
  if (localStorage.getItem('darkMode') == 1) {
    document.documentElement.dataset.theme = 'dark';
  }
  if (localStorage.getItem('voice') != 1) {
    document.getElementById('voiceOn').classList.add('d-none');
    document.getElementById('voiceOff').classList.remove('d-none');
  }
}

function toggleDarkMode() {
  if (localStorage.getItem('darkMode') == 1) {
    localStorage.setItem('darkMode', 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem('darkMode', 1);
    document.documentElement.dataset.theme = 'dark';
  }
}

function toggleVoice(obj) {
  speechSynthesis.cancel();
  if (localStorage.getItem('voice') == 1) {
    localStorage.setItem('voice', 0);
    document.getElementById('voiceOn').classList.add('d-none');
    document.getElementById('voiceOff').classList.remove('d-none');
  } else {
    localStorage.setItem('voice', 1);
    document.getElementById('voiceOn').classList.remove('d-none');
    document.getElementById('voiceOff').classList.add('d-none');
  }
}

function unlockAudio() {
  correctAudio.volume = 0;
  correctAudio.play();
  correctAudio.pause();
  correctAudio.currentTime = 0;
  correctAudio.volume = 1;
  incorrectAudio.volume = 0;
  incorrectAudio.play();
  incorrectAudio.pause();
  incorrectAudio.currentTime = 0;
  incorrectAudio.volume = 1;
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function(resolve, reject) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      speechSynthesis.addEventListener("voiceschanged", function() {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
    }
  });
  allVoicesObtained.then(voices => {
    englishVoices = voices.filter(voice => voice.lang == 'en-US' );
  });
}

function loopVoice(text, n) {
  if (localStorage.getItem('voice') != 0) {
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
    msg.lang = 'en-US';
    for (let i=0; i<n; i++) {
      speechSynthesis.speak(msg);
    }
  }
}

function setLearningButton(id, value) {
  const btnCounter = document.getElementById(id);
  btnCounter.textContent = value;
  if (value == 0) {
    btnCounter.parentNode.setAttribute('disabled', true);
  } else {
    btnCounter.parentNode.removeAttribute('disabled');
  }
}

function loadEnjaListFromIndexedDB(level, callback) {
  openDB(db => {
    let dict = {};
    getAllWords(db, level).then(words => {
      words.forEach(word => {
        dict[word.lemma] = word.state;
      });
      enjaList = [];
      fetch('/vocabee/data/' + level + '.tsv').then(response => response.text()).then(text => {
        text.split('\n').forEach(line => {
          const [en, ja] = line.split('\t');
          enjaList.push([en, ja, dict[en]]);
        });
        callback();
      });
    });
  });
}

function getPlanRange(level) {
  switch(true) {
    case level <= 1800: return 200;
    case level <= 2600: return 400;
    default: return 1000;
  }
}

function loadPlans(state) {
  const [unlearned, known] = state;
  const learning = getPlanRange(level) - known - unlearned;
  setLearningButton('known', known);
  setLearningButton('unlearned', unlearned);
  setLearningButton('learning', learning);
}

function loadProgresses(states) {
  const progresses = [...document.getElementById('seqTest').children];
  progresses.forEach((progress, i) => {
    const [unlearned, known] = states[i];
    const rate = Math.ceil(known / enjaList.length * 1000);
    progress.max   = enjaList.length / 10;
    progress.value = known;
    progress.title = rate + '%';
  });
}

function updatePlan(id, count) {
  const counter = document.getElementById(id);
  counter.textContent = count;
  const btn = counter.parentNode;
  btn.classList.add('animate__animated', 'animate__flipInY');
  btn.removeAttribute('disabled');
}

function updatePlans(known, unlearned, learning) {
  const prevKnown = parseInt(document.getElementById('known').textContent);
  const prevUnlearned = parseInt(document.getElementById('unlearned').textContent);
  const prevLearning = parseInt(document.getElementById('learning').textContent);
  const currKnown = prevKnown + known;
  const currUnlearned = prevUnlearned + unlearned;
  const currLearning = prevLearning + learning;
  const data = { id:level, known:currKnown, learning:currLearning };
  updatePlan('known', currKnown);
  updatePlan('unlearned', currUnlearned);
  updatePlan('learning', currLearning);
}

function openDB(callback) {
  const req = indexedDB.open("vocabee");
  req.onsuccess = e => callback(e.target.result);
  req.onerror = e => console.log('failed to open db');
  req.onupgradeneeded = e => {
    const db = e.target.result;
    var index = db.createObjectStore('index', { keyPath:'level' });
    const words = db.createObjectStore('words', { keyPath:'lemma' });
    words.createIndex('level', 'level', { unique:false });
  };
}

function getAllWords(db, level) {
  return new Promise((resolve, reject) => {
    let words;
    const storeName = 'words';
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).index('level').getAll(level);
    tx.oncomplete = e => resolve(words);
    tx.onerror = e => reject(e);
    req.onsuccess = e => { words = e.target.result; };
  });
}

function getWordState(db, lemma) {
  return new Promise((resolve, reject) => {
    let state;
    const storeName = 'words';
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(lemma);
    tx.oncomplete = e => resolve(state);
    tx.onerror = e => reject(e);
    req.onsuccess = e => {
      const result = e.target.result;
      result  ?  state = result.state  :  undefined;
    };
  });
}

function putIndex(callback) {
  openDB(db => {
    const storeName = 'index';
    let known = 0;
    enjaList.forEach(enja => {
      if (enja[2] && enja[2].slice(-1) == 'o') {
        known += 1;
      }
    });
    const data = { level:level, known:known };
    const req = db.transaction(storeName, 'readwrite')
      .objectStore(storeName).put(data);
    req.onsuccess = e => {
      if (callback) { callback(e); }
    }
    req.onerror = e => console.log('failed to put');
  });
}

function putWordState(db, lemma, state, callback) {
  const storeName = 'words';
  const data = { lemma:lemma, level:level, state:state };
  const req = db.transaction(storeName, 'readwrite')
    .objectStore(storeName).put(data);
  req.onsuccess = e => {
    if (callback) { callback(e); }
  }
  req.onerror = e => console.log('failed to put');
}

function putWord(lemma, currentState) {
  openDB(db => {
    getWordState(db, lemma).then(state => {
      state  ?  state += currentState  :  state = currentState;
      putWordState(db, lemma, state);
    });
  });
}

function putWords() {
  openDB(db => {
    enjaList.forEach(enja => {
      const lemma = enja[0];
      const state = enja[2];
      putWordState(db, lemma, state);
    });
  });
}

function putWordsBase(id, count, state) {
  const objs = [...document.getElementById(id).firstElementChild.children];
  const lemmas = objs.map(e => e.textContent);
  const poses = lemmas.map(lemma => {
    return enjaList.findIndex(enja => enja[0] == lemma);  // TODO: slow?
  });
  lemmas.forEach((lemma, i) => {
    updateEnjaListState(poses[i], state);
    putWord(lemma, state);
  });
  return poses;
}

function putWordsFromTest1() {
  const knownPoses = putWordsBase('test1known', 1, 'o');
  const learningPoses = putWordsBase('test1learning', -1, 'x');
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
  let data = {};
  const progresses = [...document.getElementById('seqTest').children];
  lemmaPoses.forEach(lemmaPos => {
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
    const learningValue = maxValue - knownValue;
    progress.value = knownValue;
    progress.title = Math.ceil(knownValue / maxValue * 100) + '%';
    progress.classList.add('animate__animated', 'animate__bounceInLeft');
    total += known;
  }
  return total;
}

function updateProgress(lemma, lemmaPos, knownCount) {
  const progresses = [...document.getElementById('seqTest').children];
  const progressPos = Math.floor(lemmaPos / (enjaList.length / 10));
  const progress = progresses[progressPos];
  const knownValue = parseInt(progress.value) + knownCount;
  const maxValue = parseInt(progress.max);
  const learningValue = maxValue - knownValue;
  progress.value = knownValue;
  progress.title = Math.ceil(knownValue / maxValue * 100) + '%';
  progress.classList.add('animate__animated', 'animate__bounceInLeft');
}

function updateViewByKnown() {
  const knownPoses = putWordsBase('test1known', 1, 'o');
  const learningPoses = putWordsBase('test1learning', -1, 'x');
  const knownCount = updateProgresses(learningPoses, -1);
  updatePlans(knownCount, 0, -knownCount);
}

function updateViewByLearning() {
  const knownPoses = putWordsBase('test1known', 1, 'o');
  const learningPoses = putWordsBase('test1learning', -1, 'x');
  const knownCount = updateProgresses(knownPoses, 1);
  updatePlans(knownCount, 0, -knownCount);
}

function test1moveTop() {
  draggies.forEach(draggie => {
    draggie.destroy();
  });
  draggies = [];

  switch (test1method) {
    case 'known':
      updateViewByKnown();
      break;
    case 'unlearned':
      const [known, learning] = putWordsFromTest1();
      updatePlans(known, -known -learning, learning);
      break;
    case 'learning':
      updateViewByLearning();
      break;
  }
  if (navigator.onLine) {
    pushWords();
    pushIndex();
  } else {
    pendingPush = true;
  }
  putIndex();
  moveTop();
}

function searchByGoogle(event) {
  event.preventDefault();
  const input = document.getElementById('cse-search-input-box-id');
  document.getElementById('___gcse_0').classList.remove('d-none');
  const element = google.search.cse.element.getElement('searchresults-only0');
  if (input.value == '') {
    element.clearAllResults();
  } else {
    element.execute(input.value);
  }
}
document.getElementById('cse-search-box-form-id').onsubmit = searchByGoogle;

function search(id) {
  const lemma = document.getElementById('modal-title').textContent;
  switch (id) {
    case 'google': window.open(`https://www.google.com/search?q=${lemma}+意味`); return;
    case 'eijiro': window.open(`https://eow.alc.co.jp/search?q=${lemma}`); return;
    case 'weblio1': window.open(`https://ejje.weblio.jp/content/${lemma}`); return;
    case 'weblio2': window.open(`https://ejje.weblio.jp/sentence/content/${lemma}`); return;
    case 'reversoContext': window.open(`https://context.reverso.net/翻訳/英語-日本語/${lemma}`); return;
  }
}

function addDragEvent(obj, meaning, reset) {
  const test1known = document.getElementById('test1known');
  const test1learning = document.getElementById('test1learning');
  const dragZone = document.getElementById('dragZone');
  const draggie = new Draggabilly(obj);
  if (!reset) {
    obj.textContent = meaning[0];
    obj.classList.add('btn-lg');
  }
  draggie.on('staticClick', function() {
    document.getElementById('meaning').textContent = meaning[1].split('|').join(', ');
    document.getElementById('modal-title').textContent = meaning[0];
    modal.toggle('toggle');
  });
  draggie.on('dragStart', function(event, pointer) {
    const rect1 = obj.getBoundingClientRect();
    document.body.appendChild(obj);
    const rect2 = obj.getBoundingClientRect();
    draggie.setPosition(rect1.left - rect2.left, rect1.top - rect2.top);
  });
  draggie.on('dragEnd', function(event, pointer) {
    obj.removeAttribute('style');
    obj.classList.remove('btn-lg');
    if (draggie.position.y < 0) {
      const root = test1known.firstElementChild;
      root.insertBefore(obj, root.firstChild);
    } else {
      const root = test1learning.firstElementChild;
      root.insertBefore(obj, root.firstChild);
    }
    draggies = draggies.filter(d => d != draggie);
    draggie.destroy();
    addDragEvent(obj, meaning, true);
    if (dragZone.children.length == 0) {
      document.getElementById('test1continue').classList.remove('d-none');  // moveTop
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
  const dragZone = document.getElementById('dragZone');
  const lemmas = [...dragZone.children];
  const test1noneed = document.getElementById('test1noneed');
  lemmas.forEach((lemma, i) => {
    if (i >= problems.length) {
      test1noneed.appendChild(lemma);
    } else {
      addDragEvent(lemma, problems[i]);
    }
  });
}

function getTargetStateProblems(targetState) {
  let problems = [];
  enjaList.some(enja => {
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
  let result = [];
  enjaList.some(p => {
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
  test1method = 'unlearned';
  const problems = getUnlearnedProblems();
  const dragZone = document.getElementById('dragZone');
  const test1noneed = document.getElementById('test1noneed');
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
}

function test1cleanup() {
  document.getElementById('test1continue').classList.add('d-none');
  const dragZone = document.getElementById('dragZone');
  const test1known = document.getElementById('test1known');
  const test1learning = document.getElementById('test1learning');
  const test1noneed = document.getElementById('test1noneed');
  const movedLemma = [...test1known.firstElementChild.children]
    .concat([...test1learning.firstElementChild.children])
    .concat([...test1noneed.children]);
  movedLemma.forEach(lemma => {
    dragZone.appendChild(lemma);
  });
  carousel.to(1);
}

function test1(type) {
  test1cleanup();
  switch (type) {
    case 'known': return setProblems('known', 'o');
    case 'unlearned': return setUnlearnedProblems();
    case 'learning': return setProblems('learning', 'x');
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

function test2selectAnswers(type, progressPos) {
  let tmpProblems = enjaList.concat();
  switch (type) {
    case 'all':
      shuffle(tmpProblems);
      return tmpProblems.slice(0, maxTestLength);
    case 'learning':
      const target = tmpProblems.filter(enja => enja[2] && enja[2].slice(-1) == 'x');
      if (target.length < maxTestLength) {
        return target;
      } else {
        return target.slice(0, maxTestLength);
      }
    default:
      const progressLength = tmpProblems.length / 10;
      const pos = progressLength * progressPos;
      const answers = tmpProblems.slice(pos, pos + progressLength);
      return shuffle(answers).slice(0, maxTestLength);
  }
}

function test2generateProblems(type, progressPos) {
  const answers = test2selectAnswers(type, progressPos);
  testLength = answers.length;
  let problems = [];
  answers.forEach(answer => {
    const choices = test2generateChoices(answer);
    problems.push(choices);
  });
  return problems;
}

function generateChoice(enja, isAnswer) {
  const arr = enja[1].split('|');
  shuffle(arr);
  const ja = arr.slice(0, 3).join(', ');
  const [en, desc] = enja;
  return new Choice(en, ja, desc.split('|'), isAnswer);
}

function test2generateChoices(answer) {
  let choices = [generateChoice(answer, true)];
  while (choices.length != 4) {
    const enja = enjaList[getRandomInt(enjaList.length)];
    if (enja[0] != answer[0]) {
      const candidate = generateChoice(enja, false);
      if (choices.every(c => !c.desc.includes(candidate.ja))) {  // 同じ意味がないとき
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
    document.getElementById('test2lemma').textContent = choices[0].en;
    loopVoice(choices[0].en, 3);
  } else{
    document.getElementById('test2lemma').textContent = choices[0].ja;
  }
  shuffle(choices).forEach((choice, i) => {
    buttons[i].classList.remove('text-danger');
    if (eiwa) {
      buttons[i].textContent = choice.ja;
    } else {
      buttons[i].textContent = choice.en;
    }
    if (choice.isAnswer) {
      buttons[i].setAttribute('data-answer', 'true');
    } else {
      buttons[i].removeAttribute('data-answer');
    }
  });
}

function test2getTrs() {
  const trs1 = [...document.getElementById('test2table1').getElementsByTagName('tr')];
  const trs2 = [...document.getElementById('test2table2').getElementsByTagName('tr')];
  return trs1.concat(trs2);
}

function test2setResult(count, choices) {
  const trs = test2getTrs();
  const tr = trs[count - 1];
  const tds = tr.children;
  tds[0].textContent = choices[0].en;
  tds[1].textContent = choices[0].desc;
}

function test2all() {
  test2base('all')
}

function test2learning() {
  test2base('learning')
}

function test2seq(obj) {
  const progresses = [...document.getElementById('seqTest').children];
  const progressPos = progresses.findIndex(progress => progress == obj);
  test2base('seq', progressPos)
}

function test2base(type, progressPos) {
  test2problems = test2generateProblems(type, progressPos);
  test2count = 1;
  test2score = 0;
  const buttons = [...document.getElementById('choices').children];
  const eiwa = document.getElementById('testType1').checked;
  test2setResult(test2count, test2problems[0]);
  test2setButtons(eiwa, buttons, test2problems[0]);
  if (eiwa) {
    document.getElementById('test2voice').classList.remove('d-none');
  } else {
    document.getElementById('test2voice').classList.add('d-none');
  }
  carousel.to(2);
}

function test2countScore() {
  const buttons = [...document.getElementById('choices').children];
  return buttons.every(b => !b.classList.contains('text-danger'));
}

function test2moveTop() {
  const results = test2getTrs();
  results.forEach(result => {
    result.classList.remove('table-danger');
  });
  if (navigator.onLine) {
    pushWords();
    pushIndex();
  } else {
    pendingPush = true;
  }
  putIndex();
  moveTop();
}

function test2put(lemma, isCorrect) {
  const lemmaPos = enjaList.findIndex(enja => enja[0] == lemma);
  let state = enjaList[lemmaPos][2];
  let currentState;
  let known = 0, unlearned = 0, learning = 0;
  if (isCorrect) {
    currentState = 'o';
    updateEnjaListState(lemmaPos, currentState);
    if (!state) {
      unlearned -= 1;
      known += 1;
      updateProgress(lemma, lemmaPos, 1);
    } else if (state.slice(-1) == 'x') {
      learning -= 1;
      known += 1;
      updateProgress(lemma, lemmaPos, 1);
    }
  } else {
    currentState = 'x';
    updateEnjaListState(lemmaPos, currentState);
    if (!state) {
      unlearned -= 1;
      learning += 1;
    } else if (state.slice(-1) == 'o') {
      known -= 1;
      learning += 1;
      updateProgress(lemma, lemmaPos, -1);
    }
  }
  openDB(db => {
    state  ?  state += currentState  :  state = currentState;
    putWordState(db, lemma, state);
    updatePlans(known, unlearned, learning);
  });
}

function test2select(obj) {
  const buttons = [...document.getElementById('choices').children];
  const choices = test2problems[test2count - 1];
  const eiwa = document.getElementById('testType1').checked;
  if (obj.dataset.answer) {
    test2count += 1;
    const isCorrect = test2countScore();
    test2score += isCorrect;
    correctAudio.play();
    obj.textContent = '○ ' + obj.textContent;
    const answerLemma = choices.find(c => c.isAnswer).en;
    test2put(answerLemma, isCorrect);
    if (test2count > testLength) {
      document.getElementById('score').textContent = test2score;
      carousel.to(3);
    } else {
      const nextChoices = test2problems[test2count - 1];
      test2setResult(test2count, nextChoices);
      test2setButtons(eiwa, buttons, nextChoices);
    }
  } else {
    speechSynthesis.cancel();
    incorrectAudio.play();
    const pos = buttons.findIndex(btn => btn == obj);
    const choice = choices[pos];
    obj.textContent = choice.en + ': ' + choice.ja;
    obj.classList.add('text-danger');
    const results = test2getTrs();
    results[test2count - 1].classList.add('table-danger');
  }
}

function countupStates() {
  let planStates = [0, 0];
  let progressStates = [...Array(10)].map(() => Array(2).fill(0));
  enjaList.forEach(enja => {
    const [lemma, ja, state] = enja;
    const lemmaPos = enjaList.findIndex(p => p[0] == lemma);  // TODO: slow?
    const progressPos = Math.floor(lemmaPos / (enjaList.length / 10));
    if (!state) {
      planStates[0] += 1;
      progressStates[progressPos][0] += 1;
    } else if (state.slice(-1) == 'o') {
      planStates[1] += 1;
      progressStates[progressPos][1] += 1;
    }
  });
  return [planStates, progressStates];
}

function initProblemRange() {
  let from, to;
  const queries = parseQuery(location.search);
  if ('q' in queries) {
    [from, to] = queries['q'].split('-');
    from = parseInt(from);
    to = parseInt(to);
    level = to;
  } else {
    from = 1, to = 200, level = 200;
  }
  document.getElementById('levelText').textContent = getAward(level);
  document.getElementById('levelFrom').textContent = from;
  document.getElementById('levelTo').textContent = to;
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

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(response => {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  }).catch(err => {
    console.log(err);
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    initSheet();
    document.getElementById('signed').classList.remove('d-none');
  }
}

function resetPlan(clearedLevel) {
  const progresses = document.getElementById('progresses');
  const trElements = progresses.getElementsByTagName('tr');
  const trs = [...trElements].slice(1);
  const pos = trs.findIndex(tr => {
    const level = parseInt(tr.firstChild.innerText);
    if (clearedLevel < level) {
      return true;
    } else {
      return false;
    }
  });
  trs.slice(0, pos - 7).forEach(tr => {
    tr.remove();
  });
  const afterElements = trs.slice(pos);
  for (let i = 1; i <= 3 - afterElements.length; i++) {
    const key = clearedLevel + 1000 * (afterElements.length + i);
    const plan = createPlan(key - 999, key);
    progresses.appendChild(plan);
  }
}

function getAward(level) {
  switch (true) {
    case level <= 200: return '小6';
    case level <= 400: return '中1';
    case level <= 600: return '中2';
    case level <= 1000: return '中3';
    case level <= 1400: return '高1';
    case level <= 1800: return '高2';
    case level <= 2600: return '高3';
    case level <= 4000: return '大学生';
    case level <= 9000: return '社会人';
    case level <= 10000: return 'expatriater';
    case level <= 15000: return 'fighter';
    case level <= 20000: return 'knight';
    case level <= 25000: return 'interpreter';
    case level <= 30000: return 'native';
    case level <= 35000: return 'magician';
    case level <= 40000: return 'demon';
    default: return 'god';
  }
}

function createPlan(from, to) {
  const planBox = document.createElement('plan-box').shadowRoot;
  const a = planBox.querySelector('a');
  a.href = `/vocabee/drill/?q=${from}-${to}`;
  a.textContent = to;
  const progress = planBox.querySelector('progress');
  progress.id = 'progress' + to;
  const award = planBox.querySelector('td:nth-child(2)');
  award.textContent = getAward(to);
  return planBox;
}

function initFromSheet(range) {
  loadEnjaListFromSheet(range, () => {
    const [planStates, progressStates] = countupStates();
    loadPlans(planStates);
    loadProgresses(progressStates);
    putWords();
  });
  setAutoReload();
}

let reloadedTime, reloadTimer, reloadCheckedTime;
function setAutoReload() {
  const t = Date.now();
  reloadedTime = Date.now();
  reloadCheckedTime = Date.now();
  reloadTimer = setInterval(function() {
    const currTime = Date.now();
    // リロードチェック
    if (reloadedTime + 3300000 < currTime) {  // 55分に1回 token 更新
      if (reloadCheckedTime + 3300000) {  // 55分以上のスリープはページ更新
        location.reload();
      } else {
        gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
        reloadedTime = Date.now();
      }
    } else {
      reloadCheckedTime = Date.now();
    }
    // offline で put できなかったデータがあれば sheet に push
    if (navigator.onLine) {
      document.getElementById('signed').classList.remove('d-none');
      if (pendingPush) {
        pushWords();
        pushIndex();
      }
    } else {
      document.getElementById('signed').classList.add('d-none');
    }
  }, 1000);  // 1秒に1回チェック
}

function loadEnjaListFromSheet(range, callback) {
  let dict = {};
  if (range.values) {
    for (let i = 0; i < range.values.length; i++) {
      const row = range.values[i];
      const lemma = row[0];
      const state = row[1];
      dict[lemma] = state;
    }
  }
  return fetch('/vocabee/data/' + level + '.tsv').then(response => response.text()).then(text => {
    enjaList = [];
    text.split('\n').forEach(line => {
      const [en, ja] = line.split('\t');
      enjaList.push([en, ja, dict[en]]);
    });
    callback();
  });
}

function getSheetPos(level) {
  switch(true) {
    case level <= 1600: return level / 200;
    case level <= 2600: return (level - 1800) / 400 + 9;
    default: return (level - 3000) / 1000 + 12;
  }
}

function pushIndex() {
  const spreadsheetId = localStorage.getItem('vocabee.spreadsheetId');
  const indexPos = getSheetPos(level);
  let known = 0;
  enjaList.forEach(enja => {
    if (enja[2] && enja[2].slice(-1) == 'o') {
      known += 1;
    }
  });
  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `index!A${indexPos}`,
    valueInputOption: 'RAW',
    values: [[level, known]],
  }).then(response => {
    // TODO: should be localStorage?
    // TODO: タイミング次第で pushWords と競合
    pendingPush = false;
  }).catch(err => {
    pendingPush = true;
  });
}

function pushWords() {
  const spreadsheetId = localStorage.getItem('vocabee.spreadsheetId');
  const from = document.getElementById('levelFrom').textContent;
  const to = document.getElementById('levelTo').textContent;
  const values = enjaList.map(enja => [enja[0], enja[2]]);
  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `words!A${from}:B${to}`,
    valueInputOption: 'RAW',
    values: values,
  }).then(response => {
    // TODO: should be localStorage?
    // TODO: タイミング次第で pushWords と競合
    pendingPush = false;
  }).catch(err => {
    pendingPush = true;
  });
}

function initSheet() {
  // sheet は遅いので先に読み込んで、その後 sheet の内容をマージする
  const spreadsheetId = localStorage.getItem('vocabee.spreadsheetId');
  const [from, to] = initProblemRange();
  if (spreadsheetId) {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `words!A${from}:B${to}`,
    }).then(response => {
      document.getElementById('spreadsheetIdError').classList.add('d-none');
      return initFromSheet(response.result);
    }).catch(err => {
      switch (err.status) {
        case 400:
          addSheet(spreadsheetId, 'words');
          break;
        case 404:
          document.getElementById('spreadsheetIdError').classList.remove('d-none');
          break;
        default: console.log(err);
      }
    });
  }
}

function addSheet(spreadsheetId, title, callback) {
  return gapi.client.sheets.spreadsheets.batchUpdate(
    { spreadsheetId: spreadsheetId },
    {
      requests: [
        { addSheet: { properties: { title:title }}}
      ],
    }
  ).then(reponse => {
    if (callback) { callback(response); }
  }).catch(err => {
    console.log(err);
  });
}

function parseQuery(queryString) {
  let query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

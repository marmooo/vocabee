const CLIENT_ID="945330460050-osmelc2uen8vhdesa6kd55vvjivkm5vs.apps.googleusercontent.com",API_KEY="AIzaSyD_EbPMAwZ9EDHiLHqGToi7-31ZnwXHams",DISCOVERY_DOCS=["https://sheets.googleapis.com/$discovery/rest?version=v4"],SCOPES="https://www.googleapis.com/auth/drive.file",authorizeParts=document.getElementById("authorize"),authorizeButton=document.getElementById("authorize_button"),signoutButton=document.getElementById("signout_button");loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function init(){const e=localStorage.getItem("vocabee.spreadsheetId");e&&(document.getElementById("spreadsheetId").value=e),loadPlansFromIndexedDB(e=>{updatePlan(e)})}function updateSpreadsheetId(e){const t=e.target.value;localStorage.setItem("vocabee.spreadsheetId",t),loadPlansOrCreate()}function _handleClientLoad(){gapi.load("client:auth2",initClient)}function initClient(){gapi.client.init({apiKey:API_KEY,clientId:CLIENT_ID,discoveryDocs:DISCOVERY_DOCS,scope:SCOPES}).then(e=>{gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus),updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get()),authorizeButton.onclick=handleAuthClick,signoutButton.onclick=handleSignoutClick}).catch(e=>{console.log(e)})}function updateSigninStatus(e){e?(authorizeParts.style.display="none",signoutButton.style.display="inline-block",document.getElementById("signed").classList.remove("d-none"),loadPlansOrCreate()):(loadPlansFromIndexedDB(e=>{updatePlan(e)}),authorizeParts.style.display="inline-block",signoutButton.style.display="none")}function _renderButton(){gapi.signin2.render("authorize_button",{scope:"profile email",longtitle:!0,theme:"dark"})}function handleAuthClick(){gapi.auth2.getAuthInstance().signIn()}function handleSignoutClick(){gapi.auth2.getAuthInstance().signOut()}customElements.define("plan-box",class extends HTMLElement{constructor(){super();const e=document.getElementById("plan-box").content.cloneNode(!0);this.attachShadow({mode:"open"}).appendChild(e)}});function createSpreadsheet(){const e=gapi.client.sheets.spreadsheets.create({},{properties:{title:"Vocabee"},sheets:[{properties:{title:"index"}},{properties:{title:"words"}}]});e.then(e=>{const t=e.result.spreadsheetId;document.getElementById("spreadsheetId").value=t,localStorage.setItem("vocabee.spreadsheetId",t)},function(e){console.error("error: "+e.result.error.message)})}function getPlanRange(e){switch(!0){case e<=1800:return 200;case e<=2600:return 400;default:return 1e3}}function loadPlan(e,t,n){const s=document.getElementById("progress"+e);if(s){const o=getPlanRange(e);if(s.max=o,s.value=t,s.title=Math.ceil(n)+"%",95<=n){const e=s.parentNode.parentNode.firstChild;e.textContent="✔️"}}}function updatePlan(e){const n=document.getElementById("progresses"),s=n.getElementsByTagName("tr"),t=[...s].slice(1);if(e<5e3){const n=document.getElementById("progress5000").parentNode.parentNode,e=t.findIndex(e=>e==n);t.slice(0,e).forEach(e=>{e.classList.remove("d-none")}),t.slice(e+1).forEach(e=>{e.classList.add("d-none")})}else{const s=t.findIndex(t=>{const n=parseInt(t.children[1].textContent);if(e<n)return!0});t.slice(0,s-6).forEach(e=>{e.classList.add("d-none")});const o=t.slice(s);for(let t=0;t<=3-o.length;t++){const s=e+1e3*(o.length+t),i=document.getElementById("progress"+s);if(i){const e=i.parentNode.parentNode;e.classList.remove("d-none")}else{const e=createPlan(s-999,s);n.getElementsByTagName("tr")[0].parentNode.appendChild(e)}}}}function getAward(e){switch(!0){case e=200:return"小6";case e=400:return"中1";case e=600:return"中2";case e=800:return"中3";case e=1200:return"高1";case e=1600:return"高2";case e=2200:return"高3";case e=3e3:return"大学生";case e=5e3:return"社会人";case e=1e4:return"expatriater";case e=15e3:return"fighter";case e=2e4:return"knight";case e=25e3:return"interpreter";case e=3e4:return"native";case e=35e3:return"magician";case e=4e4:return"demon";default:return""}}function createPlan(e,t){const n=document.createElement("plan-box").shadowRoot,s=n.querySelector("a");s.href=`/vocabee/drill/?q=${e}-${t}`,s.textContent=t;const o=n.querySelector("progress");o.id="progress"+t;const i=n.querySelector("td:nth-child(3)");return i.textContent=getAward(t),n}function openDB(e){const t=indexedDB.open("vocabee");t.onsuccess=t=>e(t.target.result),t.onerror=()=>console.log("failed to open db"),t.onupgradeneeded=e=>{const t=e.target.result;t.createObjectStore("index",{keyPath:"level"});const n=t.createObjectStore("words",{keyPath:"lemma"});n.createIndex("level","level",{unique:!1})}}function putIndices(){const e=document.getElementById("progresses"),t=e.getElementsByTagName("tr"),n=[...t].slice(1),s=n.map(e=>{const n=e.children[5].firstChild,s=parseInt(n.id.slice(8));let t=parseInt(n.value);return t==0&&(t=void 0),[s,t]});s.forEach(e=>{const[t,n]=e;putIndex(t,n)})}function putIndex(e,t,n){openDB(s=>{const o="index",a={level:e,known:t},i=s.transaction(o,"readwrite").objectStore(o).put(a);i.onsuccess=e=>{n&&n(e)},i.onerror=()=>console.log("failed to put")})}function getIndex(e){return new Promise((t,n)=>{let o;const i="index",s=e.transaction(i,"readonly"),a=s.objectStore(i).getAll();s.oncomplete=()=>t(o),s.onerror=e=>n(e),a.onsuccess=e=>{o=e.target.result}})}function loadPlansFromIndexedDB(e){openDB(t=>{getIndex(t).then(t=>{let n=0;t.forEach(e=>{const t=e.level,s=e.known||0,o=getPlanRange(t),i=s*100/o||0;if(!document.getElementById("progress"+t)){const e=createPlan(t-o+1,t);progresses.appendChild(e)}loadPlan(t,s,i),95<=i&&n<t&&(n=t)}),e(n)})})}function loadPlansFromSheet(e){let t=0;if(e.values)for(let s=0;s<e.values.length;s++){const o=e.values[s],n=parseInt(o[0]),i=parseInt(o[1])||0,a=getPlanRange(n),r=i*100/a||0;if(!document.getElementById("progress"+n)){const e=createPlan(n-a+1,n);progresses.appendChild(e)}loadPlan(n,i,r),95<=r&&t<n&&(t=n)}return t}function loadPlansOrCreate(){const e=document.getElementById("spreadsheetId").value;e!=""?gapi.client.sheets.spreadsheets.values.get({spreadsheetId:e,range:"index!A1:B49"}).then(e=>{document.getElementById("spreadsheetIdError").classList.add("d-none");const t=loadPlansFromSheet(e.result);updatePlan(t),putIndices()}).catch(t=>{switch(t.status){case 400:addSheet(e,"index");break;case 404:document.getElementById("spreadsheetIdError").classList.remove("d-none");break;default:console.log(t)}}):createSpreadsheet()}function addSheet(e,t,n){return gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:e},{requests:[{addSheet:{properties:{title:t}}}]}).then(e=>{n&&n(e)}).catch(e=>{console.log(e)})}init(),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("spreadsheetId").onchange=updateSpreadsheetId
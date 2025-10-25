
// Family Feud — Diwali minimal (client-side, localStorage + optional Firebase placeholder)
// Features implemented:
// - Up to 7 teams
// - Manual reveal of answers (host)
// - Player screen accessible via shared link (same URL + ?room=ID)
// - Add/edit questions and answers
// - Scoreboard and team editing
// - Store data in localStorage; export/import JSON for sharing
// Optional: Firebase realtime sync (see README for enabling)

const STORAGE_KEY = "diwali_family_feud_v1";

let state = {
  teams: [{name:"Team 1",score:0}, {name:"Team 2",score:0}],
  questions: [],
  current: {qid:null, revealed:[]},
  roomId: null
};

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) state = JSON.parse(raw);
}
load();

// UI refs
const hostBtn = document.getElementById('hostBtn');
const playerBtn = document.getElementById('playerBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const teamCount = document.getElementById('teamCount');
const teamsEditor = document.getElementById('teamsEditor');
const saveTeams = document.getElementById('saveTeams');
const newQuestionBtn = document.getElementById('newQuestionBtn');
const randomQBtn = document.getElementById('randomQBtn');
const questionsList = document.getElementById('questionsList');

const hostScreen = document.getElementById('hostScreen');
const playerScreen = document.getElementById('playerScreen');
const setupPanel = document.getElementById('setup');
const questionsPanel = document.getElementById('questionsPanel');
const currentQuestionTitle = document.getElementById('currentQuestionTitle');
const answersGrid = document.getElementById('answersGrid');
const playerQuestionTitle = document.getElementById('playerQuestionTitle');
const playerAnswersGrid = document.getElementById('playerAnswersGrid');
const scoreboardHost = document.getElementById('scoreboardHost');
const scoreboardPlayer = document.getElementById('scoreboardPlayer');
const revealAllBtn = document.getElementById('revealAllBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const resetRoundBtn = document.getElementById('resetRoundBtn');

// helpers
function uid(n=6){ return Math.random().toString(36).slice(2,2+n); }
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function renderTeamsEditor(){
  teamsEditor.innerHTML = '';
  const count = clamp(parseInt(teamCount.value||2),2,7);
  for(let i=0;i<count;i++){
    const div = document.createElement('div');
    div.className = 'team-input';
    const inp = document.createElement('input');
    inp.type='text'; inp.value = (state.teams[i] && state.teams[i].name) || `Team ${i+1}`;
    inp.dataset.idx = i;
    const score = document.createElement('input');
    score.type='number'; score.value = (state.teams[i] && state.teams[i].score) || 0; score.style.width='84px';
    score.dataset.idx = i;
    div.appendChild(inp); div.appendChild(score);
    teamsEditor.appendChild(div);
  }
}

function saveTeamsHandler(){
  const inputs = teamsEditor.querySelectorAll('input[type="text"]');
  const scores = teamsEditor.querySelectorAll('input[type="number"]');
  state.teams = [];
  for(let i=0;i<inputs.length;i++){
    const name = inputs[i].value || `Team ${i+1}`;
    const sc = parseInt(scores[i].value||0);
    state.teams.push({name, score: sc});
  }
  save(); renderScoreboards();
  alert('Teams saved.');
}

function renderQuestions(){
  questionsList.innerHTML='';
  state.questions.forEach(q=>{
    const el = document.createElement('div'); el.className='question-card';
    const left = document.createElement('div');
    left.innerHTML = `<div style="font-weight:700">${q.text}</div><div class="q-meta">${q.answers.length} answers</div>`;
    const right = document.createElement('div');
    const openBtn = document.createElement('button'); openBtn.className='btn small'; openBtn.textContent='Open';
    openBtn.onclick = ()=> selectQuestion(q.id);
    const editBtn = document.createElement('button'); editBtn.className='btn small ghost'; editBtn.textContent='Edit';
    editBtn.onclick = ()=> editQuestion(q.id);
    const delBtn = document.createElement('button'); delBtn.className='btn small ghost'; delBtn.textContent='Delete';
    delBtn.onclick = ()=> { if(confirm('Delete question?')){ state.questions = state.questions.filter(x=>x.id!==q.id); save(); renderQuestions(); } };
    right.appendChild(openBtn); right.appendChild(editBtn); right.appendChild(delBtn);
    el.appendChild(left); el.appendChild(right);
    questionsList.appendChild(el);
  });
}

function editQuestion(qid){
  let q = state.questions.find(x=>x.id===qid);
  if(!q){ q = {id:uid(8), text:'', answers:[]}; state.questions.push(q); }
  const txt = prompt('Question text:', q.text||'');
  if(txt===null) return;
  q.text = txt;
  // simple answers editor loop
  let ansTxt = q.answers.map(a=>a.text+'|'+a.value).join('\n');
  ansTxt = prompt('Enter answers, one per line, as: answer|points\n(e.g. Samosa|35)', ansTxt)||'';
  q.answers = ansTxt.split('\n').map(l=>{
    const parts = l.split('|').map(s=>s.trim());
    return {text: parts[0]||'', value: parseInt(parts[1]||'0')||0, id: uid(6)};
  }).filter(a=>a.text);
  save(); renderQuestions();
}

function addQuestion(){
  const q = {id:uid(8), text:'New question', answers:[{id:uid(6),text:'Example answer',value:30}] };
  state.questions.push(q); save(); renderQuestions(); editQuestion(q.id);
}

function selectQuestion(qid){
  const q = state.questions.find(x=>x.id===qid);
  if(!q){ alert('Question not found'); return; }
  state.current.qid = q.id; state.current.revealed = [];
  save(); renderHostQuestion(); broadcastState();
}

function renderHostQuestion(){
  const q = state.questions.find(x=>x.id===state.current.qid);
  if(!q){ currentQuestionTitle.textContent='No question selected'; answersGrid.innerHTML=''; playerQuestionTitle.textContent='Waiting for host...'; playerAnswersGrid.innerHTML=''; return; }
  currentQuestionTitle.textContent = q.text;
  playerQuestionTitle.textContent = q.text;
  answersGrid.innerHTML='';
  playerAnswersGrid.innerHTML='';
  q.answers.forEach(a=>{
    const tile = document.createElement('div'); tile.className='answer-tile answer-hidden'; tile.dataset.aid=a.id;
    tile.innerHTML = `<span class="ans-text">${a.text}</span><span class="ans-score">${a.value}</span>`;
    tile.onclick = ()=> toggleReveal(a.id);
    answersGrid.appendChild(tile);

    const pt = tile.cloneNode(true);
    playerAnswersGrid.appendChild(pt);
  });
  renderScoreboards();
}

function toggleReveal(aid){
  if(!state.current.revealed.includes(aid)) state.current.revealed.push(aid);
  else state.current.revealed = state.current.revealed.filter(x=>x!==aid);
  save(); applyRevealToDOM(); broadcastState();
}

function applyRevealToDOM(){
  const q = state.questions.find(x=>x.id===state.current.qid);
  const tiles = answersGrid.querySelectorAll('.answer-tile');
  tiles.forEach(t=>{
    const aid = t.dataset.aid;
    const found = state.current.revealed.includes(aid);
    if(found){ t.classList.remove('answer-hidden'); t.style.opacity=1; t.style.color=''; }
    else { t.classList.add('answer-hidden'); t.style.opacity=''; }
  });
  // player side
  const ptiles = playerAnswersGrid.querySelectorAll('.answer-tile');
  ptiles.forEach(t=>{
    const aid = t.dataset.aid;
    const found = state.current.revealed.includes(aid);
    if(found){ t.classList.remove('answer-hidden'); t.style.opacity=1; t.style.color=''; }
    else { t.classList.add('answer-hidden'); t.style.opacity=''; }
  });
}

function revealAll(){ const q = state.questions.find(x=>x.id===state.current.qid); if(!q) return; state.current.revealed = q.answers.map(a=>a.id); save(); applyRevealToDOM(); broadcastState(); }
function resetRound(){ state.current.revealed = []; save(); applyRevealToDOM(); broadcastState(); }
function nextQuestion(){ const idx = state.questions.findIndex(x=>x.id===state.current.qid); const next = state.questions[idx+1] || state.questions[0]; if(next) selectQuestion(next.id); }

function renderScoreboards(){
  scoreboardHost.innerHTML=''; scoreboardPlayer.innerHTML='';
  state.teams.forEach((t, i)=>{
    const el = document.createElement('div'); el.className='team-score';
    el.innerHTML = `<div>${t.name}</div><div class="score-value" data-idx="${i}">${t.score}</div>`;
    // host adds +/- controls
    const hostEl = el.cloneNode(true);
    const plus = document.createElement('button'); plus.className='btn small'; plus.textContent='+10';
    plus.onclick = ()=> { changeScore(i, +10); };
    const minus = document.createElement('button'); minus.className='btn small ghost'; minus.textContent='-10';
    minus.onclick = ()=> { changeScore(i, -10); };
    hostEl.appendChild(plus); hostEl.appendChild(minus);
    scoreboardHost.appendChild(hostEl);
    scoreboardPlayer.appendChild(el);
  });
}

function changeScore(idx, delta){
  state.teams[idx].score += delta; save(); renderScoreboards(); broadcastState();
}

// copy player link (same URL with ?room=ROOMID)
function ensureRoom(){
  if(!state.roomId) state.roomId = uid(8);
  save();
  return state.roomId;
}
copyLinkBtn.onclick = ()=>{
  const rid = ensureRoom();
  const url = `${location.origin}${location.pathname}?room=${rid}`;
  navigator.clipboard.writeText(url).then(()=> alert('Player link copied! Paste to players.'));
}

// basic random question
randomQBtn.onclick = ()=>{
  if(state.questions.length===0){ alert('No questions. Add some!'); return; }
  const idx = Math.floor(Math.random()*state.questions.length);
  selectQuestion(state.questions[idx].id);
}

// add question
newQuestionBtn.onclick = addQuestion;

// host / player view toggles
hostBtn.onclick = ()=>{ showHost(); }
playerBtn.onclick = ()=>{ showPlayer(); }

function showHost(){
  hostScreen.classList.remove('hidden'); playerScreen.classList.add('hidden'); setupPanel.classList.remove('hidden'); questionsPanel.classList.remove('hidden');
  renderHostQuestion();
}
function showPlayer(){
  hostScreen.classList.add('hidden'); playerScreen.classList.remove('hidden'); setupPanel.classList.add('hidden'); questionsPanel.classList.add('hidden');
  renderHostQuestion();
}

// question controls
revealAllBtn.onclick = revealAll;
resetRoundBtn.onclick = resetRound;
nextQuestionBtn.onclick = nextQuestion;

// import/export
exportBtn.onclick = ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='family_feud_export.json'; a.click();
};

importBtn.onclick = ()=>{
  document.getElementById('fileInput').click();
};
document.getElementById('fileInput').onchange = (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{ const d = JSON.parse(reader.result); state = d; save(); renderAll(); alert('Imported.'); }
    catch(err){ alert('Invalid file'); }
  };
  reader.readAsText(f);
};

// Broadcast + simple sync:
// 1) For same-origin tabs on same device, use BroadcastChannel to sync host->players
// 2) For multiple devices, user can enable Firebase (see README) and paste config in settings (not automatically enabled here).
let bc = null;
if('BroadcastChannel' in window){
  try{
    bc = new BroadcastChannel('diwali_family_feud');
    bc.onmessage = (ev)=>{
      if(ev.data && ev.data.type==='state_update'){
        // accept updates from host if this tab is a player (determined by URL room param)
        const params = new URLSearchParams(location.search);
        const room = params.get('room');
        if(room && ev.data.room === room){
          state = ev.data.state; save(); renderAll(false);
        }
      }
    };
  }catch(e){ bc=null; }
}

function broadcastState(){
  // always send full state for simplicity
  const params = new URLSearchParams(location.search);
  const room = params.get('room') || state.roomId;
  if(bc) bc.postMessage({type:'state_update', room, state});
  // NOTE: To sync across devices, paste Firebase config into the README-guided spot to enable Realtime DB.
}

// on load, check url for room param -> open player view
function initFromUrl(){
  const params = new URLSearchParams(location.search);
  const room = params.get('room');
  if(room){
    state.roomId = room; save();
    showPlayer();
  } else {
    showHost();
  }
}

function renderAll(full=true){
  renderTeamsEditor(); renderQuestions(); renderScoreboards(); renderHostQuestion(); applyRevealToDOM();
  if(full) save();
}

saveTeams.onclick = saveTeamsHandler;

// initial render
renderAll();
initFromUrl();

// simple demo content if empty
if(state.questions.length===0){
  state.questions.push({id:uid(8), text:'Name a popular Diwali snack', answers:[{id:uid(6),text:'Samosa',value:45},{id:uid(6),text:'Ladoo',value:30},{id:uid(6),text:'Chaats',value:15},{id:uid(6),text:'Kachori',value:10}]});
  save(); renderQuestions();
}

const cards = [...document.querySelectorAll('.game-card')];
const filters = [...document.querySelectorAll('.filter')];
const search = document.querySelector('#search');
let category = 'all';

function refreshCards() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const visible = (category === 'all' || card.dataset.category === category) && card.dataset.name.includes(query);
    card.hidden = !visible;
    if (visible) count++;
  });
  document.querySelector('#empty').style.display = count ? 'none' : 'block';
  document.querySelector('.results').textContent = `${String(count).padStart(2, '0')} JUEGOS DISPONIBLES`;
}

filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.toggle('selected', item === button));
  category = button.dataset.filter;
  refreshCards();
}));
search.addEventListener('input', refreshCards);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault(); search.focus();
  }
});

const modal = document.querySelector('#game-modal');
const stage = document.querySelector('#game-stage');
const title = document.querySelector('#modal-title');
const help = document.querySelector('#modal-help');
let cleanGame = () => {};
let gameKeyHandler = null;
const gameNames = {drift:'NEON DRIFT',tiles:'TINY TILES',orbit:'ORBIT BOUNCE',sprint:'PIXEL SPRINT',drop:'COLOR DROP',lucky:'LUCKY BOUNCE'};

function openGame(name) {
  cleanGame();
  if (gameKeyHandler) document.removeEventListener('keydown', gameKeyHandler);
  title.textContent = gameNames[name];
  stage.innerHTML = '';
  modal.showModal();
  const ui = document.createElement('div'); ui.className = 'game-ui'; stage.append(ui);

  if (name === 'drift') {
    help.textContent = 'Usa ← → o A D para moverte y esquivar los bloques';
    let x = 50, score = 0, running = false, obstacleY = -40, lane = 1, frame;
    ui.innerHTML = '<div class="drift-track"></div><span class="game-score">0 M</span><span class="player-car">▰</span><span class="obstacle">▰</span><div class="game-message"><h3>Neon Drift</h3><p>Esquiva el tráfico todo lo que puedas</p><button>EMPEZAR</button></div>';
    const player = ui.querySelector('.player-car'), obstacle = ui.querySelector('.obstacle'), scoreEl = ui.querySelector('.game-score'), message = ui.querySelector('.game-message');
    const position = () => { player.style.left = `calc(50% + ${x - 50}px - 15px)`; obstacle.style.left = `calc(50% + ${lane * 48 - 24}px - 15px)`; };
    position();
    const key = e => { if (['ArrowLeft','a','A'].includes(e.key)) x = Math.max(27, x - 12); if (['ArrowRight','d','D'].includes(e.key)) x = Math.min(73, x + 12); position(); };
    gameKeyHandler = key; document.addEventListener('keydown', key);
    const tick = () => { if (!running) return; obstacleY += 4 + score / 120; if (obstacleY > 310) { obstacleY = -35; lane = Math.floor(Math.random()*3)-1; score += 10; scoreEl.textContent = `${score} M`; position(); } obstacle.style.top = `${obstacleY}px`; if (obstacleY > 235 && obstacleY < 290 && Math.abs(x - (50 + lane * 16)) < 13) { running = false; message.innerHTML = `<h3>Fin de la partida</h3><p>Recorriste ${score} metros</p><button>OTRA VEZ</button>`; message.style.display = 'block'; return; } frame = requestAnimationFrame(tick); };
    const start = () => { x=50;score=0;obstacleY=-40;lane=1;running=true;message.style.display='none';scoreEl.textContent='0 M';position();tick(); };
    message.querySelector('button').onclick = start;
    ui.addEventListener('click', e=>{if(e.target.tagName==='BUTTON') start()});
    cleanGame = () => { running=false;cancelAnimationFrame(frame); };
  } else if (name === 'tiles') {
    help.textContent = 'Desliza con las flechas o WASD para unir números iguales';
    let board = Array(16).fill(0), score = 0;
    const draw = () => { ui.innerHTML = `<span class="game-score">${score} PTS</span><div class="puzzle-grid">${board.map(n=>`<i>${n||''}</i>`).join('')}</div>`; };
    const spawn = () => { const empty=board.map((v,i)=>v?null:i).filter(v=>v!==null); if(empty.length) board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.85?2:4; };
    const move = key => { const dirs={ArrowLeft:'L',a:'L',ArrowRight:'R',d:'R',ArrowUp:'U',w:'U',ArrowDown:'D',s:'D'};let dir=dirs[key];if(!dir)return;let changed=false;
      for(let a=0;a<4;a++){let ids=Array.from({length:4},(_,b)=>dir==='L'?a*4+b:dir==='R'?a*4+3-b:dir==='U'?b*4+a:(3-b)*4+a);let vals=ids.map(i=>board[i]).filter(Boolean);for(let i=0;i<vals.length-1;i++)if(vals[i]===vals[i+1]){vals[i]*=2;score+=vals[i];vals.splice(i+1,1)}while(vals.length<4)vals.push(0);ids.forEach((id,j)=>{if(board[id]!==vals[j])changed=true;board[id]=vals[j]});}
      if(changed){spawn();draw();}
    };
    spawn();spawn();draw();gameKeyHandler=e=>move(e.key);document.addEventListener('keydown',gameKeyHandler);
  } else if (name === 'drop') {
    help.textContent = 'Toca el botón cuando el objetivo coincida con el color elegido';
    let score=0, target=0; const colors=['#ff684f','#c5fa43','#68c9ed','#bd76e8'];
    const draw=()=>{ui.innerHTML=`<span class="game-score">${score} PTS</span><div><button class="color-target" style="background:${colors[target]};color:${colors[target]}"></button><div class="color-options">${colors.map((c,i)=>`<button aria-label="Color ${i+1}" data-color="${i}" style="background:${c}"></button>`).join('')}</div></div>`;ui.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{if(+b.dataset.color===target)score+=10;else score=Math.max(0,score-5);target=(target+1)%colors.length;draw()});};draw();
  } else {
    const labels={orbit:'TOCA PARA REBOTAR',sprint:'PRESIONA PARA CORRER',lucky:'TOCA PARA REBOTAR'};
    const instruction={orbit:'Cada toque te da otro salto. ¿Cuántos aguantas?',sprint:'Toca tan rápido como puedas en 10 segundos',lucky:'Cada toque te acerca a la cima'};
    help.textContent=instruction[name];let score=0,time=10,started=false,timer;
    const draw=()=>{ui.innerHTML=`<span class="tap-count">${name==='sprint'&&started?`TIEMPO ${time}`:`${score} ${name==='sprint'?'TOQUES':'REBOTES'}`}</span><button class="${name==='orbit'?'orbit-play':name==='lucky'?'drop-play':'sprint-play'}">${name==='orbit'?'✦':name==='lucky'?'●':'▶'}<span>${started?'¡SIGUE!':labels[name]}</span></button>`;ui.querySelector('button').onclick=()=>{if(name==='sprint'&&!started){started=true;timer=setInterval(()=>{time--;draw();if(time<=0){clearInterval(timer);started=false;ui.innerHTML=`<div class="game-message"><h3>${score} toques</h3><p>Se acabó el tiempo</p><button>OTRA VEZ</button></div>`;ui.querySelector('button').onclick=()=>{score=0;time=10;draw()}}},1000)} if(name!=='sprint'||started)score++;draw()};};draw();cleanGame=()=>clearInterval(timer);
  }
}

document.querySelectorAll('[data-play]').forEach(button => button.addEventListener('click', () => openGame(button.dataset.play)));
document.querySelector('#close-modal').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => {cleanGame();if(gameKeyHandler)document.removeEventListener('keydown',gameKeyHandler);stage.innerHTML='';});



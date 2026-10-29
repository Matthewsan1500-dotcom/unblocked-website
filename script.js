const cards = [...document.querySelectorAll('.game-card')];
const filters = [...document.querySelectorAll('.filter')];
const search = document.querySelector('#search');
const modal = document.querySelector('#game-modal');
const stage = document.querySelector('#game-stage');
const title = document.querySelector('#modal-title');
const help = document.querySelector('#modal-help');
let category = 'all';
let cleanupGame = () => {};
let activeKeyHandler = null;

// Small, low-contrast falling stars keep the background alive without adding color noise.
const starfield = document.querySelector('.starfield');
if (starfield && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (let i = 0; i < 34; i++) {
    const star = document.createElement('i');
    star.className = 'falling-star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDuration = `${9 + Math.random() * 15}s`;
    star.style.animationDelay = `${-Math.random() * 24}s`;
    star.style.setProperty('--drift', `${Math.round(Math.random() * 120 - 60)}px`);
    star.style.opacity = `${0.18 + Math.random() * 0.45}`;
    starfield.append(star);
  }
}

function refreshCards() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const visible = (category === 'all' || card.dataset.category === category) && card.dataset.name.includes(query);
    card.hidden = !visible;
    if (visible) count++;
  });
  document.querySelector('#empty').style.display = count ? 'none' : 'block';
  document.querySelector('.results').textContent = `${String(count).padStart(2, '0')} GAMES AVAILABLE`;
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

const gameNames = {
  drift: 'NEON DRIFT', tiles: 'TINY TILES', orbit: 'ORBIT BOUNCE',
  sprint: 'PIXEL SPRINT', drop: 'COLOR DROP', lucky: 'LUCKY BOUNCE', famobi: 'THIEF PUZZLE'
};

function openGame(name) {
  cleanupGame();
  if (activeKeyHandler) document.removeEventListener('keydown', activeKeyHandler);
  title.textContent = gameNames[name] || 'CHROME';
  stage.replaceChildren();
  modal.showModal();

  if (name === 'famobi') {
    help.textContent = 'Hosted by Famobi. If it does not load, open it in a new tab.';
    stage.innerHTML = '<div class="famobi-wrap"><iframe class="famobi-frame" src="https://play.famobi.com/thief-puzzle" title="Thief Puzzle" allow="autoplay; fullscreen; gamepad" allowfullscreen loading="eager"></iframe><div class="famobi-fallback">Not loading? <a href="https://play.famobi.com/thief-puzzle" target="_blank" rel="noopener noreferrer">Open Thief Puzzle ↗</a></div></div>';
    cleanupGame = () => {};
    return;
  }

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  stage.append(ui);

  if (name === 'tiles') {
    startTiles(ui);
  } else if (name === 'orbit') {
    startTimingGame(ui, {type:'orbit', instruction:'Tap when the dot crosses the marker. Each round gets faster.'});
  } else if (name === 'lucky') {
    startTimingGame(ui, {type:'lucky', instruction:'Line up the bounce with the marker. You get three misses.'});
  } else if (name === 'drop') {
    startColorGame(ui);
  } else if (name === 'drift' || name === 'sprint') {
    startLaneGame(ui, name);
  }
}

function startLaneGame(ui, mode) {
  const sprint = mode === 'sprint';
  help.textContent = sprint ? '← → or A/D to switch lanes. Survive for 30 seconds.' : '← → or A/D to dodge. On mobile, tap the left or right side.';
  ui.innerHTML = `<div class="drift-track"></div><span class="game-score">0 ${sprint ? 'PTS' : 'M'}</span><span class="player-car">▰</span><span class="obstacle">▰</span><div class="game-message"><h3>${gameNames[mode]}</h3><p>${sprint ? 'Race through the lanes and avoid obstacles.' : 'Dodge traffic and get as far as you can.'}</p><button>START</button></div>`;
  const player = ui.querySelector('.player-car');
  const obstacle = ui.querySelector('.obstacle');
  const scoreEl = ui.querySelector('.game-score');
  const message = ui.querySelector('.game-message');
  const lanes = [-64, 0, 64];
  let playerLane = 1, obstacleLane = 1, y = -45, score = 0, running = false, lastTime = 0, frame = 0, timeLeft = 30;

  const place = () => {
    player.style.left = `calc(50% + ${lanes[playerLane]}px - 15px)`;
    obstacle.style.left = `calc(50% + ${lanes[obstacleLane]}px - 15px)`;
  };
  const move = event => {
    if (!running) return;
    if (['ArrowLeft','a','A'].includes(event.key)) playerLane = Math.max(0, playerLane - 1);
    if (['ArrowRight','d','D'].includes(event.key)) playerLane = Math.min(2, playerLane + 1);
    place();
  };
  activeKeyHandler = move;
  document.addEventListener('keydown', move);
  ui.addEventListener('pointerdown', event => {
    if (!running || event.target.closest('button')) return;
    const rect = ui.getBoundingClientRect();
    playerLane = event.clientX < rect.left + rect.width / 2 ? Math.max(0, playerLane - 1) : Math.min(2, playerLane + 1);
    place();
  });

  function finish(text) {
    running = false;
    cancelAnimationFrame(frame);
    message.innerHTML = `<h3>${text}</h3><p>${sprint ? `Score: ${score}` : `You made it ${score} m`}</p><button>PLAY AGAIN</button>`;
    message.style.display = 'block';
    message.querySelector('button').onclick = start;
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.05);
    lastTime = now;
    y += (sprint ? 285 : 230 + score * 2) * dt;
    obstacle.style.top = `${y}px`;
    if (y > 290 && y < 345 && obstacleLane === playerLane) return finish('GAME OVER');
    if (y > 340) {
      y = -48;
      obstacleLane = Math.floor(Math.random() * 3);
      score += sprint ? 100 : 10;
      scoreEl.textContent = `${score} ${sprint ? 'PTS' : 'M'}`;
      place();
    }
    if (sprint) {
      timeLeft -= dt;
      scoreEl.textContent = `${score} PTS · ${Math.ceil(timeLeft)}S`;
      if (timeLeft <= 0) return finish('TIME UP');
    }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    playerLane = 1; obstacleLane = Math.floor(Math.random() * 3); y = -48; score = 0; timeLeft = 30;
    scoreEl.textContent = sprint ? '0 PTS · 30S' : '0 M';
    message.style.display = 'none'; running = true; lastTime = performance.now(); place();
    frame = requestAnimationFrame(tick);
  }
  message.querySelector('button').onclick = start;
  place();
  cleanupGame = () => { running = false; cancelAnimationFrame(frame); };
}

function startTiles(ui) {
  help.textContent = 'Merge matching numbers with the arrow keys or WASD. Reach 2048.';
  ui.innerHTML = '<div class="puzzle-game"><div class="puzzle-toolbar"><span>SCORE <b class="tile-score">0</b> · BEST <b class="tile-best">0</b></span><button class="tile-reset">NEW GAME</button></div><div class="puzzle-grid"></div><div class="tile-message"></div></div>';
  const grid = ui.querySelector('.puzzle-grid'), scoreLabel = ui.querySelector('.tile-score'), bestLabel = ui.querySelector('.tile-best'), message = ui.querySelector('.tile-message');
  let board = Array(16).fill(0), score = 0, best = Number(localStorage.getItem('afterdark-tiles-best') || 0), finished = false;
  bestLabel.textContent = best;
  const render = () => {
    grid.innerHTML = board.map(value => `<i ${value ? `data-value="${value}"` : ''}>${value || ''}</i>`).join('');
    scoreLabel.textContent = score;
  };
  const spawn = () => {
    const empty = board.map((value, index) => value ? -1 : index).filter(index => index >= 0);
    if (empty.length) board[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < .88 ? 2 : 4;
  };
  const gameOver = () => {
    if (board.includes(0)) return false;
    for (let row=0; row<4; row++) for (let col=0; col<4; col++) {
      const i=row*4+col;
      if (col<3 && board[i]===board[i+1]) return false;
      if (row<3 && board[i]===board[i+4]) return false;
    }
    return true;
  };
  const move = event => {
    const directions={ArrowLeft:'L',a:'L',ArrowRight:'R',d:'R',ArrowUp:'U',w:'U',ArrowDown:'D',s:'D'};
    const direction=directions[event.key];
    if (!direction || finished) return;
    event.preventDefault();
    let changed=false;
    for (let line=0; line<4; line++) {
      const ids=Array.from({length:4},(_,n)=>direction==='L'?line*4+n:direction==='R'?line*4+3-n:direction==='U'?n*4+line:(3-n)*4+line);
      const values=ids.map(index=>board[index]).filter(Boolean);
      for(let i=0;i<values.length-1;i++) if(values[i]===values[i+1]) { values[i]*=2;score+=values[i];values.splice(i+1,1); }
      while(values.length<4) values.push(0);
      ids.forEach((id,i)=>{if(board[id]!==values[i])changed=true;board[id]=values[i];});
    }
    if (!changed) return;
    if(score>best){best=score;localStorage.setItem('afterdark-tiles-best',best);bestLabel.textContent=best;}
    spawn();render();
    if(board.includes(2048)){finished=true;message.textContent='You reached 2048! Start a new game to keep playing.';}
    else if(gameOver()){finished=true;message.textContent='No moves left. Start a new game.';}
  };
  const reset = () => {board=Array(16).fill(0);score=0;finished=false;message.textContent='';spawn();spawn();render();};
  activeKeyHandler=move;document.addEventListener('keydown',move);
  ui.querySelector('.tile-reset').onclick=reset;
  reset();
}

function startTimingGame(ui, {type, instruction}) {
  help.textContent = instruction;
  const isOrbit=type==='orbit';
  ui.innerHTML=`<span class="game-score">${isOrbit?'BOUNCES':'HEIGHT'} 0 · MISSES 0/3</span><div class="game-prompt"><h3>${gameNames[type]}</h3><p>${instruction}</p><div class="timing-ring"><span class="timing-target"></span><span class="timing-needle"></span><span class="timing-core">${isOrbit?'✦':'●'}</span></div><button class="tap-button">${isOrbit?'JUMP':'BOUNCE'}</button></div>`;
  const scoreEl=ui.querySelector('.game-score'), needle=ui.querySelector('.timing-needle'), button=ui.querySelector('.tap-button'), heading=ui.querySelector('.game-prompt h3'), copy=ui.querySelector('.game-prompt p');
  let angle=-90, speed=150, score=0, misses=0, playing=true, last=0, frame;
  function tick(now){if(!playing)return;const dt=Math.min((now-last)/1000||0,.05);last=now;angle=(angle+speed*dt)%360;needle.style.transform=`translate(-50%,-50%) rotate(${angle}deg) translateY(-79px)`;frame=requestAnimationFrame(tick);}
  function end(){playing=false;cancelAnimationFrame(frame);heading.textContent='GAME OVER';copy.textContent=`Final score: ${score}. Tap again to restart.`;button.textContent='RETRY';}
  function reset(){angle=-90;speed=150;score=0;misses=0;playing=true;heading.textContent=gameNames[type];copy.textContent=instruction;button.textContent=isOrbit?'JUMP':'BOUNCE';scoreEl.textContent=`${isOrbit?'BOUNCES':'HEIGHT'} 0 · MISSES 0/3`;last=performance.now();frame=requestAnimationFrame(tick);}
  button.onclick=()=>{
    if(!playing){reset();return;}
    const distance=Math.min(Math.abs(angle-270),360-Math.abs(angle-270));
    if(distance<15){score++;speed=Math.min(320,speed+12);button.classList.add('hit');setTimeout(()=>button.classList.remove('hit'),120);}
    else misses++;
    scoreEl.textContent=`${isOrbit?'BOUNCES':'HEIGHT'} ${score} · MISSES ${misses}/3`;
    if(misses>=3)end();
  };
  cleanupGame=()=>{playing=false;cancelAnimationFrame(frame);};
  reset();
}

function startColorGame(ui) {
  help.textContent='Pick the color that matches the target. Clear 10 rounds and protect your three lives.';
  const colors=[['ASH','#9f959a'],['WINE','#793348'],['NIGHT','#383238'],['SILVER','#d0c6ca']];
  let score=0,lives=3,target=0,round=1,locked=false;
  function draw(){
    ui.innerHTML=`<span class="game-score">ROUND ${round}/10 · LIVES ${'♥'.repeat(lives)}${'♡'.repeat(3-lives)}</span><div class="game-prompt"><h3>${round>10?'CLEAR.':`PICK ${colors[target][0]}`}</h3><p>${round>10?`Final score: ${score}/10`:'Choose the matching shade to continue.'}</p><div class="color-choice-grid">${colors.map(([label,color],i)=>`<button class="color-choice" data-color="${i}" style="--swatch:${color}">${label}</button>`).join('')}</div>${round>10?'<button class="tap-button color-restart">PLAY AGAIN</button>':''}</div>`;
    ui.querySelectorAll('[data-color]').forEach(button=>{button.style.background=`linear-gradient(135deg, ${colors[button.dataset.color][1]} 0 42%, #171316 42% 100%)`;button.onclick=()=>choose(Number(button.dataset.color));});
    const restart=ui.querySelector('.color-restart');if(restart)restart.onclick=reset;
  }
  function choose(index){if(locked||round>10)return;locked=true;if(index===target)score++;else lives--;round++;if(lives<=0||round>10){round=11;}target=Math.floor(Math.random()*colors.length);setTimeout(()=>{locked=false;draw();},180);}
  function reset(){score=0;lives=3;round=1;target=Math.floor(Math.random()*colors.length);draw();}
  reset();
}

document.querySelectorAll('[data-play]').forEach(button=>button.addEventListener('click',()=>openGame(button.dataset.play)));
document.querySelector('#close-modal').addEventListener('click',()=>modal.close());
modal.addEventListener('close',()=>{cleanupGame();if(activeKeyHandler)document.removeEventListener('keydown',activeKeyHandler);stage.replaceChildren();});


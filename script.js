const cards = [...document.querySelectorAll('.game-card')];
const filters = [...document.querySelectorAll('.filter')];
const search = document.querySelector('#search');
const modal = document.querySelector('#game-modal');
const stage = document.querySelector('#game-stage');
const title = document.querySelector('#modal-title');
const help = document.querySelector('#modal-help');
const browserUrl = document.querySelector('#browser-url');
let activeGameUrl = '';
let category = 'all';

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
  document.querySelector('.results').textContent = `${String(count).padStart(2, '0')} ${count === 1 ? 'GAME' : 'GAMES'} AVAILABLE`;
}

filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.toggle('selected', item === button));
  category = button.dataset.filter;
  refreshCards();
}));
search.addEventListener('input', refreshCards);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
});

function openGameInsidePage(link) {
  const gameName = link.getAttribute('aria-label')?.replace(/^Play\s+/i, '') || link.closest('.game-card')?.querySelector('h3')?.textContent || 'Game';
  activeGameUrl = link.href;
  const gameUrl = new URL(activeGameUrl);
  title.textContent = gameName.toUpperCase();
  browserUrl.textContent = gameUrl.hostname + gameUrl.pathname;
  help.textContent = 'The game host may block in-page playback. If the frame stays blank, this page does not allow embedding.';
  stage.innerHTML = `<iframe class="browser-frame" src="${activeGameUrl}" title="${gameName}" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock" allow="autoplay; fullscreen; gamepad" allowfullscreen loading="eager"></iframe>`;
  if (!modal.open) modal.showModal();
}

document.querySelectorAll('.game-card .card-art').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  openGameInsidePage(link);
}));

document.querySelector('#reload-game').addEventListener('click', () => {
  const frame = stage.querySelector('iframe');
  if (frame) frame.src = activeGameUrl;
});

document.querySelector('#close-modal').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => stage.replaceChildren());


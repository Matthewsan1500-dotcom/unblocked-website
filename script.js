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
const favoriteStorageKey = 'chrome-game-favorites-v1';
let favorites = new Set();
try {
  favorites = new Set(JSON.parse(localStorage.getItem(favoriteStorageKey) || '[]'));
} catch {}

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
    const cardUrl = card.querySelector('.card-art').href;
    const categoryMatch = category === 'all' || (category === 'favorites' ? favorites.has(cardUrl) : card.dataset.category === category);
    const visible = categoryMatch && card.dataset.name.includes(query);
    card.hidden = !visible;
    if (visible) count++;
  });
  const empty = document.querySelector('#empty');
  empty.textContent = category === 'favorites' && favorites.size === 0 ? 'NO FAVORITES YET. TAP A HEART TO SAVE A GAME.' : 'NO MATCHES. TRY ANOTHER SEARCH.';
  empty.style.display = count ? 'none' : 'block';
  document.querySelector('.results').textContent = `${String(count).padStart(2, '0')} ${count === 1 ? 'GAME' : 'GAMES'} AVAILABLE`;
}

function updateFavoriteCount() {
  document.querySelector('.favorite-count').textContent = String(favorites.size).padStart(2, '0');
  document.querySelectorAll('.favorite-toggle').forEach(button => {
    const selected = favorites.has(button.dataset.gameUrl);
    button.classList.toggle('is-favorite', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', selected ? 'Remove from favorites' : 'Add to favorites');
    button.querySelector('span').textContent = selected ? '♥' : '♡';
  });
}

cards.forEach(card => {
  const link = card.querySelector('.card-art');
  const favoriteButton = document.createElement('button');
  favoriteButton.type = 'button';
  favoriteButton.className = 'play-icon favorite-toggle';
  favoriteButton.dataset.gameUrl = link.href;
  favoriteButton.setAttribute('aria-pressed', 'false');
  favoriteButton.setAttribute('aria-label', 'Add to favorites');
  favoriteButton.innerHTML = '<span aria-hidden="true">♡</span>';
  card.querySelector('.play-icon').replaceWith(favoriteButton);
  favoriteButton.addEventListener('click', () => {
    const gameUrl = favoriteButton.dataset.gameUrl;
    if (favorites.has(gameUrl)) favorites.delete(gameUrl);
    else favorites.add(gameUrl);
    try {
      localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
    } catch {}
    updateFavoriteCount();
    if (category === 'favorites') refreshCards();
  });
});
updateFavoriteCount();

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

document.querySelector('#reload-game').addEventListener('click', () => {
  const frame = stage.querySelector('iframe');
  if (frame) frame.src = activeGameUrl;
});

document.querySelector('#close-modal').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => stage.replaceChildren());

const recentStorageKey = 'chrome-recent-games-v1';
const recentGrid = document.querySelector('#recent-grid');
const recentNote = document.querySelector('#recent-note');
const surpriseModal = document.querySelector('#surprise-modal');
const rouletteWindow = document.querySelector('#roulette-window');
const rouletteTrack = document.querySelector('#roulette-track');
const rouletteStatus = document.querySelector('#roulette-status');
const rouletteResult = document.querySelector('#roulette-result');
const rouletteTitle = document.querySelector('#roulette-game-title');
const roulettePlay = document.querySelector('#roulette-play');
const spinButton = document.querySelector('#spin-button');
let recentGames = [];
let rouletteSpinning = false;
let rouletteWinner = null;
let rouletteTimer = null;
let rouletteSession = 0;
try {
  recentGames = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
  if (!Array.isArray(recentGames)) recentGames = [];
} catch {}

function getGameInfo(card) {
  return {
    url: card.querySelector('.card-art').href,
    title: card.querySelector('h3').textContent.trim(),
    poster: card.querySelector('.game-photo, .game-logo')?.src || ''
  };
}

function saveRecent(game) {
  recentGames = [game, ...recentGames.filter(item => item.url !== game.url)].slice(0, 8);
  try {
    localStorage.setItem(recentStorageKey, JSON.stringify(recentGames));
  } catch {}
  renderRecentGames();
}

function renderRecentGames() {
  recentGrid.replaceChildren();
  recentNote.hidden = recentGames.length > 0;
  recentGames.forEach(game => {
    const link = document.createElement('a');
    link.className = 'recent-card';
    link.href = game.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Play ${game.title} again`);
    if (game.poster) {
      const image = document.createElement('img');
      image.src = game.poster;
      image.alt = '';
      image.loading = 'lazy';
      link.append(image);
    }
    const name = document.createElement('span');
    name.textContent = game.title;
    link.append(name);
    link.addEventListener('click', () => saveRecent(game));
    recentGrid.append(link);
  });
}

cards.forEach(card => card.querySelector('.card-art').addEventListener('click', () => saveRecent(getGameInfo(card))));
renderRecentGames();

function spinTicket(game) {
  const ticket = document.createElement('div');
  ticket.className = 'roulette-ticket';
  if (game.poster) {
    const image = document.createElement('img');
    image.src = game.poster;
    image.alt = '';
    image.loading = 'eager';
    ticket.append(image);
  }
  const name = document.createElement('span');
  name.textContent = game.title;
  ticket.append(name);
  return ticket;
}

function startRoulette() {
  if (rouletteSpinning) return;
  const session = ++rouletteSession;
  rouletteSpinning = true;
  rouletteWinner = null;
  rouletteResult.hidden = true;
  rouletteStatus.textContent = 'THE REEL IS PICKING YOUR NEXT GAME…';
  spinButton.disabled = true;
  spinButton.innerHTML = 'SPINNING <span>↻</span>';
  const pool = cards.map(getGameInfo);
  const winningIndex = 34;
  const sequence = Array.from({ length: winningIndex + 1 }, () => pool[Math.floor(Math.random() * pool.length)]);
  rouletteWinner = pool[Math.floor(Math.random() * pool.length)];
  sequence[winningIndex] = rouletteWinner;
  rouletteTrack.replaceChildren(...sequence.map(spinTicket));
  rouletteTrack.style.transition = 'none';
  rouletteTrack.style.transform = 'translateX(0)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (session !== rouletteSession || !surpriseModal.open) return;
    const ticket = rouletteTrack.children[winningIndex];
    const stop = ticket.offsetLeft + ticket.offsetWidth / 2 - rouletteWindow.clientWidth / 2;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 650 : 5200;
    rouletteTrack.style.transition = `transform ${duration}ms cubic-bezier(.08,.76,.12,1)`;
    rouletteTrack.style.transform = `translateX(-${stop}px)`;
    rouletteTimer = window.setTimeout(() => {
      rouletteTimer = null;
      rouletteSpinning = false;
      rouletteStatus.textContent = 'THE WHEEL HAS SPOKEN';
      rouletteTitle.textContent = rouletteWinner.title;
      roulettePlay.href = rouletteWinner.url;
      rouletteResult.hidden = false;
      spinButton.disabled = false;
      spinButton.innerHTML = 'SPIN AGAIN <span>↻</span>';
    }, duration + 100);
  }));
}

document.querySelector('#surprise-button').addEventListener('click', () => {
  rouletteModalReset();
  surpriseModal.showModal();
  startRoulette();
});

function rouletteModalReset() {
  rouletteSession++;
  if (rouletteTimer) window.clearTimeout(rouletteTimer);
  rouletteTimer = null;
  rouletteSpinning = false;
  rouletteTrack.replaceChildren();
  rouletteTrack.style.transition = 'none';
  rouletteTrack.style.transform = 'translateX(0)';
  rouletteResult.hidden = true;
  rouletteStatus.textContent = 'LET THE WHEEL PICK YOUR NEXT GAME';
  spinButton.disabled = false;
  spinButton.innerHTML = 'SPIN THE REEL <span>↻</span>';
}

spinButton.addEventListener('click', startRoulette);
roulettePlay.addEventListener('click', () => {
  if (rouletteWinner) saveRecent(rouletteWinner);
});
document.querySelector('#close-surprise').addEventListener('click', () => surpriseModal.close());
surpriseModal.addEventListener('click', event => {
  if (event.target === surpriseModal) surpriseModal.close();
});
surpriseModal.addEventListener('close', rouletteModalReset);

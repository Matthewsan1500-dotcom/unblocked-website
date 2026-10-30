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

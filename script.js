const cards = [...document.querySelectorAll('.game-card')];
const filters = [...document.querySelectorAll('.filter')];
const search = document.querySelector('#search');
const modal = document.querySelector('#game-modal');
const stage = document.querySelector('#game-stage');
const title = document.querySelector('#modal-title');
const help = document.querySelector('#modal-help');
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

document.querySelector('[data-play="famobi"]').addEventListener('click', () => {
  title.textContent = 'THIEF PUZZLE';
  help.textContent = 'Hosted by Famobi. If it does not load, open it in a new tab.';
  stage.innerHTML = '<div class="famobi-wrap"><iframe class="famobi-frame" src="https://play.famobi.com/thief-puzzle" title="Thief Puzzle" allow="autoplay; fullscreen; gamepad" allowfullscreen loading="eager"></iframe><div class="famobi-fallback">Not loading? <a href="https://play.famobi.com/thief-puzzle" target="_blank" rel="noopener noreferrer">Open Thief Puzzle ↗</a></div></div>';
  modal.showModal();
});

document.querySelector('#close-modal').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => stage.replaceChildren());


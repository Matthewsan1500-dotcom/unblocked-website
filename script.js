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
const accountStorageKeys = ['chrome-game-favorites-v1', 'chrome-recent-games-v1', 'chrome-player-progress-v1', 'chrome-player-profile-v1'];
const accountDialog = document.querySelector('#account-dialog');
const accountForm = document.querySelector('#account-form');
const accountEmail = document.querySelector('#account-email');
const accountPassword = document.querySelector('#account-password');
const accountMessage = document.querySelector('#account-message');
const accountSubmit = document.querySelector('#account-submit');
const accountSwitch = document.querySelector('#account-switch');
const accountSignout = document.querySelector('#account-signout');
const accountButton = document.querySelector('#account-button');
const accountStatus = document.querySelector('#account-status');
const settingsDialog = document.querySelector('#settings-dialog');
const accentStorageKey = 'chrome-accent-color-v1';
const modeStorageKey = 'chrome-appearance-mode-v1';
const redeemedCodesStorageKey = 'chrome-redeemed-codes-v1';
const unlockedCosmeticsStorageKey = 'chrome-unlocked-cosmetics-v1';
const celebratedAchievementsStorageKey = 'chrome-celebrated-achievements-v1';
let unlockedCosmetics = new Set();
let redeemedCodes = new Set();
let celebratedAchievements = new Set();
try {
  unlockedCosmetics = new Set(JSON.parse(localStorage.getItem(unlockedCosmeticsStorageKey) || '[]'));
  redeemedCodes = new Set(JSON.parse(localStorage.getItem(redeemedCodesStorageKey) || '[]'));
  celebratedAchievements = new Set(JSON.parse(localStorage.getItem(celebratedAchievementsStorageKey) || '[]'));
} catch {}
const accentPalettes = {
  red: { main: '#70253a', bright: '#c37484', line: '#a6546c', deep: '#541b29', rgb: '112,37,58' },
  silver: { main: '#747982', bright: '#d2d4da', line: '#aeb2bb', deep: '#444852', rgb: '174,178,187' },
  blue: { main: '#245c7c', bright: '#78b9df', line: '#4e9ac7', deep: '#173b51', rgb: '78,154,199' },
  purple: { main: '#583677', bright: '#c09ae9', line: '#9a70c9', deep: '#38224e', rgb: '154,112,201' },
  green: { main: '#245d48', bright: '#82d2aa', line: '#54a982', deep: '#173c2e', rgb: '84,169,130' },
  orange: { main: '#74411e', bright: '#e5ad71', line: '#d58a45', deep: '#4e2b16', rgb: '213,138,69' },
  pink: { main: '#762e51', bright: '#ed91bb', line: '#d9699b', deep: '#4e1e36', rgb: '217,105,155' },
  nebula: { main: '#343f82', bright: '#a9b7ff', line: '#7b8cff', deep: '#202754', rgb: '123,140,255' },
  gold: { main: '#70551c', bright: '#f0d47e', line: '#d4ad45', deep: '#4e3b14', rgb: '212,173,69' },
  glitch: { main: '#146b69', bright: '#84f3e7', line: '#44d7c8', deep: '#104745', rgb: '68,215,200' },
  frost: { main: '#2e607b', bright: '#a6e8ff', line: '#72cbea', deep: '#1c3f54', rgb: '114,203,234' },
  sunset: { main: '#78433c', bright: '#ffb28f', line: '#f18b68', deep: '#512c2a', rgb: '241,139,104' },
  eclipse: { main: '#45324f', bright: '#c49cdb', line: '#a77ac4', deep: '#30213a', rgb: '167,122,196' },
  midnight: { main: '#30345e', bright: '#aab5ff', line: '#7787ec', deep: '#202344', rgb: '119,135,236' },
  supernova: { main: '#713253', bright: '#ff9fe1', line: '#ea70c4', deep: '#4d203b', rgb: '234,112,196' },
  comet: { main: '#315a53', bright: '#a2e8cb', line: '#64cba2', deep: '#203f3a', rgb: '100,203,162' }
};
const codeRewards = {
  STARFALL: { avatar: '🌠', avatarKey: 'avatar-nebula', accent: 'nebula', accentKey: 'accent-nebula', name: 'Nebula Phantom' },
  GOLDRUSH: { avatar: '👑', avatarKey: 'avatar-gold', accent: 'gold', accentKey: 'accent-gold', name: 'Chrome Crown' },
  VOIDMODE: { avatar: '🌀', avatarKey: 'avatar-glitch', accent: 'glitch', accentKey: 'accent-glitch', name: 'Glitch Spirit' },
  FROSTBYTE: { avatar: '🧊', avatarKey: 'avatar-frost', accent: 'frost', accentKey: 'accent-frost', name: 'Frostbyte' },
  SUNSETX: { avatar: '🌅', avatarKey: 'avatar-sunset', accent: 'sunset', accentKey: 'accent-sunset', name: 'Sunset Runner' },
  DARKMATTER: { avatar: '🌑', avatarKey: 'avatar-eclipse', accent: 'eclipse', accentKey: 'accent-eclipse', name: 'Dark Matter' }
};
const secretAchievements = [
  { id: 'night-owl', title: 'NIGHT OWL', detail: 'Play 5 games between 10 PM and 4 AM', reached: () => Number(playerProgress.nightOpens) >= 5, avatar: '🦉', avatarKey: 'avatar-owl', accent: 'midnight', accentKey: 'accent-midnight', reward: 'Night Owl' },
  { id: 'reel-royalty', title: 'REEL ROYALTY', detail: 'Spin Surprise Me 10 times', reached: () => Number(playerProgress.spins) >= 10, avatar: '🎲', avatarKey: 'avatar-dice', accent: 'supernova', accentKey: 'accent-supernova', reward: 'Lucky Dice' },
  { id: 'full-rotation', title: 'FULL ROTATION', detail: 'Play 20 different games', reached: () => playerProgress.allUnique.length >= 20, avatar: '🪐', avatarKey: 'avatar-comet', accent: 'comet', accentKey: 'accent-comet', reward: 'Comet Rider' }
];
let activeAccent = 'red';
let accountMode = 'signin';
let signedInUser = null;
let cloudSaveTimer = null;
const supabaseConfig = window.STUDYHALL_SUPABASE_CONFIG || {};
const supabaseReady = Boolean(supabaseConfig.url && supabaseConfig.publishableKey && !supabaseConfig.url.includes('YOUR_') && !supabaseConfig.publishableKey.includes('YOUR_') && window.supabase?.createClient);
const supabaseClient = supabaseReady ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey) : null;
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
    else {
      favorites.add(gameUrl);
      recordFavoriteSave();
    }
    try {
      localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
    } catch {}
    queueCloudSave();
    updateFavoriteCount();
    renderProfile();
    renderAchievements();
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
const progressStorageKey = 'chrome-player-progress-v1';
const profileStorageKey = 'chrome-player-profile-v1';
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
const multiplayerUrls = new Set([
  'https://www.crazygames.com/game/buildnow-gg',
  'https://www.crazygames.com/game/hyperblox-shooting',
  'https://www.crazygames.com/game/soldiers---capture-and-control',
  'https://www.crazygames.com/game/dye-hard',
  'https://www.crazygames.com/game/polytrack',
  'https://www.crazygames.com/game/krash-karts',
  'https://www.crazygames.com/game/12-minibattles'
]);
const multiplayerGrid = document.querySelector('#multiplayer-grid');
const challengeList = document.querySelector('#challenge-list');
const achievementsGrid = document.querySelector('#achievements-grid');
const profileDialog = document.querySelector('#profile-dialog');
const profileNameInput = document.querySelector('#profile-name-input');
let selectedAvatar = 'C';
let playerProfile = { name: 'Player One', avatar: 'C' };
let playerProgress = {};
try {
  recentGames = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
  if (!Array.isArray(recentGames)) recentGames = [];
} catch {}

try {
  const savedProfile = JSON.parse(localStorage.getItem(profileStorageKey) || 'null');
  if (savedProfile && typeof savedProfile === 'object') {
    playerProfile = { name: String(savedProfile.name || 'Player One').slice(0, 18), avatar: String(savedProfile.avatar || 'C') };
  }
} catch {}

function weekStamp() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function emptyProgress() {
  return { week: weekStamp(), weeklyOpens: 0, weeklyUnique: [], weeklyFavorites: 0, allUnique: [], spins: 0, nightOpens: 0, multiplayerUnique: [] };
}

try {
  playerProgress = JSON.parse(localStorage.getItem(progressStorageKey) || 'null') || emptyProgress();
} catch {
  playerProgress = emptyProgress();
}
if (playerProgress.week !== weekStamp()) playerProgress = { ...emptyProgress(), allUnique: playerProgress.allUnique || [], spins: playerProgress.spins || 0, nightOpens: playerProgress.nightOpens || 0, multiplayerUnique: playerProgress.multiplayerUnique || [] };
playerProgress.weeklyUnique = Array.isArray(playerProgress.weeklyUnique) ? playerProgress.weeklyUnique : [];
playerProgress.allUnique = Array.isArray(playerProgress.allUnique) ? playerProgress.allUnique : [];
playerProgress.multiplayerUnique = Array.isArray(playerProgress.multiplayerUnique) ? playerProgress.multiplayerUnique : [];
playerProgress.nightOpens = Number(playerProgress.nightOpens) || 0;

function persistProgress() {
  try { localStorage.setItem(progressStorageKey, JSON.stringify(playerProgress)); } catch {}
  queueCloudSave();
}

function renderProfile() {
  const xp = playerProgress.allUnique.length * 20 + favorites.size * 10 + (Number(playerProgress.spins) || 0) * 5;
  const level = Math.floor(xp / 100) + 1;
  document.querySelector('#profile-avatar').textContent = playerProfile.avatar;
  document.querySelector('#profile-name').textContent = playerProfile.name.toUpperCase();
  document.querySelector('#profile-level').textContent = String(level).padStart(2, '0');
  document.querySelector('#profile-xp').textContent = `${xp} XP`;
  document.querySelector('#xp-fill').style.width = `${xp % 100}%`;
}

function renderChallenges() {
  const challenges = [
    { title: 'Open 5 games', value: Number(playerProgress.weeklyOpens) || 0, goal: 5, detail: 'Play a few rounds this week' },
    { title: 'Try 4 different games', value: playerProgress.weeklyUnique.length, goal: 4, detail: 'Explore the game library' },
    { title: 'Save 3 favorites', value: Number(playerProgress.weeklyFavorites) || 0, goal: 3, detail: 'Tap the heart on games you like' }
  ];
  challengeList.replaceChildren(...challenges.map(challenge => {
    const item = document.createElement('article');
    item.className = 'challenge-item';
    const copy = document.createElement('div');
    copy.className = 'challenge-copy';
    const titleNode = document.createElement('b');
    titleNode.textContent = challenge.title;
    const detail = document.createElement('span');
    detail.textContent = challenge.detail;
    copy.append(titleNode, detail);
    const count = document.createElement('span');
    count.className = 'challenge-count';
    count.textContent = `${Math.min(challenge.value, challenge.goal)} / ${challenge.goal}`;
    const track = document.createElement('div');
    track.className = 'challenge-track';
    const fill = document.createElement('i');
    fill.style.width = `${Math.min(100, challenge.value / challenge.goal * 100)}%`;
    track.append(fill);
    item.append(copy, count, track);
    return item;
  }));
}

function renderAchievements() {
  const regular = [
    { id: 'first-drop', title: 'FIRST DROP', detail: 'Open your first game', unlocked: playerProgress.allUnique.length >= 1 },
    { id: 'night-explorer', title: 'NIGHT EXPLORER', detail: 'Play 10 different games', unlocked: playerProgress.allUnique.length >= 10 },
    { id: 'curator', title: 'CURATOR', detail: 'Save 5 games as favorites', unlocked: favorites.size >= 5 },
    { id: 'lucky-spin', title: 'LUCKY SPIN', detail: 'Spin the surprise reel 5 times', unlocked: (Number(playerProgress.spins) || 0) >= 5 },
    { id: 'squad-up', title: 'SQUAD UP', detail: 'Try 3 multiplayer games', unlocked: playerProgress.multiplayerUnique.length >= 3 }
  ];
  const secrets = secretAchievements.map(secret => {
    const unlocked = secret.reached();
    if (unlocked && grantCosmeticReward(secret, `secret-${secret.id}`)) animateUnlockedReward(secret);
    return {
      id: secret.id,
      title: unlocked ? secret.title : '???',
      detail: unlocked ? `${secret.detail} · Reward: ${secret.reward}` : 'Complete a secret challenge to reveal this reward',
      unlocked,
      secret: true
    };
  });
  const achievements = [...regular, ...secrets];
  document.querySelector('#achievement-count').textContent = `${achievements.filter(item => item.unlocked).length} / ${achievements.length} UNLOCKED`;
  achievementsGrid.replaceChildren(...achievements.map(achievement => {
    const item = document.createElement('article');
    item.className = `achievement-card${achievement.unlocked ? ' unlocked' : ''}${achievement.secret ? ' secret-achievement' : ''}`;
    item.dataset.achievementId = achievement.id;
    if (achievement.unlocked && !celebratedAchievements.has(achievement.id)) {
      item.classList.add('newly-unlocked');
      celebratedAchievements.add(achievement.id);
    }
    const icon = document.createElement('span');
    icon.className = 'achievement-icon';
    icon.textContent = achievement.unlocked ? '✦' : achievement.secret ? '？' : '◇';
    const titleNode = document.createElement('b');
    titleNode.textContent = achievement.title;
    const detail = document.createElement('span');
    detail.textContent = achievement.detail;
    const state = document.createElement('small');
    state.textContent = achievement.unlocked ? 'UNLOCKED' : achievement.secret ? 'HIDDEN' : 'LOCKED';
    item.append(icon, titleNode, detail, state);
    return item;
  }));
  try { localStorage.setItem(celebratedAchievementsStorageKey, JSON.stringify([...celebratedAchievements])); } catch {}
}

function renderMultiplayer() {
  const picks = cards.filter(card => multiplayerUrls.has(card.querySelector('.card-art').href)).slice(0, 7);
  multiplayerGrid.replaceChildren(...picks.map(card => {
    const game = getGameInfo(card);
    const link = document.createElement('a');
    link.className = 'friend-card';
    link.href = game.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (game.poster) {
      const image = document.createElement('img');
      image.src = game.poster;
      image.alt = '';
      image.loading = 'lazy';
      link.append(image);
    }
    const label = document.createElement('span');
    label.textContent = game.title;
    const arrow = document.createElement('i');
    arrow.textContent = '↗';
    link.append(label, arrow);
    link.addEventListener('click', event => { event.preventDefault(); saveRecent(game); openGame(game); });
    return link;
  }));
}

function recordGameOpen(game) {
  playerProgress.weeklyOpens = (Number(playerProgress.weeklyOpens) || 0) + 1;
  const localHour = new Date().getHours();
  if (localHour >= 22 || localHour < 4) playerProgress.nightOpens = (Number(playerProgress.nightOpens) || 0) + 1;
  if (!playerProgress.weeklyUnique.includes(game.url)) playerProgress.weeklyUnique.push(game.url);
  if (!playerProgress.allUnique.includes(game.url)) playerProgress.allUnique.push(game.url);
  if (multiplayerUrls.has(game.url) && !playerProgress.multiplayerUnique.includes(game.url)) playerProgress.multiplayerUnique.push(game.url);
  persistProgress();
  renderProfile();
  renderChallenges();
  renderAchievements();
}

function recordFavoriteSave() {
  playerProgress.weeklyFavorites = (Number(playerProgress.weeklyFavorites) || 0) + 1;
  persistProgress();
  renderProfile();
  renderChallenges();
  renderAchievements();
}

document.querySelector('#edit-profile').addEventListener('click', () => {
  profileNameInput.value = playerProfile.name;
  selectedAvatar = playerProfile.avatar;
  document.querySelectorAll('#avatar-picker [data-avatar]').forEach(button => button.classList.toggle('selected', button.dataset.avatar === selectedAvatar));
  profileDialog.showModal();
});
document.querySelectorAll('#avatar-picker [data-avatar]').forEach(button => button.addEventListener('click', () => {
  selectedAvatar = button.dataset.avatar;
  document.querySelectorAll('#avatar-picker [data-avatar]').forEach(item => item.classList.toggle('selected', item === button));
}));
document.querySelector('#save-profile').addEventListener('click', () => {
  playerProfile = { name: profileNameInput.value.trim().slice(0, 18) || 'Player One', avatar: selectedAvatar };
  try { localStorage.setItem(profileStorageKey, JSON.stringify(playerProfile)); } catch {}
  queueCloudSave();
  renderProfile();
  profileDialog.close();
});
document.querySelector('#close-profile').addEventListener('click', () => profileDialog.close());
profileDialog.addEventListener('click', event => { if (event.target === profileDialog) profileDialog.close(); });

renderProfile();
renderChallenges();
renderAchievements();
renderMultiplayer();

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
  queueCloudSave();
  renderRecentGames();
  recordGameOpen(game);
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

function openGame(game) {
  activeGameUrl = game.url;
  title.textContent = game.title;
  try {
    const parsed = new URL(game.url);
    browserUrl.textContent = parsed.hostname.replace(/^www\./, '').toUpperCase();
  } catch {
    browserUrl.textContent = 'CHROME / GAMES';
  }
  const frame = document.createElement('iframe');
  frame.className = 'browser-frame';
  frame.title = game.title;
  frame.src = game.url;
  frame.allow = 'autoplay; fullscreen; gamepad; accelerometer; gyroscope; picture-in-picture';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation');
  stage.replaceChildren(frame);
  help.textContent = 'Playing inside Chrome. If this game stays blank, its website may block embedded play.';
  modal.showModal();
}

cards.forEach(card => {
  const link = card.querySelector('.card-art');
  link.addEventListener('click', event => {
    event.preventDefault();
    openGame(getGameInfo(card));
  });
});
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
  playerProgress.spins = (Number(playerProgress.spins) || 0) + 1;
  persistProgress();
  renderProfile();
  renderAchievements();
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
roulettePlay.addEventListener('click', event => {
  event.preventDefault();
  if (rouletteWinner) { saveRecent(rouletteWinner); openGame(rouletteWinner); }
});
document.querySelector('#close-surprise').addEventListener('click', () => surpriseModal.close());
surpriseModal.addEventListener('click', event => {
  if (event.target === surpriseModal) surpriseModal.close();
});
surpriseModal.addEventListener('close', rouletteModalReset);

function setAccountMode(mode) {
  accountMode = mode;
  const signingUp = mode === 'signup';
  document.querySelector('#account-title').textContent = signingUp ? 'CREATE ACCOUNT' : 'SIGN IN';
  accountSubmit.textContent = signingUp ? 'CREATE ACCOUNT' : 'SIGN IN';
  accountSwitch.textContent = signingUp ? 'Already have an account? Sign in' : 'New here? Create an account';
  accountPassword.autocomplete = signingUp ? 'new-password' : 'current-password';
  accountMessage.textContent = '';
}

function updateAccountUI() {
  if (signedInUser) {
    accountButton.textContent = 'ACCOUNT';
    accountStatus.textContent = `SYNCED TO ${signedInUser.email.toUpperCase()}`;
    accountSignout.hidden = false;
    accountForm.hidden = true;
    accountSwitch.hidden = true;
    accountMessage.textContent = `Signed in as ${signedInUser.email}`;
    return;
  }
  accountButton.textContent = 'SIGN IN';
  accountStatus.textContent = supabaseReady ? 'SIGN IN TO SYNC ACROSS DEVICES' : 'ACCOUNT SETUP NEEDED';
  accountSignout.hidden = true;
  accountForm.hidden = false;
  accountSwitch.hidden = !supabaseReady;
  accountMessage.textContent = supabaseReady ? '' : 'Cloud accounts need a Supabase project connection first';
}

function queueCloudSave() {
  if (!signedInUser || !supabaseClient) return;
  window.clearTimeout(cloudSaveTimer);
  accountStatus.textContent = 'SYNCING ACCOUNT…';
  cloudSaveTimer = window.setTimeout(async () => {
    const row = {
      user_id: signedInUser.id,
      profile: playerProfile,
      progress: playerProgress,
      favorites: [...favorites],
      recent_games: recentGames,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabaseClient.from('player_saves').upsert(row, { onConflict: 'user_id' });
    if (error) {
      accountStatus.textContent = 'CLOUD SYNC ERROR';
      console.error('Could not sync player save', error.message);
    } else if (signedInUser) accountStatus.textContent = `SYNCED TO ${signedInUser.email.toUpperCase()}`;
  }, 500);
}

function saveCloudDataToDevice(row) {
  if (row?.profile && typeof row.profile === 'object') playerProfile = { name: String(row.profile.name || 'Player One').slice(0, 18), avatar: String(row.profile.avatar || 'C') };
  if (row?.progress && typeof row.progress === 'object') playerProgress = row.progress;
  if (row?.favorites && Array.isArray(row.favorites)) favorites = new Set(row.favorites);
  if (row?.recent_games && Array.isArray(row.recent_games)) recentGames = row.recent_games.slice(0, 8);
  if (!playerProgress || typeof playerProgress !== 'object') playerProgress = emptyProgress();
  if (playerProgress.week !== weekStamp()) playerProgress = { ...emptyProgress(), allUnique: playerProgress.allUnique || [], spins: playerProgress.spins || 0, nightOpens: playerProgress.nightOpens || 0, multiplayerUnique: playerProgress.multiplayerUnique || [] };
  playerProgress.weeklyUnique = Array.isArray(playerProgress.weeklyUnique) ? playerProgress.weeklyUnique : [];
  playerProgress.allUnique = Array.isArray(playerProgress.allUnique) ? playerProgress.allUnique : [];
  playerProgress.multiplayerUnique = Array.isArray(playerProgress.multiplayerUnique) ? playerProgress.multiplayerUnique : [];
  playerProgress.nightOpens = Number(playerProgress.nightOpens) || 0;
  try {
    localStorage.setItem(profileStorageKey, JSON.stringify(playerProfile));
    localStorage.setItem(progressStorageKey, JSON.stringify(playerProgress));
    localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
    localStorage.setItem(recentStorageKey, JSON.stringify(recentGames));
  } catch {}
  updateFavoriteCount();
  renderProfile();
  renderChallenges();
  renderAchievements();
  renderRecentGames();
}

async function handleAuthSession(session) {
  signedInUser = session?.user || null;
  updateAccountUI();
  if (!signedInUser) return;
  const userId = signedInUser.id;
  const { data, error } = await supabaseClient.from('player_saves').select('profile, progress, favorites, recent_games').eq('user_id', userId).maybeSingle();
  if (signedInUser?.id !== userId) return;
  if (error) {
    accountStatus.textContent = 'CLOUD SAVE TABLE NOT READY';
    accountMessage.textContent = 'The account database setup still needs to be completed';
    return;
  }
  if (data) saveCloudDataToDevice(data);
  else queueCloudSave();
  updateAccountUI();
}

accountButton.addEventListener('click', () => {
  setAccountMode('signin');
  updateAccountUI();
  accountDialog.showModal();
});
document.querySelector('#close-account').addEventListener('click', () => accountDialog.close());
accountDialog.addEventListener('click', event => { if (event.target === accountDialog) accountDialog.close(); });
accountSwitch.addEventListener('click', () => setAccountMode(accountMode === 'signin' ? 'signup' : 'signin'));
accountForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabaseClient) {
    accountMessage.textContent = 'Cloud login is not connected yet. Add the Supabase URL and publishable key to supabase-config.js';
    return;
  }
  accountSubmit.disabled = true;
  accountMessage.textContent = accountMode === 'signup' ? 'Creating account…' : 'Signing in…';
  const email = accountEmail.value.trim();
  const password = accountPassword.value;
  const result = accountMode === 'signup'
    ? await supabaseClient.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}${location.pathname}` } })
    : await supabaseClient.auth.signInWithPassword({ email, password });
  accountSubmit.disabled = false;
  if (result.error) {
    accountMessage.textContent = result.error.message;
    return;
  }
  if (accountMode === 'signup' && !result.data.session) {
    accountMessage.textContent = 'Account created. Check your email to confirm it, then sign in here.';
    return;
  }
  if (result.data.session) {
    await handleAuthSession(result.data.session);
    accountDialog.close();
  }
});
accountSignout.addEventListener('click', async () => {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    accountMessage.textContent = error.message;
    return;
  }
  signedInUser = null;
  accountStorageKeys.forEach(key => localStorage.removeItem(key));
  favorites = new Set();
  recentGames = [];
  playerProfile = { name: 'Player One', avatar: 'C' };
  playerProgress = emptyProgress();
  updateFavoriteCount();
  renderProfile();
  renderChallenges();
  renderAchievements();
  renderRecentGames();
  updateAccountUI();
  setAccountMode('signin');
});

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => handleAuthSession(session));
  });
} else updateAccountUI();

function renderExclusiveRewards() {
  document.querySelectorAll('[data-reward-key]').forEach(button => {
    button.hidden = !unlockedCosmetics.has(button.dataset.rewardKey);
  });
  const hasAvatarReward = [...document.querySelectorAll('#avatar-picker [data-reward-key]')].some(button => !button.hidden);
  document.querySelector('#exclusive-avatar-label').hidden = !hasAvatarReward;
}

function grantCosmeticReward(reward, sourceKey) {
  if (unlockedCosmetics.has(sourceKey)) return false;
  unlockedCosmetics.add(sourceKey);
  if (reward.avatarKey) unlockedCosmetics.add(reward.avatarKey);
  if (reward.accentKey) unlockedCosmetics.add(reward.accentKey);
  try { localStorage.setItem(unlockedCosmeticsStorageKey, JSON.stringify([...unlockedCosmetics])); } catch {}
  renderExclusiveRewards();
  return true;
}

function animateUnlockedReward(reward) {
  const targets = [
    document.querySelector(`#avatar-picker [data-reward-key="${reward.avatarKey}"]`),
    document.querySelector(`.theme-options [data-reward-key="${reward.accentKey}"]`),
    document.querySelector('#profile-avatar')
  ].filter(Boolean);
  targets.forEach(target => {
    target.classList.remove('reward-pop');
    void target.offsetWidth;
    target.classList.add('reward-pop');
    window.setTimeout(() => target.classList.remove('reward-pop'), 1100);
  });
}

function applyAccent(name, save = true) {
  if (!['red', 'silver', 'blue', 'purple', 'green', 'orange', 'pink'].includes(name) && !unlockedCosmetics.has(`accent-${name}`)) return;
  const selected = accentPalettes[name] ? name : 'red';
  const colors = accentPalettes[selected];
  activeAccent = selected;
  const root = document.documentElement;
  root.style.setProperty('--accent-main', colors.main);
  root.style.setProperty('--accent-bright', colors.bright);
  root.style.setProperty('--accent-line', colors.line);
  root.style.setProperty('--accent-deep', colors.deep);
  root.style.setProperty('--accent-rgb', colors.rgb);
  root.dataset.accent = selected;
  document.querySelectorAll('[data-accent-choice]').forEach(button => {
    const isSelected = button.dataset.accentChoice === selected;
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  if (save) {
    try { localStorage.setItem(accentStorageKey, selected); } catch {}
  }
}

let savedAccent = 'red';
try { savedAccent = localStorage.getItem(accentStorageKey) || 'red'; } catch {}
applyAccent(savedAccent, false);
renderExclusiveRewards();
document.querySelector('#settings-button').addEventListener('click', () => settingsDialog.showModal());
document.querySelector('#close-settings').addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => { if (event.target === settingsDialog) settingsDialog.close(); });
document.querySelectorAll('[data-accent-choice]').forEach(button => button.addEventListener('click', () => applyAccent(button.dataset.accentChoice)));

const secretCodeInput = document.querySelector('#secret-code');
const codeMessage = document.querySelector('#code-message');
function redeemSecretCode() {
  const code = secretCodeInput.value.trim().toUpperCase().replace(/\s+/g, '');
  if (!code) {
    codeMessage.textContent = 'Enter a code first';
    return;
  }
  const reward = codeRewards[code];
  if (!reward) {
    codeMessage.textContent = 'That code did not work. Try another one';
    return;
  }
  if (redeemedCodes.has(code)) {
    codeMessage.textContent = 'That code was already redeemed on this device';
    return;
  }
  redeemedCodes.add(code);
  grantCosmeticReward(reward, `code-${code}`);
  animateUnlockedReward(reward);
  try { localStorage.setItem(redeemedCodesStorageKey, JSON.stringify([...redeemedCodes])); } catch {}
  playerProfile = { ...playerProfile, avatar: reward.avatar };
  try { localStorage.setItem(profileStorageKey, JSON.stringify(playerProfile)); } catch {}
  applyAccent(reward.accent);
  renderProfile();
  queueCloudSave();
  codeMessage.textContent = `${reward.name} unlocked · new profile icon and ${reward.accent.toUpperCase()} color added`;
  codeMessage.classList.remove('reward-message-pop');
  void codeMessage.offsetWidth;
  codeMessage.classList.add('reward-message-pop');
  secretCodeInput.value = '';
  document.querySelectorAll('#avatar-picker [data-avatar]').forEach(button => button.classList.toggle('selected', button.dataset.avatar === playerProfile.avatar));
}
document.querySelector('#redeem-code').addEventListener('click', redeemSecretCode);
secretCodeInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); redeemSecretCode(); } });

function applyAppearance(mode, save = true) {
  const selected = mode === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.mode = selected;
  document.querySelector('meta[name="theme-color"]').content = selected === 'light' ? '#eceef2' : '#09080a';
  document.querySelectorAll('[data-mode-choice]').forEach(button => {
    const isSelected = button.dataset.modeChoice === selected;
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  if (save) {
    try { localStorage.setItem(modeStorageKey, selected); } catch {}
  }
}

let savedMode = 'dark';
try { savedMode = localStorage.getItem(modeStorageKey) || 'dark'; } catch {}
applyAppearance(savedMode, false);
document.querySelectorAll('[data-mode-choice]').forEach(button => button.addEventListener('click', () => applyAppearance(button.dataset.modeChoice)));

const feedbackDialog = document.querySelector('#feedback-dialog');
const feedbackForm = document.querySelector('#feedback-form');
const brokenGameSelect = document.querySelector('#broken-game');
const suggestedTitle = document.querySelector('#suggested-title');
const suggestedUrl = document.querySelector('#suggested-url');
const feedbackDetails = document.querySelector('#feedback-details');
let feedbackMode = 'suggest';
cards.forEach(card => {
  const game = getGameInfo(card);
  const option = document.createElement('option');
  option.value = game.url;
  option.textContent = game.title;
  brokenGameSelect.append(option);
});

function openFeedback(mode) {
  feedbackMode = mode;
  const reporting = mode === 'report';
  document.querySelector('#feedback-dialog-title').innerHTML = reporting ? 'REPORT A <em>GAME</em>' : 'SUGGEST A <em>GAME</em>';
  document.querySelector('#broken-game-field').hidden = !reporting;
  document.querySelector('#suggested-title-field').hidden = reporting;
  document.querySelector('#suggested-url-field').hidden = reporting;
  suggestedTitle.required = !reporting;
  feedbackDetails.placeholder = reporting ? 'What happens when you try to open it?' : 'Why should we add this game?';
  feedbackDetails.value = '';
  suggestedTitle.value = '';
  suggestedUrl.value = '';
  document.querySelector('#feedback-message').textContent = 'This opens a draft issue on GitHub for you to review and submit.';
  document.querySelector('#feedback-submit').textContent = 'CONTINUE TO GITHUB ↗';
  feedbackDialog.showModal();
}

document.querySelector('#suggest-game-button').addEventListener('click', () => openFeedback('suggest'));
document.querySelector('#report-game-button').addEventListener('click', () => openFeedback('report'));
document.querySelector('#close-feedback').addEventListener('click', () => feedbackDialog.close());
feedbackDialog.addEventListener('click', event => { if (event.target === feedbackDialog) feedbackDialog.close(); });
feedbackForm.addEventListener('submit', event => {
  event.preventDefault();
  const reporting = feedbackMode === 'report';
  const gameTitle = reporting ? brokenGameSelect.options[brokenGameSelect.selectedIndex]?.textContent : suggestedTitle.value.trim();
  const gameUrl = reporting ? brokenGameSelect.value : suggestedUrl.value.trim();
  const issueTitle = reporting ? `Broken game report: ${gameTitle}` : `Game suggestion: ${gameTitle}`;
  const body = [
    reporting ? 'A player reported a game that may not be working.' : 'A player suggested adding a game to the library.',
    '',
    `Game: ${gameTitle}`,
    gameUrl ? `Link: ${gameUrl}` : '',
    '',
    reporting ? 'What happened:' : 'Why add it:',
    feedbackDetails.value.trim(),
    '',
    `Sent from: ${location.origin}${location.pathname}`
  ].filter(line => line !== undefined).join('\n');
  const issueUrl = new URL('https://github.com/Matthewsan1500-dotcom/unblocked-website/issues/new');
  issueUrl.search = new URLSearchParams({ title: issueTitle, body }).toString();
  window.open(issueUrl.toString(), '_blank', 'noopener,noreferrer');
  document.querySelector('#feedback-message').textContent = 'GitHub opened with your draft. Sign in there to submit it.';
});

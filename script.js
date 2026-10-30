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
const accentPalettes = {
  red: { main: '#70253a', bright: '#c37484', line: '#a6546c', deep: '#541b29', rgb: '112,37,58' },
  silver: { main: '#747982', bright: '#d2d4da', line: '#aeb2bb', deep: '#444852', rgb: '174,178,187' },
  blue: { main: '#245c7c', bright: '#78b9df', line: '#4e9ac7', deep: '#173b51', rgb: '78,154,199' },
  purple: { main: '#583677', bright: '#c09ae9', line: '#9a70c9', deep: '#38224e', rgb: '154,112,201' },
  green: { main: '#245d48', bright: '#82d2aa', line: '#54a982', deep: '#173c2e', rgb: '84,169,130' },
  orange: { main: '#74411e', bright: '#e5ad71', line: '#d58a45', deep: '#4e2b16', rgb: '213,138,69' },
  pink: { main: '#762e51', bright: '#ed91bb', line: '#d9699b', deep: '#4e1e36', rgb: '217,105,155' }
};
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
  return { week: weekStamp(), weeklyOpens: 0, weeklyUnique: [], weeklyFavorites: 0, allUnique: [], spins: 0, multiplayerUnique: [] };
}

try {
  playerProgress = JSON.parse(localStorage.getItem(progressStorageKey) || 'null') || emptyProgress();
} catch {
  playerProgress = emptyProgress();
}
if (playerProgress.week !== weekStamp()) playerProgress = { ...emptyProgress(), allUnique: playerProgress.allUnique || [], spins: playerProgress.spins || 0, multiplayerUnique: playerProgress.multiplayerUnique || [] };
playerProgress.weeklyUnique = Array.isArray(playerProgress.weeklyUnique) ? playerProgress.weeklyUnique : [];
playerProgress.allUnique = Array.isArray(playerProgress.allUnique) ? playerProgress.allUnique : [];
playerProgress.multiplayerUnique = Array.isArray(playerProgress.multiplayerUnique) ? playerProgress.multiplayerUnique : [];

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
  const unlocked = [
    playerProgress.allUnique.length >= 1,
    playerProgress.allUnique.length >= 10,
    favorites.size >= 5,
    (Number(playerProgress.spins) || 0) >= 5,
    playerProgress.multiplayerUnique.length >= 3
  ];
  const achievements = [
    ['FIRST DROP', 'Open your first game'],
    ['NIGHT EXPLORER', 'Play 10 different games'],
    ['CURATOR', 'Save 5 games as favorites'],
    ['LUCKY SPIN', 'Spin the surprise reel 5 times'],
    ['SQUAD UP', 'Try 3 multiplayer games']
  ];
  document.querySelector('#achievement-count').textContent = `${unlocked.filter(Boolean).length} / ${unlocked.length} UNLOCKED`;
  achievementsGrid.replaceChildren(...achievements.map(([name, description], index) => {
    const item = document.createElement('article');
    item.className = `achievement-card${unlocked[index] ? ' unlocked' : ''}`;
    const icon = document.createElement('span');
    icon.className = 'achievement-icon';
    icon.textContent = unlocked[index] ? '✦' : '◇';
    const titleNode = document.createElement('b');
    titleNode.textContent = name;
    const detail = document.createElement('span');
    detail.textContent = description;
    const state = document.createElement('small');
    state.textContent = unlocked[index] ? 'UNLOCKED' : 'LOCKED';
    item.append(icon, titleNode, detail, state);
    return item;
  }));
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
    link.addEventListener('click', () => saveRecent(game));
    return link;
  }));
}

function recordGameOpen(game) {
  playerProgress.weeklyOpens = (Number(playerProgress.weeklyOpens) || 0) + 1;
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
roulettePlay.addEventListener('click', () => {
  if (rouletteWinner) saveRecent(rouletteWinner);
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
  if (playerProgress.week !== weekStamp()) playerProgress = { ...emptyProgress(), allUnique: playerProgress.allUnique || [], spins: playerProgress.spins || 0, multiplayerUnique: playerProgress.multiplayerUnique || [] };
  playerProgress.weeklyUnique = Array.isArray(playerProgress.weeklyUnique) ? playerProgress.weeklyUnique : [];
  playerProgress.allUnique = Array.isArray(playerProgress.allUnique) ? playerProgress.allUnique : [];
  playerProgress.multiplayerUnique = Array.isArray(playerProgress.multiplayerUnique) ? playerProgress.multiplayerUnique : [];
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

function applyAccent(name, save = true) {
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
document.querySelector('#settings-button').addEventListener('click', () => settingsDialog.showModal());
document.querySelector('#close-settings').addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => { if (event.target === settingsDialog) settingsDialog.close(); });
document.querySelectorAll('[data-accent-choice]').forEach(button => button.addEventListener('click', () => applyAccent(button.dataset.accentChoice)));

/* =============================================
   ЯНДЕКС МУЗЫКА — script.js
   ============================================= */

// ───────── ТРЕКИ ─────────
const tracks = [
  {
    title:  'Привет, если ты мне не ответишь',
    artist: 'CUPSIZE',
    src:    'music/2_5393295419767805844.flac',
    cover:  'img/cupsize_pink.jpg',
    lyrics: [
      { time: 0,  text: 'У меня есть план на этот вечер' },
      { time: 10, text: 'Но ты видимо не хочешь отвечать' },
      { time: 20, text: 'Я поубиваю всех твоих тупых соседей' },
      { time: 32, text: 'Поэтому тебе лучше ответить!' },
      { time: 44, text: 'Ты куришь, кажется, это мой фетиш' },
      { time: 56, text: 'Но я никогда бы не сказал тебе «нет» веришь' },
      { time: 68, text: 'У меня есть план на этот вечер' },
      { time: 80, text: 'Но ты видимо не хочешь отвечать' },
      { time: 92, text: 'Не хочешь отвечать' },
    ]
  }
];

// ───────── СОСТОЯНИЕ ─────────
const state = {
  trackIndex:  0,
  isPlaying:   false,
  isLiked:     false,
  isMuted:     false,
  isRepeat:    false,
  lyricsOpen:  false,
};

// ───────── ЭЛЕМЕНТЫ ─────────
const audio         = document.getElementById('audioPlayer');
const mainPage      = document.getElementById('mainPage');
const playerPage    = document.getElementById('playerPage');

const bigPlayBtn    = document.getElementById('bigPlayBtn');
const bigPlayIcon   = document.getElementById('bigPlayIcon');
const miniPlayBtn   = document.getElementById('miniPlayBtn');
const miniPlayIcon  = document.getElementById('miniPlayIcon');

const progBar       = document.getElementById('progBar');
const progFill      = document.getElementById('progFill');
const progTime      = document.getElementById('progTime');
const progDuration  = document.getElementById('progDuration');

const heartBtn      = document.getElementById('heartBtn');
const miniLikeBtn   = document.getElementById('miniLikeBtn');
const volBtn        = document.getElementById('volBtn');
const repeatBtn     = document.getElementById('repeatBtn');
const lyricsBtn     = document.getElementById('lyricsBtn');

const playerCover   = document.getElementById('playerCover');
const coverImg      = document.getElementById('coverImg');
const lyricsOverlay = document.getElementById('lyricsOverlay');
const miniPlayer    = document.getElementById('miniPlayer');

// ───────── ИКОНКИ ─────────
const ICON = {
  play:  '<path d="M8 5v14l11-7z"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  volOn: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  volOf: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
};

// ───────── ЗАГРУЗКА ТРЕКА ─────────
function loadTrack(index) {
  const t = tracks[index];
  audio.src = t.src;

  // обложка
  coverImg.src = t.cover;
  document.querySelectorAll('.mini-thumb, .big-card-img img').forEach(el => {
    if (el.tagName === 'IMG') el.src = t.cover;
  });

  // название
  document.querySelectorAll('.mini-title, .player-track-title').forEach(el => el.textContent = t.title);
  document.querySelectorAll('.mini-artist, .player-track-artist').forEach(el => el.textContent = t.artist);

  // лирика
  buildLyrics(t.lyrics);

  // сброс прогресса
  progFill.style.width = '0%';
  progTime.textContent = '0:00';
  progDuration.textContent = '0:00';
  miniPlayer.style.setProperty('--mini-progress', '0%');
}

// ───────── ПЛЕЙ / ПАУЗА ─────────
function togglePlay() {
  if (state.isPlaying) {
    audio.pause();
  } else {
    audio.play().catch(() => {});
  }
}

audio.addEventListener('play', () => {
  state.isPlaying = true;
  bigPlayIcon.innerHTML  = ICON.pause;
  miniPlayIcon.innerHTML = ICON.pause;
  document.querySelector('.eq')?.classList.remove('paused');
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  bigPlayIcon.innerHTML  = ICON.play;
  miniPlayIcon.innerHTML = ICON.play;
  document.querySelector('.eq')?.classList.add('paused');
});

audio.addEventListener('ended', () => {
  if (state.isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextTrack();
  }
});

// ───────── ПРОГРЕСС ─────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progFill.style.width = pct + '%';
  miniPlayer.style.setProperty('--mini-progress', pct + '%');
  progTime.textContent = formatTime(audio.currentTime);
  updateActiveLyric(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  progDuration.textContent = formatTime(audio.duration);
});

// Клик по прогресс-бару
progBar.addEventListener('click', e => {
  const rect = progBar.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.currentTime = pct * audio.duration;
});

// Drag по прогресс-бару
let dragging = false;

progBar.addEventListener('mousedown',  startDrag);
progBar.addEventListener('touchstart', startDrag, { passive: true });

function startDrag(e) {
  dragging = true;
  seekTo(e);
}

document.addEventListener('mousemove',  e => { if (dragging) seekTo(e); });
document.addEventListener('touchmove',  e => { if (dragging) seekTo(e.touches[0]); }, { passive: true });
document.addEventListener('mouseup',    () => { dragging = false; });
document.addEventListener('touchend',   () => { dragging = false; });

function seekTo(e) {
  const rect = progBar.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (audio.duration) audio.currentTime = pct * audio.duration;
}

// ───────── ТРЕКИ ─────────
function prevTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  state.trackIndex = (state.trackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(state.trackIndex);
  if (state.isPlaying) audio.play().catch(() => {});
}

function nextTrack() {
  state.trackIndex = (state.trackIndex + 1) % tracks.length;
  loadTrack(state.trackIndex);
  if (state.isPlaying) audio.play().catch(() => {});
}

// ───────── ЛАЙК ─────────
function toggleLike() {
  state.isLiked = !state.isLiked;
  [heartBtn, miniLikeBtn].forEach(btn => {
    btn.classList.toggle('liked', state.isLiked);
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill',   state.isLiked ? '#ff4060' : 'none');
    svg.setAttribute('stroke', state.isLiked ? '#ff4060' : 'currentColor');
  });
}

// ───────── ЗВУК ─────────
function toggleMute() {
  state.isMuted  = !state.isMuted;
  audio.muted    = state.isMuted;
  volBtn.classList.toggle('active', state.isMuted);
  volBtn.querySelector('svg').innerHTML = state.isMuted ? ICON.volOf : ICON.volOn;
}

// ───────── ПОВТОР ─────────
function toggleRepeat() {
  state.isRepeat = !state.isRepeat;
  repeatBtn.classList.toggle('active', state.isRepeat);
}

// ───────── ТЕКСТ ПЕСНИ ─────────
function toggleLyrics() {
  state.lyricsOpen = !state.lyricsOpen;
  lyricsOverlay.classList.toggle('show', state.lyricsOpen);
  playerCover.classList.toggle('lyrics-open', state.lyricsOpen);
  lyricsBtn.classList.toggle('active', state.lyricsOpen);
}

function buildLyrics(lines) {
  lyricsOverlay.innerHTML = '';
  lines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className  = 'lyric-line ' + (i === 0 ? 'active' : 'upcoming');
    div.textContent = line.text;
    div.dataset.time = line.time;
    lyricsOverlay.appendChild(div);
  });
}

function updateActiveLyric(currentTime) {
  const lines = lyricsOverlay.querySelectorAll('.lyric-line');
  if (!lines.length) return;

  let activeIndex = 0;
  lines.forEach((line, i) => {
    if (currentTime >= parseFloat(line.dataset.time)) activeIndex = i;
  });

  lines.forEach((line, i) => {
    line.className = 'lyric-line ' + (
      i < activeIndex  ? 'past'     :
      i === activeIndex ? 'active'  :
                          'upcoming'
    );
  });

  // Авто-скролл активной строки в центр
  const activeLine = lines[activeIndex];
  if (activeLine && state.lyricsOpen) {
    activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ───────── ОТКРЫТЬ / ЗАКРЫТЬ ПЛЕЕР ─────────
function openPlayer() {
  playerPage.classList.add('open');
  mainPage.classList.add('slide-down');
}

function closePlayer() {
  playerPage.classList.remove('open');
  mainPage.classList.remove('slide-down');
}

// Свайп вниз чтобы закрыть плеер
let touchStartY = 0;

playerPage.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

playerPage.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientY - touchStartY;
  if (diff > 80) closePlayer();
}, { passive: true });

// ───────── ФОРМАТИРОВАНИЕ ВРЕМЕНИ ─────────
function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ───────── КЛАВИАТУРА ─────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  if (e.code === 'ArrowLeft')  audio.currentTime = Math.max(0, audio.currentTime - 5);
  if (e.code === 'Escape') closePlayer();
  if (e.code === 'KeyM') toggleMute();
});

// ───────── ИНИЦИАЛИЗАЦИЯ ─────────
loadTrack(state.trackIndex);
document.querySelector('.eq')?.classList.add('paused');

/* =============================================
   script.js
   ============================================= */

const tracks = [
  {
    title:  'Привет, если ты мне не ответишь',
    artist: 'CUPSIZE',
    src:    'music/2_5393295419767805844.flac',
    cover:  'img/cupsize_pink.jpg',
    lyrics: [
      { time: 0,   text: '' },
      { time: 21,  text: 'Привет, если ты мне не ответишь' },
      { time: 23,  text: 'Я поубиваю всех твоих тупых соседей' },
      { time: 25,  text: 'Обоссу весь твой подъезд и буду долго сожалеть об этом' },
      { time: 28,  text: 'Поэтому тебе лучше ответить!' },
      { time: 30,  text: 'Ты куришь, кажется, это мой фетиш' },
      { time: 32,  text: 'Но я никогда бы не сказал тебе «нет», веришь' },
      { time: 34,  text: 'У меня есть план на этот вечер, но ты видимо не хочешь отвечать' },
      { time: 39,  text: 'Не хочешь отвечать' },
      { time: 44,  text: '' },
      { time: 58,  text: 'Я приду к тебе еще раз в этот понедельник' },
      { time: 60,  text: 'Я надеюсь, ты откроешь дверь хотя бы в этот раз' },
      { time: 64,  text: 'Хотя бы в этот раз' },
      { time: 67,  text: 'Кажется, мой ключ откроет для меня все двери' },
      { time: 69,  text: 'Только если ты не поменяла замок в пятый раз' },
      { time: 73,  text: 'Желательно сейчас' },
      { time: 76,  text: 'Желательно сейчас' },
      { time: 80,  text: '' },
    ]
  }
];

const state = {
  trackIndex: 0,
  isPlaying:  false,
  isLiked:    false,
  isMuted:    false,
  isRepeat:   false,
  lyricsOpen: false,
};

// элементы
const audio         = document.getElementById('audioPlayer');
const mainPage      = document.getElementById('mainPage');
const playerPage    = document.getElementById('playerPage');
const bigPlayBtn    = document.getElementById('bigPlayBtn');
const bigPlayIcon   = document.getElementById('bigPlayIcon');
const miniPlayIcon  = document.getElementById('miniPlayIcon');
const heroIcon      = document.getElementById('heroIcon');
const progBar       = document.getElementById('progBar');
const progFill      = document.getElementById('progFill');
const progTime      = document.getElementById('progTime');
const progDuration  = document.getElementById('progDuration');
const heartBtn      = document.getElementById('heartBtn');
const miniLikeBtn   = document.getElementById('miniLikeBtn');
const volBtn        = document.getElementById('volBtn');
const volIcon       = document.getElementById('volIcon');
const repeatBtn     = document.getElementById('repeatBtn');
const lyricsBtn     = document.getElementById('lyricsBtn');
const coverImg      = document.getElementById('coverImg');
const subtitleView  = document.getElementById('subtitleView');
const subtitleLine  = document.getElementById('subtitleLine');
const miniPlayer    = document.getElementById('miniPlayer');

const ICON = {
  play:   '<path d="M8 5v14l11-7z"/>',
  pause:  '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  volOn:  '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  volOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
};

// ── загрузка трека ──
function loadTrack(idx) {
  const t = tracks[idx];
  audio.src = t.src;
  coverImg.src = t.cover;
  document.querySelectorAll('.mini-thumb').forEach(el => el.src = t.cover);
  document.querySelectorAll('.mini-title, .player-track-title').forEach(el => el.textContent = t.title);
  document.querySelectorAll('.mini-artist, .player-track-artist').forEach(el => el.textContent = t.artist);
  progFill.style.width = '0%';
  progTime.textContent = '0:00';
  progDuration.textContent = '0:00';
  miniPlayer.style.setProperty('--mini-prog', '0%');
  subtitleLine.textContent = '';
}

// ── плей/пауза ──
function togglePlay() {
  state.isPlaying ? audio.pause() : audio.play().catch(() => {});
}

audio.addEventListener('play', () => {
  state.isPlaying = true;
  bigPlayIcon.innerHTML  = ICON.pause;
  miniPlayIcon.innerHTML = ICON.pause;
  bigPlayBtn.classList.add('playing');
  heroIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  bigPlayIcon.innerHTML  = ICON.play;
  miniPlayIcon.innerHTML = ICON.play;
  bigPlayBtn.classList.remove('playing');
  heroIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
});

audio.addEventListener('ended', () => {
  if (state.isRepeat) { audio.currentTime = 0; audio.play().catch(() => {}); }
  else nextTrack();
});

// ── прогресс ──
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progFill.style.width = pct + '%';
  miniPlayer.style.setProperty('--mini-prog', pct + '%');
  progTime.textContent = fmt(audio.currentTime);
  if (state.lyricsOpen) updateSubtitle(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  progDuration.textContent = fmt(audio.duration);
});

progBar.addEventListener('click', e => {
  const r = progBar.getBoundingClientRect();
  if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
});

let dragging = false;
progBar.addEventListener('mousedown',  e => { dragging = true; seekDrag(e); });
progBar.addEventListener('touchstart', e => { dragging = true; seekDrag(e.touches[0]); }, { passive: true });
document.addEventListener('mousemove',  e => { if (dragging) seekDrag(e); });
document.addEventListener('touchmove',  e => { if (dragging) seekDrag(e.touches[0]); }, { passive: true });
document.addEventListener('mouseup',    () => { dragging = false; });
document.addEventListener('touchend',   () => { dragging = false; });
function seekDrag(e) {
  const r = progBar.getBoundingClientRect();
  if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
}

// ── треки ──
function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  state.trackIndex = (state.trackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(state.trackIndex);
  if (state.isPlaying) audio.play().catch(() => {});
}
function nextTrack() {
  state.trackIndex = (state.trackIndex + 1) % tracks.length;
  loadTrack(state.trackIndex);
  if (state.isPlaying) audio.play().catch(() => {});
}

// ── лайк ──
function toggleLike() {
  state.isLiked = !state.isLiked;
  [heartBtn, miniLikeBtn].forEach(btn => {
    btn.classList.toggle('liked', state.isLiked);
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill',   state.isLiked ? '#ff4060' : 'none');
    svg.setAttribute('stroke', state.isLiked ? '#ff4060' : 'currentColor');
  });
}

// ── мут ──
function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.muted = state.isMuted;
  volBtn.classList.toggle('active', state.isMuted);
  volIcon.innerHTML = state.isMuted ? ICON.volOff : ICON.volOn;
}

// ── повтор ──
function toggleRepeat() {
  state.isRepeat = !state.isRepeat;
  repeatBtn.classList.toggle('active', state.isRepeat);
}

// ── плеер открыть/закрыть ──
function openPlayer() {
  playerPage.classList.add('open');
  mainPage.classList.add('slide-down');
}
function closePlayer() {
  playerPage.classList.remove('open');
  mainPage.classList.remove('slide-down');
}

// свайп вниз
let swipeY = 0;
playerPage.addEventListener('touchstart', e => { swipeY = e.touches[0].clientY; }, { passive: true });
playerPage.addEventListener('touchend',   e => { if (e.changedTouches[0].clientY - swipeY > 80) closePlayer(); }, { passive: true });

// ── субтитры ──
let lastLyricIdx = -1;

function updateSubtitle(currentTime) {
  const lines = tracks[state.trackIndex].lyrics;
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) idx = i;
  }
  if (idx === lastLyricIdx) return;
  lastLyricIdx = idx;

  const text = lines[idx].text;

  // анимация смены строки
  subtitleLine.classList.add('changing');
  setTimeout(() => {
    subtitleLine.textContent = text;
    subtitleLine.classList.remove('changing');
  }, 200);
}

function toggleLyrics() {
  state.lyricsOpen = !state.lyricsOpen;

  if (state.lyricsOpen) {
    subtitleView.classList.add('show');
    coverImg.classList.add('blurred');
    lyricsBtn.classList.add('active');
    lastLyricIdx = -1;
    if (audio.currentTime) updateSubtitle(audio.currentTime);
  } else {
    subtitleView.classList.remove('show');
    coverImg.classList.remove('blurred');
    lyricsBtn.classList.remove('active');
  }
}

// ── клавиатура ──
document.addEventListener('keydown', e => {
  if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
  if (e.code === 'ArrowLeft')  audio.currentTime = Math.max(0, audio.currentTime - 5);
  if (e.code === 'Escape')     closePlayer();
  if (e.code === 'KeyM')       toggleMute();
  if (e.code === 'KeyL')       toggleLyrics();
});

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
}

loadTrack(state.trackIndex);

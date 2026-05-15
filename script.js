/* =============================================
   script.js — Музыкальный плеер
   ============================================= */

// ───────── ТРЕКИ ─────────
const tracks = [
  {
    title:  'Привет, если ты мне не ответишь',
    artist: 'CUPSIZE',
    src:    'music/2_5393295419767805844.flac',
    cover:  'img/cupsize_pink.jpg',
    lyrics: [
      { time: 0,    text: '...' },
      { time: 18,   text: '...' },
      { time: 21,   text: 'Привет, если ты мне не ответишь' },
      { time: 23,   text: 'Я поубиваю всех твоих тупых соседей' },
      { time: 25,   text: 'Обоссу весь твой подъезд и буду долго сожалеть' },
      { time: 28,   text: 'Поэтому тебе лучше ответить!' },
      { time: 30,   text: 'Ты куришь, кажется, это мой фетиш' },
      { time: 32,   text: 'Но я никогда бы не сказал тебе «нет», веришь' },
      { time: 34,   text: 'У меня есть план на этот вечер, но ты видимо не хочешь отвечать' },
      { time: 39,   text: 'Не хочешь отвечать' },
      { time: 58,   text: 'Я приду к тебе еще раз в этот понедельник' },
      { time: 60,   text: 'Я надеюсь, ты откроешь дверь хотя бы в этот раз' },
      { time: 64,   text: 'Хотя бы в этот раз' },
      { time: 67,   text: 'Кажется, мой ключ откроет для меня все двери' },
      { time: 69,   text: 'Только если ты не поменяла замок в пятый раз' },
      { time: 73,   text: 'Желательно сейчас' },
      { time: 76,   text: 'Желательно сейчас' },
      { time: 79,   text: '...' },
    ]
  }
];

// ───────── СОСТОЯНИЕ ─────────
const state = {
  trackIndex: 0,
  isPlaying:  false,
  isLiked:    false,
  isMuted:    false,
  isRepeat:   false,
  lyricsOpen: false,
};

// ───────── ЭЛЕМЕНТЫ ─────────
const audio        = document.getElementById('audioPlayer');
const mainPage     = document.getElementById('mainPage');
const playerPage   = document.getElementById('playerPage');
const bigPlayIcon  = document.getElementById('bigPlayIcon');
const miniPlayIcon = document.getElementById('miniPlayIcon');
const heroIcon     = document.getElementById('heroIcon');
const progBar      = document.getElementById('progBar');
const progFill     = document.getElementById('progFill');
const progTime     = document.getElementById('progTime');
const progDuration = document.getElementById('progDuration');
const heartBtn     = document.getElementById('heartBtn');
const miniLikeBtn  = document.getElementById('miniLikeBtn');
const volBtn       = document.getElementById('volBtn');
const volIcon      = document.getElementById('volIcon');
const repeatBtn    = document.getElementById('repeatBtn');
const lyricsBtn    = document.getElementById('lyricsBtn');
const coverImg     = document.getElementById('coverImg');
const lyricsView   = document.getElementById('lyricsView');
const lyricsScroll = document.getElementById('lyricsScroll');
const miniPlayer   = document.getElementById('miniPlayer');

// ───────── SVG ИКОНКИ ─────────
const ICON = {
  play:  '<path d="M8 5v14l11-7z"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  volOn: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  volOff:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
};

// ───────── ЗАГРУЗКА ТРЕКА ─────────
function loadTrack(index) {
  const t = tracks[index];
  audio.src = t.src;
  coverImg.src = t.cover;
  document.querySelectorAll('.mini-thumb').forEach(el => el.src = t.cover);
  document.querySelectorAll('.mini-title, .player-track-title').forEach(el => el.textContent = t.title);
  document.querySelectorAll('.mini-artist, .player-track-artist').forEach(el => el.textContent = t.artist);
  progFill.style.width = '0%';
  progTime.textContent = '0:00';
  progDuration.textContent = '0:00';
  miniPlayer.style.setProperty('--mini-prog', '0%');
  buildLyrics(t.lyrics);
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
  heroIcon.innerHTML     = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  bigPlayIcon.innerHTML  = ICON.play;
  miniPlayIcon.innerHTML = ICON.play;
  heroIcon.innerHTML     = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
});

audio.addEventListener('ended', () => {
  if (state.isRepeat) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    nextTrack();
  }
});

// ───────── ПРОГРЕСС ─────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progFill.style.width = pct + '%';
  miniPlayer.style.setProperty('--mini-prog', pct + '%');
  progTime.textContent = fmt(audio.currentTime);
  updateLyric(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  progDuration.textContent = fmt(audio.duration);
});

// клик по прогрессу
progBar.addEventListener('click', e => {
  const r = progBar.getBoundingClientRect();
  audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
});

// drag прогресса
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

// ───────── СЛЕД / ПРЕД ─────────
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

// ───────── МУТ ─────────
function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.muted = state.isMuted;
  volBtn.classList.toggle('active', state.isMuted);
  volIcon.innerHTML = state.isMuted ? ICON.volOff : ICON.volOn;
}

// ───────── ПОВТОР ─────────
function toggleRepeat() {
  state.isRepeat = !state.isRepeat;
  repeatBtn.classList.toggle('active', state.isRepeat);
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

// свайп вниз закрывает плеер
let swipeStartY = 0;
playerPage.addEventListener('touchstart', e => { swipeStartY = e.touches[0].clientY; }, { passive: true });
playerPage.addEventListener('touchend',   e => {
  if (e.changedTouches[0].clientY - swipeStartY > 80) closePlayer();
}, { passive: true });

// ───────── ТЕКСТ ПЕСНИ ─────────
function buildLyrics(lines) {
  lyricsScroll.innerHTML = '';
  lines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'lyric-line ' + (i === 0 ? 'active' : 'upcoming');
    div.textContent = line.text;
    div.dataset.time = line.time;
    lyricsScroll.appendChild(div);
  });
}

let lastActiveIndex = -1;

function updateLyric(currentTime) {
  const lines = lyricsScroll.querySelectorAll('.lyric-line');
  if (!lines.length) return;

  let activeIndex = 0;
  lines.forEach((line, i) => {
    if (currentTime >= parseFloat(line.dataset.time)) activeIndex = i;
  });

  if (activeIndex === lastActiveIndex) return;
  lastActiveIndex = activeIndex;

  lines.forEach((line, i) => {
    line.className = 'lyric-line ' + (
      i < activeIndex  ? 'past'     :
      i === activeIndex ? 'active'  :
                          'upcoming'
    );
  });

  // плавный скролл активной строки в центр
  if (state.lyricsOpen) {
    const activeLine = lines[activeIndex];
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function toggleLyrics() {
  state.lyricsOpen = !state.lyricsOpen;

  if (state.lyricsOpen) {
    lyricsView.classList.remove('hidden');
    // небольшая задержка чтобы display:block успело примениться перед opacity
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lyricsView.classList.add('show');
        coverImg.classList.add('blurred');
      });
    });
    lyricsBtn.classList.add('active');
    // скроллим к активной строке
    const lines = lyricsScroll.querySelectorAll('.lyric-line');
    const active = lyricsScroll.querySelector('.lyric-line.active');
    if (active) setTimeout(() => active.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
  } else {
    lyricsView.classList.remove('show');
    coverImg.classList.remove('blurred');
    lyricsBtn.classList.remove('active');
    setTimeout(() => lyricsView.classList.add('hidden'), 350);
  }
}

// ───────── КЛАВИАТУРА ─────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
  if (e.code === 'ArrowLeft')  audio.currentTime = Math.max(0, audio.currentTime - 5);
  if (e.code === 'Escape')     closePlayer();
  if (e.code === 'KeyM')       toggleMute();
  if (e.code === 'KeyL')       toggleLyrics();
});

// ───────── ФОРМАТИРОВАНИЕ ВРЕМЕНИ ─────────
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ───────── INIT ─────────
loadTrack(state.trackIndex);

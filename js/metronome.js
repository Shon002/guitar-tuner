/* Колок — метроном и драм-машина: щелчок или прямой ритм (бочка, малый, хай-хэт), размер 3/4 и 4/4.
   Первая доля нарочно ничем не выделяется: все щелчки — один и тот же буфер с одной громкостью,
   все точки-доли выглядят одинаково. Звуки синтезируются один раз в буферы, планировщик ставит их
   «на опережение» по часам AudioContext. Пока метроном стоит — ни циклов, ни таймеров. */
(function () {
  'use strict';

  const KEY = 'kolok.metro.v1';
  const MIN = 30, MAX = 240;
  const AHEAD = 0.1;   // с — на сколько вперёд планируем удары
  const TICK = 25;     // мс — как часто просыпается планировщик (только пока играет)
  const LATE = 0.05;   // с — шаг опоздал сильнее (вкладка спала) — пропускаем его молча, а не играем пачкой

  // ---------- настройки (запоминаются в браузере) ----------
  const S = { bpm: 90, beats: 4, sound: 'click' };
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v === 'object') {
      if (Number.isFinite(v.bpm)) S.bpm = clampBpm(v.bpm);
      if (v.beats === 3 || v.beats === 4) S.beats = v.beats;
      if (v.sound === 'click' || v.sound === 'drums') S.sound = v.sound;
    }
  } catch (e) { /* нет доступа к хранилищу — работаем с настройками по умолчанию */ }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* не страшно */ }
  }
  function clampBpm(v) { return Math.min(MAX, Math.max(MIN, Math.round(v))); }

  // ---------- звуки: считаются один раз, дальше играют готовые буферы ----------
  // белый шум с зерном — у каждого инструмента свой, но каждый удар звучит одинаково
  function noise(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 2147483648 - 1;
    };
  }
  // фильтр второго порядка (формулы RBJ): 'hp' — срез низов, 'bp' — полоса с пиком 0 дБ
  function filter(x, sr, type, f0, q) {
    const w = 2 * Math.PI * f0 / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    const hp = type === 'hp';
    const b0 = (hp ? (1 + cs) / 2 : al) / a0, b1 = (hp ? -(1 + cs) : 0) / a0, b2 = (hp ? (1 + cs) / 2 : -al) / a0;
    const a1 = -2 * cs / a0, a2 = (1 - al) / a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
    }
    return x;
  }
  // пик — к заданному уровню, конец — плавно в ноль (иначе обрыв буфера щёлкает)
  function finish(x, sr, peak) {
    let m = 0;
    for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
    const k = peak / m, tail = Math.round(0.008 * sr);
    for (let i = 0; i < x.length; i++) x[i] *= k * Math.min(1, (x.length - 1 - i) / tail);
    return x;
  }

  function synth(sr) {
    const TAU = 2 * Math.PI;
    const buf = sec => new Float32Array(Math.round(sec * sr));
    const burst = (sec, seed, tau) => { const r = noise(seed), x = buf(sec); for (let i = 0; i < x.length; i++) x[i] = r() * Math.exp(-i / sr / tau); return x; };

    // щелчок — деревянный стук: две моды деревянного бруска (1 : 2,76) с лёгким «подъездом» высоты и шорох удара
    const click = buf(0.07), knock = filter(burst(0.07, 7, 0.0012), sr, 'bp', 3200, 0.9);
    for (let i = 0, ph = 0; i < click.length; i++) {
      const t = i / sr;
      ph += TAU * 880 * (1 + 0.06 * Math.exp(-t / 0.004)) / sr;
      click[i] = Math.sin(ph) * Math.exp(-t / 0.02) + 0.35 * Math.sin(2.76 * ph) * Math.exp(-t / 0.007) + 0.8 * knock[i];
    }

    // бочка — синус с падением высоты 150 → 50 Гц и быстрым затуханием; чуть «перегружен», чтобы
    // гармоники были слышны и в маленьком динамике телефона, плюс короткий щелчок колотушки
    const kick = buf(0.42), beater = filter(burst(0.42, 11, 0.002), sr, 'bp', 2500, 1);
    for (let i = 0, ph = 0; i < kick.length; i++) {
      const t = i / sr;
      ph += TAU * (50 + 100 * Math.exp(-t / 0.035)) / sr;
      kick[i] = Math.tanh(3.5 * Math.sin(ph)) * Math.exp(-t / 0.14) + beater[i];
    }

    // малый — шумовой всплеск через полосовой фильтр и немного тона (185 и 330 Гц)
    const snare = buf(0.24), wires = filter(burst(0.24, 23, 0.06), sr, 'bp', 1900, 0.6);
    for (let i = 0; i < snare.length; i++) {
      const t = i / sr;
      snare[i] = 2.2 * wires[i] + 0.3 * (Math.sin(TAU * 185 * t) + 0.5 * Math.sin(TAU * 330 * t)) * Math.exp(-t / 0.035);
    }

    // хай-хэт — короткий шум через крутой ФВЧ (дважды по 7 кГц)
    const hat = filter(filter(burst(0.07, 31, 0.018), sr, 'hp', 7000, 0.7), sr, 'hp', 7000, 0.7);

    // уровни подобраны так, чтобы бочка + хай-хэт в одной точке не перегружали выход
    return {
      click: finish(click, sr, 0.72),
      kick: finish(kick, sr, 0.62),
      snare: finish(snare, sr, 0.5),
      hat: finish(hat, sr, 0.2)
    };
  }

  const cache = {};
  function buffers(c) {
    const sr = c.sampleRate;
    if (!cache[sr]) {
      const raw = synth(sr);
      cache[sr] = {};
      for (const k in raw) {
        const b = c.createBuffer(1, raw[k].length, sr);
        b.getChannelData(0).set(raw[k]);
        cache[sr][k] = b;
      }
    }
    return cache[sr];
  }

  // ---------- рисунок ----------
  // шаг — восьмая: pos = 0 … 2·beats−1, чётные шаги — доли. Это рисунок, а не акцент:
  // одинаковые инструменты всегда звучат одинаково громко
  function hitsAt(sound, beats, pos) {
    if (sound === 'click') return pos % 2 ? [] : ['click'];
    if (pos % 2) return ['hat'];
    const b = pos / 2;   // 4/4: бочка на 1 и 3, малый на 2 и 4; 3/4: бочка на 1, малый на 2 и 3
    return [(beats === 4 ? b % 2 : b) ? 'snare' : 'kick', 'hat'];
  }
  function play(c, bufs, name, t) {
    const s = c.createBufferSource();
    s.buffer = bufs[name];
    s.connect(c.destination);
    s.start(t);
    return s;
  }

  // ---------- состояние ----------
  let ctx = null, BUF = null, playing = false, timer = 0, session = 0;
  let prevT = 0, pos = 0;      // время последнего запланированного шага и номер следующего шага в такте
  let queue = [];              // [источник, начало, конец] — ещё не отзвучавшие удары
  const flashes = new Set();   // таймеры подсветки точек (только пока играет)
  const events = [];           // для автотестов: [время, звук, доля]
  let wake = null, prevAudioType = null;
  let ui = null, dots = [], lit = -1, holdT = 0;

  // ---------- планировщик ----------
  function tick() {
    const now = ctx.currentTime;
    for (;;) {
      const t = prevT + 30 / S.bpm;   // темп читается на каждом шаге — смена темпа слышна со следующей доли
      if (t > now + AHEAD) break;
      const p = pos;
      prevT = t;
      pos = (pos + 1) % (2 * S.beats);
      if (t < now - LATE) continue;
      for (const name of hitsAt(S.sound, S.beats, p)) {
        queue.push([play(ctx, BUF, name, t), t, t + BUF[name].duration]);
        events.push([t, name, p / 2 + 1]);
      }
      if (p % 2 === 0) flashAt(p / 2, t);
    }
    if (events.length > 200) events.splice(0, events.length - 200);
    if (queue.length > 32) queue = queue.filter(q => q[2] > now);
  }

  // точка загорается, когда удар реально прозвучит (с учётом задержки вывода звука)
  function flashAt(b, t) {
    const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
    const ms = ts && ts.performanceTime
      ? ts.performanceTime + (t - ts.contextTime) * 1000 - performance.now()
      : (t - ctx.currentTime + (ctx.baseLatency || 0)) * 1000;
    const id = setTimeout(() => { flashes.delete(id); light(b); }, Math.max(0, ms));
    flashes.add(id);
  }
  function light(b) {
    if (dots[lit]) dots[lit].classList.remove('on');
    lit = b;
    if (dots[b]) dots[b].classList.add('on');
  }

  function start() {
    if (playing) return;
    // без этого бесшумный режим айфона глушит звук страницы
    try {
      if (navigator.audioSession) { prevAudioType = navigator.audioSession.type; navigator.audioSession.type = 'playback'; }
    } catch (e) { /* не поддерживается */ }
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      BUF = buffers(ctx);
    }
    // строго в обработчике нажатия — иначе iOS не даст звук; если успели нажать «Стоп» раньше, чем звук
    // проснулся, — сразу усыпляем обратно, чтобы не работал вхолостую
    ctx.resume().then(() => { if (!playing) ctx.suspend().catch(() => {}); }, () => {});
    const unlock = ctx.createBufferSource();   // пустой буфер в момент нажатия — «ключ» для старых iOS
    unlock.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    unlock.connect(ctx.destination);
    unlock.start(0);

    playing = true;
    session++;
    pos = 0;
    prevT = ctx.currentTime + 0.06 - 30 / S.bpm;   // первый удар — через 60 мс
    tick();
    timer = setInterval(tick, TICK);
    keepAwake();
    showPlay();
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    timer = 0;
    for (const id of flashes) clearTimeout(id);
    flashes.clear();
    // ещё не прозвучавшие удары отменяем, звучащий — дозвучит сам; потом усыпляем звук целиком
    const now = ctx.currentTime;
    let tail = null;
    for (const q of queue) {
      if (q[1] > now) { try { q[0].stop(); } catch (e) { /* уже остановлен */ } }
      else if (q[2] > now && (!tail || q[2] > tail[2])) tail = q;
    }
    queue = [];
    const gen = session;
    const sleep = () => { if (!playing && gen === session && ctx.state === 'running') ctx.suspend().catch(() => {}); };
    if (tail) tail[0].onended = sleep; else sleep();
    light(-1);
    if (wake) { wake.release().catch(() => {}); wake = null; }
    try { if (navigator.audioSession && prevAudioType) navigator.audioSession.type = prevAudioType; } catch (e) { /* не страшно */ }
    showPlay();
  }

  const toggle = () => (playing ? stop() : start());

  // экран не гаснет, пока играет
  async function keepAwake() {
    try {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      const w = await navigator.wakeLock.request('screen');
      if (playing) wake = w; else w.release().catch(() => {});
    } catch (e) { /* не поддерживается — не страшно */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (playing && document.visibilityState === 'visible') { keepAwake(); ctx.resume().catch(() => {}); }
  });

  // ---------- управление ----------
  function setBpm(v) {
    v = clampBpm(v);
    if (v === S.bpm) return;
    S.bpm = v;
    showTempo();
  }
  function setOption(k, v) {
    if (k === 'beats') {
      v = +v;
      if (v === S.beats) return;
      S.beats = v;
      if (pos >= 2 * v) pos %= 2;   // такт стал короче — продолжаем ровно, без лишнего шага
      buildDots();
    } else {
      if (v === S.sound) return;
      S.sound = v;
    }
    save();
    showOptions();
  }

  // ---------- разметка ----------
  const ICON = {
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12h13"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12h13M12 5.5v13"/></svg>',
    go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5.6v12.8a1.1 1.1 0 0 0 1.7.93l10-6.4a1.1 1.1 0 0 0 0-1.86l-10-6.4A1.1 1.1 0 0 0 8 5.6z"/><rect class="i-stop" x="6" y="6" width="12" height="12" rx="2.6"/></svg>'
  };

  function mount(el) {
    if (ui) return;
    el.innerHTML =
      '<section class="m-card">' +
        '<div class="m-face">' +
          '<div class="m-beats" aria-hidden="true"></div>' +
          '<div class="m-bpm"><span class="m-num"></span><span class="m-unit">ударов в минуту</span></div>' +
        '</div>' +
        '<div class="m-tempo">' +
          '<button type="button" class="m-step" data-d="-1" aria-label="Медленнее">' + ICON.minus + '</button>' +
          '<input class="m-range" type="range" min="' + MIN + '" max="' + MAX + '" step="1" aria-label="Темп">' +
          '<button type="button" class="m-step" data-d="1" aria-label="Быстрее">' + ICON.plus + '</button>' +
        '</div>' +
        '<div class="m-opts">' +
          '<span class="m-cap" id="mBeatsCap">Размер</span>' +
          '<div class="seg m-seg" data-k="beats" role="group" aria-labelledby="mBeatsCap">' +
            '<button type="button" data-v="3">3/4</button><button type="button" data-v="4">4/4</button></div>' +
          '<span class="m-cap" id="mSoundCap">Звук</span>' +
          '<div class="seg m-seg" data-k="sound" role="group" aria-labelledby="mSoundCap">' +
            '<button type="button" data-v="click">Щелчок</button><button type="button" data-v="drums">Барабаны</button></div>' +
        '</div>' +
        '<button type="button" class="m-go" aria-pressed="false">' + ICON.go + '<span class="m-go-t">Старт</span></button>' +
        '<p class="m-keys"><kbd>Пробел</kbd> — старт и стоп</p>' +
      '</section>';
    const q = s => el.querySelector(s);
    ui = { beats: q('.m-beats'), num: q('.m-num'), range: q('.m-range'), go: q('.m-go'), goT: q('.m-go-t'), segs: el.querySelectorAll('.m-seg') };
    buildDots();
    showTempo();
    showOptions();
    showPlay();

    // −/+: нажатие — на 1, удержание — быстрый повтор с разгоном
    for (const b of el.querySelectorAll('.m-step')) {
      const d = +b.dataset.d;
      const end = () => { if (holdT) { clearTimeout(holdT); holdT = 0; save(); } };
      b.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        end();
        setBpm(S.bpm + d);
        let n = 0;
        const rep = () => { setBpm(S.bpm + d); holdT = setTimeout(rep, Math.max(28, 85 - 5 * n++)); };
        holdT = setTimeout(rep, 380);
      });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, end);
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('click', e => { if (e.detail === 0) { setBpm(S.bpm + d); save(); } });   // с клавиатуры
    }
    ui.range.addEventListener('input', () => setBpm(+ui.range.value));
    ui.range.addEventListener('change', save);
    for (const seg of ui.segs) {
      seg.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (b) setOption(seg.dataset.k, b.dataset.v);
      });
    }
    ui.go.addEventListener('click', toggle);

    // пробел — старт и стоп, пока открыта вкладка метронома
    const spaceOk = e => (e.code === 'Space' || e.key === ' ') && document.body.dataset.tab === 'metro' &&
      !e.ctrlKey && !e.altKey && !e.metaKey &&
      !(e.target.closest && e.target.closest('input:not([type="range"]), textarea, select, [contenteditable="true"], .settings'));
    document.addEventListener('keydown', e => {
      if (!spaceOk(e)) return;
      e.preventDefault();
      if (!e.repeat) toggle();
    });
    // кнопка в фокусе «нажимается» пробелом на отпускании — гасим, иначе сработает дважды
    document.addEventListener('keyup', e => { if (spaceOk(e)) e.preventDefault(); });
  }

  function buildDots() {
    ui.beats.innerHTML = '<span class="m-dot"></span>'.repeat(S.beats);
    dots = Array.from(ui.beats.children);
    lit = -1;
  }
  function showTempo() {
    ui.num.textContent = S.bpm;
    ui.range.value = S.bpm;
    ui.range.style.setProperty('--p', ((S.bpm - MIN) / (MAX - MIN)).toFixed(4));
    ui.range.setAttribute('aria-valuetext', S.bpm + ' ударов в минуту');
  }
  function showOptions() {
    for (const seg of ui.segs) {
      for (const b of seg.children) b.setAttribute('aria-pressed', String(String(S[seg.dataset.k]) === b.dataset.v));
    }
  }
  function showPlay() {
    ui.go.setAttribute('aria-pressed', String(playing));
    ui.goT.textContent = playing ? 'Стоп' : 'Старт';
  }

  window.Metronome = { mount, stop, isPlaying: () => playing };

  // для автотестов
  window.metroDebug = {
    events,
    get ctx() { return ctx; },
    // несколько тактов режима, отрисованные без динамиков теми же буферами и тем же рисунком
    async render(sound, beats, bpm, bars) {
      const sr = 48000, step = 30 / bpm, n = 2 * beats * bars;
      const oc = new OfflineAudioContext(1, Math.ceil((0.05 + n * step + 0.5) * sr), sr), b = buffers(oc);
      for (let k = 0; k < n; k++) for (const name of hitsAt(sound, beats, k % (2 * beats))) play(oc, b, name, 0.05 + k * step);
      return (await oc.startRendering()).getChannelData(0);
    }
  };
})();

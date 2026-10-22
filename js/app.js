/* Колок — тюнер: микрофон, логика настройки по струнам, хроматический режим, отрисовка */
(function () {
  'use strict';
  const P = window.Pitch, HS = window.Headstock;

  const TOL = 4;          // ¢ — нота «попала»
  const HOLD_MS = 600;    // столько удерживать ноту в зоне, чтобы струна засчиталась
  const DRIFT = 12;       // ¢ — настроенная струна «уехала»
  const HIST = 150;       // длина «змейки» в кадрах (~2,5 с)

  // ноты строёв — в физическом порядке струн: от самой толстой (слева на голове грифа) к самой тонкой
  const INSTRUMENTS = {
    guitar: {
      layouts: { split: '3 + 3', inline: '6 в линию' },
      tunings: [
        { id: 'standard', title: 'Стандарт', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
        { id: 'dropD', title: 'Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
        { id: 'dropC', title: 'Drop C', notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
        { id: 'halfDown', title: 'На полтона ниже', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
        { id: 'openG', title: 'Open G', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] }
      ],
      looks: () => [[2.9, 'wound'], [2.5, 'wound'], [2.1, 'wound'], [1.6, 'plain'], [1.3, 'plain'], [1.1, 'plain']]
    },
    bass: {
      layouts: { split: '2 + 2', inline: '4 в линию' },
      tunings: [
        { id: 'standard', title: 'Стандарт', notes: ['E1', 'A1', 'D2', 'G2'] },
        { id: 'dropD', title: 'Drop D', notes: ['D1', 'A1', 'D2', 'G2'] }
      ],
      looks: () => [[4.4, 'wound'], [3.8, 'wound'], [3.2, 'wound'], [2.6, 'wound']]
    },
    ukulele: {
      layouts: { split: '2 + 2' },
      tunings: [
        { id: 'standard', title: 'Классический', notes: ['G4', 'C4', 'E4', 'A4'] },
        { id: 'lowG', title: 'С басовой соль (Low G)', notes: ['G3', 'C4', 'E4', 'A4'] }
      ],
      looks: t => [t === 'lowG' ? [2.6, 'wound'] : [1.9, 'nylon'], [2.3, 'nylon'], [2.05, 'nylon'], [1.75, 'nylon']]
    }
  };

  // ---------- настройки (запоминаются в браузере) ----------
  const DEFAULTS = {
    mode: 'strings', instrument: 'guitar', notation: 'letters', sound: true,
    tuning: { guitar: 'standard', bass: 'standard', ukulele: 'standard' },
    layout: { guitar: 'split', bass: 'split', ukulele: 'split' }
  };
  const S = loadSettings();

  function loadSettings() {
    const s = JSON.parse(JSON.stringify(DEFAULTS));
    try {
      const v = JSON.parse(localStorage.getItem('kolok.v1') || 'null');
      if (v && typeof v === 'object') {
        if (v.mode === 'strings' || v.mode === 'chromatic') s.mode = v.mode;
        if (INSTRUMENTS[v.instrument]) s.instrument = v.instrument;
        if (v.notation === 'letters' || v.notation === 'solfege') s.notation = v.notation;
        if (typeof v.sound === 'boolean') s.sound = v.sound;
        for (const k of Object.keys(INSTRUMENTS)) {
          if (v.tuning && INSTRUMENTS[k].tunings.some(t => t.id === v.tuning[k])) s.tuning[k] = v.tuning[k];
          if (v.layout && INSTRUMENTS[k].layouts[v.layout[k]]) s.layout[k] = v.layout[k];
        }
      }
    } catch (e) { /* нет доступа к хранилищу — работаем с настройками по умолчанию */ }
    return s;
  }
  function saveSettings() {
    try { localStorage.setItem('kolok.v1', JSON.stringify(S)); } catch (e) { /* не страшно */ }
  }

  // ---------- состояние ----------
  const R = {
    started: false,
    strings: [],          // { letter, acc, octave, midi, freq, num }
    tuned: [], target: 0, auto: true,
    active: -1, cents: null, freq: null, refFreq: null,
    holdStart: 0, offStart: 0, awarded: false,
    shown: -1, lastHeard: -1e9,
    chromMidi: null,
    needle: null,
    history: []
  };
  let ctx = null, analyser = null, lp = null, buf = null, muteUntil = 0, wakeLock = null;
  let range = { min: 50, max: 500 };
  let debugFreq;  // для автотестов: подставная частота вместо микрофона
  const detect = P.createDetector();

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const els = {
    notation: $('notation'), sound: $('sound'), mode: $('mode'), instrument: $('instrument'),
    tuning: $('tuning'), layout: $('layout'), statusLabel: $('statusLabel'), autoChip: $('autoChip'),
    resetBtn: $('resetBtn'), noteRow: $('noteRow'), note: $('note'), cents: $('cents'), hz: $('hz'),
    meter: $('meter'), hint: $('hint'), piano: $('piano'), gate: $('gate'), startBtn: $('startBtn'),
    gateNote: $('gateNote'), neck: $('neck'), hs: $('headstock')
  };
  let hsSvg = null;

  const setText = (el, t) => { if (el._t !== t) { el._t = t; el.textContent = t; } };
  const setHTML = (el, h) => { if (el._h !== h) { el._h = h; el.innerHTML = h; } };
  const setClass = (el, c) => { if (el._c !== c) { el._c = c; el.className = c; } };

  const label = n => P.spell(n.letter, n.acc, n.octave, S.notation);
  const noteHTML = sp => sp.name + (sp.acc ? '<span class="acc">' + sp.acc + '</span>' : '') + '<sub>' + sp.octave + '</sub>';
  const plain = sp => sp.name + sp.acc + sp.octave;
  const fmtHz = f => f.toFixed(f < 100 ? 2 : 1).replace('.', ',');
  const fmtCents = c => {
    const a = Math.abs(c), v = a < 9.95 ? a.toFixed(1).replace('.', ',') : Math.round(a);
    return (c > 0.05 ? '+' : c < -0.05 ? '−' : '') + v + ' ¢';
  };

  // ---------- инструмент и строй ----------
  function currentTuning() {
    const inst = INSTRUMENTS[S.instrument];
    return inst.tunings.find(t => t.id === S.tuning[S.instrument]) || inst.tunings[0];
  }

  function setupInstrument() {
    const notes = currentTuning().notes;
    R.strings = notes.map((n, k) => {
      const p = P.parseNote(n);
      return Object.assign(p, { freq: P.midiToFreq(p.midi), num: notes.length - k });
    });
    R.tuned = R.strings.map(() => false);
    R.target = 0;
    R.auto = true;
    resetDetection();
    renderHeadstock();
    updateRange();
  }

  function renderHeadstock() {
    const inst = INSTRUMENTS[S.instrument];
    const layout = inst.layouts[S.layout[S.instrument]] ? S.layout[S.instrument] : 'split';
    const looks = inst.looks(S.tuning[S.instrument]).map(([sw, kind]) => ({ sw, kind }));
    els.hs.innerHTML = HS.build({ instrument: S.instrument, layout, labels: R.strings.map(label), looks });
    hsSvg = els.hs.querySelector('svg');
    fitHeadstock();
    lastPegKey = '';
    applyPegStates();
  }

  function fitHeadstock() {
    if (!hsSvg || S.mode !== 'strings') return;
    HS.layout(hsSvg);
    sizeHeadstock();
  }

  function sizeHeadstock() {
    if (!hsSvg) return;
    const vb = hsSvg.viewBox.baseVal, ar = vb.width / vb.height;
    const cw = els.hs.clientWidth, ch = els.hs.clientHeight;
    if (!cw || !ch) return;
    const w = Math.min(cw, ch * ar);
    hsSvg.style.width = Math.floor(w) + 'px';
    hsSvg.style.height = Math.floor(w / ar) + 'px';
  }

  let lastPegKey = '';
  function applyPegStates() {
    const states = R.strings.map((s, i) => {
      const act = i === R.active && R.cents != null;
      const off = act && Math.abs(R.cents) > TOL;
      return {
        tuned: R.tuned[i], active: act, ok: act && !off,
        target: i === R.target && !act,
        turn: off ? (R.cents < 0 ? 'tighten' : 'loosen') : null
      };
    });
    const key = JSON.stringify(states);
    if (key === lastPegKey) return;
    lastPegKey = key;
    HS.apply(hsSvg, states);
  }

  function updateRange() {
    let lpHz;
    if (S.mode === 'chromatic') {
      range = { min: 27, max: 4200 };
      lpHz = 20000;
    } else {
      const fs = R.strings.map(s => s.freq), lo = Math.min(...fs), hi = Math.max(...fs);
      range = { min: lo * 0.68, max: hi * 1.5 };
      lpHz = Math.max(600, hi * 2.5);  // срезает высокие обертоны: меньше сдвиг от их негармоничности
    }
    if (lp && ctx) lp.frequency.value = Math.min(lpHz, ctx.sampleRate / 2 - 100);
  }

  // ---------- сглаживание ----------
  const SM = { ring: [], jumps: 0, value: null, last: -1e9 };
  const median = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };

  function smooth(m, now) {
    SM.last = now;
    if (SM.ring.length && Math.abs(m - median(SM.ring)) > 0.6) {
      // одиночный выброс игнорируем; три подряд — значит, зазвучала другая нота
      if (++SM.jumps < 3) return SM.value;
      SM.ring.length = 0;
      SM.value = null;
    }
    SM.jumps = 0;
    SM.ring.push(m);
    if (SM.ring.length > 7) SM.ring.shift();
    const med = median(SM.ring);
    SM.value = SM.value == null ? med : SM.value + 0.35 * (med - SM.value);
    return SM.value;
  }
  function silence(now) {
    if (now - SM.last > 160) { SM.ring.length = 0; SM.value = null; SM.jumps = 0; }
    return SM.value;
  }
  function resetDetection() {
    SM.ring.length = 0; SM.value = null; SM.jumps = 0;
    setActive(-1);
    R.cents = null; R.freq = null; R.chromMidi = null; R.shown = -1; R.lastHeard = -1e9;
    R.history.length = 0;
  }

  // ---------- логика «по струнам» ----------
  function setActive(i) {
    if (R.active === i) return;
    R.active = i; R.holdStart = 0; R.offStart = 0; R.awarded = false;
  }

  function matchString(m) {
    const st = R.strings;
    if (!R.auto && R.target >= 0) {
      const t = st[R.target];
      // звенит другая, уже настроенная струна — не принимать её за выбранную
      for (let j = 0; j < st.length; j++) {
        if (j !== R.target && R.tuned[j] && Math.abs(m - st[j].midi) * 100 < 15 && Math.abs(m - t.midi) * 100 > 60) return null;
      }
      let c = (m - t.midi) * 100;
      if (Math.abs(c - 1200) < 100) c -= 1200;  // микрофон поймал октавный обертон
      return { i: R.target, cents: c, m: t.midi + c / 100 };
    }
    let best = -1, bd = Infinity;
    st.forEach((s, j) => {
      const d = Math.abs(m - s.midi) * 100 - (j === R.target ? 60 : 0);
      if (d < bd) { bd = d; best = j; }
    });
    let cents = (m - st[best].midi) * 100, mm = m;
    if (Math.abs(cents) > 150) {
      // возможно, услышали вторую гармонику — проверяем октавой ниже
      let b2 = -1, d2 = Infinity;
      st.forEach((s, j) => { const d = Math.abs(m - 12 - s.midi) * 100; if (d < d2) { d2 = d; b2 = j; } });
      if (d2 < 50) { best = b2; mm = m - 12; cents = (mm - st[b2].midi) * 100; }
    }
    return { i: best, cents, m: mm };
  }

  function stringsLogic(m, now) {
    const hit = m == null ? null : matchString(m);
    if (!hit) { setActive(-1); R.cents = null; R.freq = null; return; }
    const i = hit.i, c = hit.cents;
    setActive(i);
    R.cents = c;
    R.freq = P.midiToFreq(hit.m);
    R.refFreq = R.strings[i].freq;
    R.shown = i;
    R.lastHeard = now;

    if (Math.abs(c) <= TOL) {
      if (!R.holdStart) R.holdStart = now;
      if (!R.awarded && now - R.holdStart >= HOLD_MS) {
        R.awarded = true;
        if (!R.tuned[i]) onTuned(i);
      }
    } else R.holdStart = 0;

    if (R.tuned[i] && Math.abs(c) > DRIFT) {
      if (!R.offStart) R.offStart = now;
      if (now - R.offStart > 900) {
        R.tuned[i] = false;
        if (R.target < 0) R.target = i;
      }
    } else R.offStart = 0;
  }

  function nextUntuned(i) {
    const n = R.strings.length;
    for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (!R.tuned[j]) return j; }
    return -1;
  }

  function onTuned(i) {
    R.tuned[i] = true;
    HS.ping(hsSvg, i);
    if (R.target === i || R.target < 0 || R.tuned[R.target]) R.target = nextUntuned(i);
    const all = R.tuned.every(Boolean);
    if (S.sound) chime(all ? [1046.5, 1318.5, 1568, 2093] : [1318.5, 1760]);
  }

  // короткий сигнал; на время сигнала микрофон не слушаем, чтобы тюнер не услышал сам себя
  function chime(freqs) {
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.02, step = 0.09;
    freqs.forEach((f, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + k * step;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.38);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
    muteUntil = performance.now() + (0.02 + freqs.length * step + 0.42) * 1000;
  }

  // ---------- хроматический режим ----------
  function chromaticLogic(m, now) {
    if (m == null) { R.cents = null; R.freq = null; return; }
    const n = Math.round(m);
    R.chromMidi = n;
    R.cents = (m - n) * 100;
    R.freq = P.midiToFreq(m);
    R.refFreq = P.midiToFreq(n);
    R.lastHeard = now;
  }

  // ---------- главный цикл ----------
  function frame(now) {
    requestAnimationFrame(frame);
    let f = null;
    if (debugFreq !== undefined) f = debugFreq;
    else if (R.started && analyser && now >= muteUntil) {
      analyser.getFloatTimeDomainData(buf);
      const r = detect(buf, ctx.sampleRate, range.min, range.max);
      if (r) f = r.freq;
    }
    if (now < muteUntil) f = null;
    const m = f ? smooth(P.freqToMidi(f), now) : silence(now);
    if (S.mode === 'strings') stringsLogic(m, now); else chromaticLogic(m, now);

    R.history.unshift(R.cents == null ? null : Math.max(-60, Math.min(60, R.cents)));
    if (R.history.length > HIST) R.history.length = HIST;
    if (R.cents == null) R.needle = null;
    else R.needle = R.needle == null ? R.cents : R.needle + (R.cents - R.needle) * 0.4;

    render(now);
  }

  // ---------- отрисовка текста ----------
  function render(now) {
    const live = R.cents != null;
    const c = live ? R.cents : 0, a = Math.abs(c);
    let row = 'note-row';
    if (live) row += a <= TOL ? ' is-ok' : (c < 0 ? ' is-flat' : ' is-sharp') + (a > 50 ? ' is-far' : '');
    else row += ' is-idle';
    setClass(els.noteRow, row);

    if (S.mode === 'strings') {
      const recent = now - R.lastHeard < 1500;
      const idx = live ? R.active : recent && R.shown >= 0 ? R.shown : R.target >= 0 ? R.target : R.shown;
      const s = R.strings[idx];
      if (s) {
        setHTML(els.note, noteHTML(label(s)));
        setHTML(els.statusLabel, '<b>' + s.num + '-я струна</b>' + (R.auto ? '' : ' · выбрана вручную'));
      } else {
        setHTML(els.note, '✓');
        setHTML(els.statusLabel, '<b>Все струны</b>');
      }
      setText(els.cents, live ? fmtCents(c) : '—');
      setText(els.hz, live ? fmtHz(R.freq) + ' → ' + fmtHz(R.refFreq) + ' Гц' : s ? 'цель ' + fmtHz(s.freq) + ' Гц' : '—');
      els.autoChip.setAttribute('aria-pressed', String(R.auto));
      applyPegStates();
    } else {
      const recent = now - R.lastHeard < 1500;
      if (R.chromMidi != null && (live || recent)) {
        const sp = P.spellMidi(R.chromMidi, S.notation);
        setHTML(els.note, noteHTML(sp));
        setHTML(els.statusLabel, '<b>' + capital(P.octaveName(sp.octave)) + '</b> · ' + sp.octave + '-я по научной записи');
      } else {
        setHTML(els.note, '—');
        setHTML(els.statusLabel, '<b>Хроматический тюнер</b>');
      }
      setText(els.cents, live ? fmtCents(c) : '—');
      setText(els.hz, live ? fmtHz(R.freq) + ' Гц' : '—');
      updatePiano(live || recent ? R.chromMidi : null, live && a <= TOL);
    }
    renderHint(live, c, a);
    drawMeter();
  }

  const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

  function renderHint(live, c, a) {
    let t, cls = 'hint';
    if (!R.started) { t = 'Включите микрофон и дёрните струну'; cls += ' idle'; }
    else if (live) {
      if (a <= TOL) {
        t = S.mode !== 'strings' ? 'Точно в ноту' : R.target < 0 ? 'Все струны настроены ✓' : R.tuned[R.active] ? 'Струна настроена ✓' : 'Точно! Держите…';
        cls += ' ok';
      } else if (c < 0) {
        t = S.mode === 'strings' ? (a > 50 ? '↑ Сильно ниже — подтягивайте' : '↑ Подтяните') : 'Ниже ноты';
        cls += a > 50 ? ' up far' : ' up';
      } else {
        t = S.mode === 'strings' ? (a > 50 ? '↓ Сильно выше — ослабляйте' : '↓ Ослабьте') : 'Выше ноты';
        cls += a > 50 ? ' down far' : ' down';
      }
    } else if (S.mode === 'strings') {
      if (R.target < 0) { t = 'Все струны настроены — можно играть!'; cls += ' ok'; }
      else { const s = R.strings[R.target]; t = 'Дёрните ' + s.num + '-ю струну · ' + plain(label(s)); cls += ' idle'; }
    } else { t = 'Сыграйте ноту'; cls += ' idle'; }
    setText(els.hint, t);
    setClass(els.hint, cls);
  }

  // ---------- шкала и «змейка» ----------
  const mctx = els.meter.getContext('2d');
  let mw = 0, mh = 0;
  function sizeMeter() {
    const r = els.meter.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    mw = r.width; mh = r.height;
    els.meter.width = Math.round(mw * dpr);
    els.meter.height = Math.round(mh * dpr);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function devColor(c, alpha) {
    const a = Math.abs(c);
    let rgb;
    if (a <= TOL) rgb = [74, 222, 128];
    else {
      const t = Math.min(1, (a - TOL) / 30);
      const A = [74, 222, 128], B = [251, 191, 36], C = [248, 113, 113];
      const mix = (p, q, u) => p.map((v, k) => Math.round(v + (q[k] - v) * u));
      rgb = t < 0.4 ? mix(A, B, t / 0.4) : mix(B, C, (t - 0.4) / 0.6);
    }
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha.toFixed(3) + ')';
  }

  function drawMeter() {
    const c = mctx, w = mw, h = mh;
    if (!w || !h) return;
    c.clearRect(0, 0, w, h);
    const top = 50, cx = w / 2, half = w / 2 - 22;
    const X = v => cx + Math.max(-50, Math.min(50, v)) / 50 * half;

    // зелёная зона «в ноте»
    const z = Math.max(3, TOL / 50 * half);
    const g = c.createLinearGradient(0, top - 10, 0, h);
    g.addColorStop(0, 'rgba(74,222,128,.26)');
    g.addColorStop(1, 'rgba(74,222,128,0)');
    c.fillStyle = g;
    c.fillRect(cx - z, top - 10, 2 * z, h - top + 10);

    // сетка через 10 центов
    c.lineWidth = 1;
    for (let v = -50; v <= 50; v += 10) {
      c.strokeStyle = v === 0 ? 'rgba(74,222,128,.32)' : 'rgba(255,240,220,.05)';
      const x = Math.round(X(v)) + 0.5;
      c.beginPath(); c.moveTo(x, top); c.lineTo(x, h); c.stroke();
    }
    // риски шкалы
    for (let v = -50; v <= 50; v += 5) {
      const x = Math.round(X(v)) + 0.5, len = v === 0 ? 16 : v % 25 === 0 ? 11 : v % 10 === 0 ? 8 : 5;
      c.strokeStyle = v === 0 ? '#4ade80' : v % 25 === 0 ? 'rgba(255,240,220,.55)' : 'rgba(255,240,220,.22)';
      c.lineWidth = v === 0 ? 2 : 1;
      c.beginPath(); c.moveTo(x, top - 6 - len); c.lineTo(x, top - 6); c.stroke();
    }
    c.font = '700 11px Manrope, system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillStyle = 'rgba(255,240,220,.42)';
    [[-50, '−50'], [-25, '−25'], [25, '+25'], [50, '+50']].forEach(([v, s]) => c.fillText(s, X(v), 12));
    c.fillStyle = '#4ade80';
    c.fillText('0', cx, 12);

    // «змейка»: свежие значения сверху, старые уплывают вниз и гаснут
    const H = R.history, step = (h - top) / (HIST - 1);
    c.lineCap = 'round';
    for (let k = 0; k < H.length - 1; k++) {
      const a = H[k], b = H[k + 1];
      if (a == null || b == null) continue;
      const t = k / HIST;
      c.strokeStyle = devColor(a, (1 - t) * 0.95);
      c.lineWidth = 6.5 - 5.3 * t;
      c.beginPath();
      c.moveTo(X(a), top + k * step);
      c.lineTo(X(b), top + (k + 1) * step);
      c.stroke();
    }

    // бегунок
    if (R.needle != null) {
      const x = X(R.needle), col = devColor(R.needle, 1);
      c.save();
      c.shadowColor = col;
      c.shadowBlur = 18;
      c.fillStyle = col;
      roundRect(c, x - 3.5, top - 34, 7, 40, 3.5);
      c.fill();
      c.beginPath();
      c.arc(x, top + 2, 7, 0, Math.PI * 2);
      c.fill();
      c.restore();
      if (Math.abs(R.needle) > 50) {   // за пределами шкалы — стрелка у края
        c.fillStyle = col;
        c.font = '800 16px Manrope, sans-serif';
        c.fillText(R.needle < 0 ? '«' : '»', R.needle < 0 ? x + 16 : x - 16, top - 12);
      }
    } else {
      c.fillStyle = 'rgba(255,240,220,.18)';
      roundRect(c, cx - 2.5, top - 30, 5, 34, 2.5);
      c.fill();
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---------- клавиатура для хроматического режима ----------
  const PIANO_LO = 24, PIANO_HI = 95;   // C1 … B6
  let pianoOn = null, pianoOk = null;
  function buildPiano() {
    const WW = 20, WH = 92, BW = 12.5, BH = 58, TOP = 10;
    const isBlack = m => [1, 3, 6, 8, 10].includes(m % 12);
    let white = 0, keysW = '', keysB = '', oct = '', labs = '';
    for (let m = PIANO_LO; m <= PIANO_HI; m++) {
      if (!isBlack(m)) {
        const x = white * WW;
        keysW += '<rect class="k w" data-m="' + m + '" x="' + (x + 0.5) + '" y="' + TOP + '" width="' + (WW - 1) + '" height="' + WH + '" rx="2.5"/>';
        if (m % 12 === 0) {
          const o = m / 12 - 1, sp = P.spellMidi(m, S.notation);
          oct += '<rect class="oct" data-o="' + o + '" x="' + x + '" y="0" width="' + (7 * WW) + '" height="' + (TOP - 3) + '" rx="3"/>';
          labs += '<text class="olab" data-o="' + o + '" x="' + (x + 3) + '" y="' + (TOP + WH + 20) + '">' + sp.name + o + '</text>';
        }
        white++;
      } else {
        const x = white * WW - BW / 2;
        keysB += '<rect class="k b" data-m="' + m + '" x="' + x + '" y="' + TOP + '" width="' + BW + '" height="' + BH + '" rx="2"/>';
      }
    }
    els.piano.innerHTML = '<svg viewBox="0 0 ' + white * WW + ' ' + (TOP + WH + 26) + '" aria-hidden="true">' + oct + keysW + keysB + labs + '</svg>';
    pianoOn = null;
  }
  function updatePiano(m, ok) {
    if (m === pianoOn && ok === pianoOk) return;
    pianoOn = m; pianoOk = ok;
    els.piano.querySelectorAll('.on').forEach(el => el.classList.remove('on', 'ok'));
    if (m == null) return;
    const k = els.piano.querySelector('.k[data-m="' + m + '"]');
    if (k) { k.classList.add('on'); k.classList.toggle('ok', ok); }
    const o = Math.floor(m / 12) - 1;
    els.piano.querySelectorAll('[data-o="' + o + '"]').forEach(el => el.classList.add('on'));
  }

  // ---------- переключатели ----------
  function renderControls() {
    document.body.dataset.mode = S.mode;
    const press = (root, v) => root.querySelectorAll('button[data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    press(els.mode, S.mode);
    press(els.instrument, S.instrument);
    press(els.notation, S.notation);
    els.sound.setAttribute('aria-pressed', String(S.sound));

    const inst = INSTRUMENTS[S.instrument];
    els.tuning.innerHTML = inst.tunings.map(t => {
      const names = t.notes.map(n => { const p = P.parseNote(n), sp = P.spell(p.letter, p.acc, p.octave, S.notation); return sp.name + sp.acc; });
      return '<option value="' + t.id + '"' + (t.id === S.tuning[S.instrument] ? ' selected' : '') + '>' + t.title + ' · ' + names.join(' ') + '</option>';
    }).join('');
    const lays = Object.entries(inst.layouts);
    els.layout.hidden = lays.length < 2;
    els.layout.innerHTML = lays.map(([k, t]) => '<button type="button" data-v="' + k + '">' + t + '</button>').join('');
    press(els.layout, S.layout[S.instrument]);
  }

  function onSeg(root, fn) {
    root.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      fn(b.dataset.v);
      saveSettings();
      renderControls();
    });
  }

  onSeg(els.mode, v => {
    S.mode = v;
    resetDetection();
    document.body.dataset.mode = v;
    updateRange();
    if (v === 'strings') requestAnimationFrame(fitHeadstock);
  });
  onSeg(els.instrument, v => { S.instrument = v; setupInstrument(); });
  onSeg(els.layout, v => { S.layout[S.instrument] = v; renderHeadstock(); });
  onSeg(els.notation, v => { S.notation = v; renderHeadstock(); buildPiano(); });
  els.tuning.addEventListener('change', () => { S.tuning[S.instrument] = els.tuning.value; saveSettings(); renderControls(); setupInstrument(); });
  els.sound.addEventListener('click', () => { S.sound = !S.sound; saveSettings(); renderControls(); });
  els.autoChip.addEventListener('click', () => { R.auto = true; if (R.target < 0) R.target = nextUntuned(-1); });
  els.resetBtn.addEventListener('click', () => { R.tuned = R.tuned.map(() => false); R.target = 0; R.auto = true; resetDetection(); });

  // нажатие на колок или подпись — настраивать эту струну
  els.hs.addEventListener('click', e => {
    const g = e.target.closest('.peg, .lbl');
    if (!g) return;
    R.target = +g.dataset.i;
    R.auto = false;
    setActive(-1);
  });

  // ---------- микрофон ----------
  async function start() {
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      gateError('Микрофон доступен только на защищённой странице (адрес начинается с https://).');
      return;
    }
    els.startBtn.disabled = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 20; hp.Q.value = 0.7071;
      lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 0.7071;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      src.connect(hp); hp.connect(lp); lp.connect(analyser);
      buf = new Float32Array(analyser.fftSize);
      updateRange();
      R.started = true;
      els.gate.hidden = true;
      keepAwake();
      // на телефоне — сразу к шкале, чтобы рядом были видны и шкала, и голова грифа
      if (window.innerWidth < 900) document.getElementById('display').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      els.startBtn.disabled = false;
      if (ctx) { ctx.close().catch(() => {}); ctx = null; }
      gateError(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
        ? 'Доступ к микрофону запрещён. Разрешите его в настройках сайта (значок слева от адреса) и нажмите кнопку ещё раз.'
        : e && e.name === 'NotFoundError' ? 'Микрофон не найден. Подключите его и попробуйте снова.'
          : 'Не удалось включить микрофон: ' + (e && e.message || e));
    }
  }
  function gateError(t) { els.gateNote.textContent = t; els.gateNote.classList.add('err'); }
  els.startBtn.addEventListener('click', start);

  // экран не гаснет, пока идёт настройка
  async function keepAwake() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen');
    } catch (e) { /* не поддерживается — не страшно */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (R.started && document.visibilityState === 'visible') { keepAwake(); if (ctx) ctx.resume().catch(() => {}); }
  });

  // ---------- старт ----------
  renderControls();
  setupInstrument();
  buildPiano();
  sizeMeter();
  new ResizeObserver(() => { sizeMeter(); sizeHeadstock(); }).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitHeadstock(); buildPiano(); });
  requestAnimationFrame(frame);

  // для автотестов
  window.kolokDebug = {
    state: R, settings: S,
    feed(f) { debugFreq = f; },
    startFake() { R.started = true; els.gate.hidden = true; }
  };
})();

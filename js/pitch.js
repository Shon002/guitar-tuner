/* Колок — определение высоты звука (алгоритм YIN) и нотная арифметика.
   Без зависимостей; работает и в браузере, и в Node (для тестов). */
(function (root) {
  'use strict';

  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SOLFEGE = { C: 'До', D: 'Ре', E: 'Ми', F: 'Фа', G: 'Соль', A: 'Ля', B: 'Си' };
  // хроматическая гамма через диезы: [буква, знак]
  const SHARPS = [['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
    ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]];
  // научная нумерация октав (A4 = 440 Гц) → русское название
  const OCTAVE_NAMES = ['субконтроктава', 'контроктава', 'большая октава', 'малая октава',
    'первая октава', 'вторая октава', 'третья октава', 'четвёртая октава', 'пятая октава'];

  const freqToMidi = f => 69 + 12 * Math.log2(f / 440);
  const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);

  // 'E2', 'Eb2', 'C#3' → { letter, acc, octave, midi }
  function parseNote(s) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(s);
    if (!m) throw new Error('Bad note: ' + s);
    const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
    const octave = +m[3];
    return { letter: m[1], acc, octave, midi: 12 * (octave + 1) + LETTER_PC[m[1]] + acc };
  }

  // подпись ноты: { name, acc, octave } в буквенной (C D E) или слоговой (До Ре Ми) записи
  function spell(letter, acc, octave, notation) {
    return {
      name: notation === 'solfege' ? SOLFEGE[letter] : letter,
      acc: acc > 0 ? '♯' : acc < 0 ? '♭' : '',
      octave
    };
  }

  function spellMidi(midi, notation) {
    const pc = ((midi % 12) + 12) % 12;
    const [letter, acc] = SHARPS[pc];
    return spell(letter, acc, Math.floor(midi / 12) - 1, notation);
  }

  const octaveName = o => OCTAVE_NAMES[o] || '';

  const parab = (a, b, c) => {
    const den = a - 2 * b + c;
    return den > 0 ? 0.5 * (a - c) / den : 0;
  };

  /* Детектор YIN. Низкие диапазоны (бас, хроматический режим) сначала считаются
     на прореженном вдвое сигнале, затем период уточняется на полной частоте —
     так расчёт укладывается в кадр даже на телефоне. */
  function createDetector(opts) {
    const THRESH = (opts && opts.threshold) || 0.15;
    let x = new Float32Array(0), y = new Float32Array(0);
    let d = new Float64Array(0), cm = new Float64Array(0);

    return function detect(buf, sr, minF, maxF, minRms) {
      if (minRms === undefined) minRms = 0.001;   // тонкая 1-я струна в далёкий микрофон телефона тихая; шум отсекает проверка чистоты тона ниже
      const D = Math.min(2, Math.ceil(sr / minF / 600));   // вдвое — уже для гитары; сильнее нельзя: портятся высокие ноты
      const srD = sr / D;
      const tauMax = Math.ceil(srD / minF);
      const tauMin = Math.max(2, Math.floor(srD / maxF));
      // окно — не меньше двух самых длинных периодов: устойчивее к шуму на низких нотах
      let W = Math.max(Math.round(1024 / D), Math.min(2 * tauMax, Math.floor(buf.length / D) - tauMax - 2));
      let L = W + tauMax + 2;
      if (L * D > buf.length) {
        L = Math.floor(buf.length / D);
        W = L - tauMax - 2;
        if (W < tauMax / 2) return null;
      }
      const N = L * D, start = buf.length - N;

      if (x.length < N) x = new Float32Array(N);
      let mean = 0;
      for (let i = 0; i < N; i++) mean += buf[start + i];
      mean /= N;
      let energy = 0;
      for (let i = 0; i < N; i++) {
        const v = buf[start + i] - mean;
        x[i] = v;
        energy += v * v;
      }
      const rms = Math.sqrt(energy / N);
      if (rms < minRms) return null;

      let s = x;
      if (D > 1) {
        if (y.length < L) y = new Float32Array(L);
        for (let i = 0; i < L; i++) {
          let acc = 0;
          for (let k = 0; k < D; k++) acc += x[i * D + k];
          y[i] = acc / D;
        }
        s = y;
      }

      if (d.length <= tauMax + 1) {
        d = new Float64Array(tauMax + 2);
        cm = new Float64Array(tauMax + 2);
      }
      for (let tau = 1; tau <= tauMax; tau++) {
        let sum = 0;
        for (let j = 0; j < W; j++) {
          const v = s[j] - s[j + tau];
          sum += v * v;
        }
        d[tau] = sum;
      }
      cm[0] = 1;
      let run = 0;
      for (let tau = 1; tau <= tauMax; tau++) {
        run += d[tau];
        cm[tau] = run > 0 ? d[tau] * tau / run : 1;
      }

      let tau = -1;
      for (let t = tauMin; t < tauMax; t++) {
        if (cm[t] < THRESH) {
          // самый глубокий провал, пока кривая остаётся ниже порога (шум даёт ложные мелкие провалы)
          let best = t;
          while (t + 1 < tauMax && cm[t + 1] < THRESH) {
            t++;
            if (cm[t] < cm[best]) best = t;
          }
          tau = best;
          break;
        }
      }
      if (tau < 0) return null;

      // защита от ошибки «на октаву выше», когда основной тон слабый
      // (низкие струны в маленький микрофон телефона)
      const t2 = tau * 2;
      if (srD / tau < 300 && cm[tau] > 0.04 && t2 + 3 < tauMax) {
        let b = t2;
        for (let j = t2 - 2; j <= t2 + 2; j++) if (cm[j] < cm[b]) b = j;
        if (cm[b] < cm[tau] * 0.4) tau = b;
      }

      let T;
      if (D === 1) {
        T = tau + parab(d[tau - 1], d[tau], d[tau + 1]);
      } else {
        // уточнение периода на исходной частоте дискретизации
        const T0 = (tau + parab(d[tau - 1], d[tau], d[tau + 1])) * D;
        const Wf = W * D;
        const lo = Math.max(2, Math.floor(T0) - D - 1);
        const hi = Math.min(N - Wf - 2, Math.ceil(T0) + D + 1);
        const vals = new Float64Array(hi - lo + 3);
        for (let t = lo - 1; t <= hi + 1; t++) {
          let sum = 0;
          for (let j = 0; j < Wf; j++) {
            const v = x[j] - x[j + t];
            sum += v * v;
          }
          vals[t - lo + 1] = sum;
        }
        let best = lo;
        for (let t = lo; t <= hi; t++) if (vals[t - lo + 1] < vals[best - lo + 1]) best = t;
        const k = best - lo + 1;
        T = best + parab(vals[k - 1], vals[k], vals[k + 1]);
      }
      return { freq: sr / T, clarity: 1 - cm[tau], rms };
    };
  }

  const api = { freqToMidi, midiToFreq, parseNote, spell, spellMidi, octaveName, createDetector };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Pitch = api;
})(typeof window !== 'undefined' ? window : globalThis);

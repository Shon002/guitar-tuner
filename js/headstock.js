/* Колок — голова грифа: рисованный SVG с колками, струнами и подписями нот.
   Направление «винтажная классика»: формы и фурнитура по мотивам инструментов 50–60-х
   (головы «открытая книга», малая голова 6 в линию, бас 57-го года, укулеле с «короной»).
   Все формы строятся в одной системе координат: ось грифа x = 200, верхний порожек y = nutY,
   голова уходит вверх. Колки перечислены в физическом порядке струн слева направо
   (от самой толстой к самой тонкой), side = −1 — колок слева, +1 — справа. */
(function (root) {
  'use strict';

  const CX = 200;
  const r1 = v => Math.round(v * 10) / 10;

  // симметричный контур: левая половина — кубические сегменты [c1x,c1y,c2x,c2y,x,y] от левого края
  // порожка до оси x = 200; правая половина достраивается зеркально
  function sym(x0, y0, segs) {
    let d = 'M' + x0 + ',' + y0;
    segs.forEach(s => { d += ' C' + s.join(','); });
    const pts = [[x0, y0]].concat(segs.map(s => [s[4], s[5]]));
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i], p = pts[i];
      d += ' C' + [2 * CX - s[2], s[3], 2 * CX - s[0], s[1], 2 * CX - p[0], p[1]].join(',');
    }
    return d + ' Z';
  }

  const DESIGNS = {
    // «открытая книга» в духе Les Paul / J-45: чёрный лак, кремовая окантовка, перламутровый кубок
    'guitar-split': {
      view: [-40, 216, 480, 520], nutY: 560, nutHalf: 46, botHalf: 48.5, botY: 726, nutMargin: 6,
      scaleMm: 628, upm: 2.14,
      outline: sym(154, 560, [
        [146, 556, 125, 549, 117, 532],
        [113, 470, 105, 340, 101.5, 272],
        [100.8, 262, 102.5, 255.5, 108, 251.5],
        [130, 242, 160, 231.5, 177, 230.5],
        [187, 230, 195.5, 236, 200, 246.5]
      ]),
      bbox: [100, 229, 300, 562],
      finish: 'black', binding: true, board: 'rosewood', edge: 'rgba(0,0,0,.6)',
      posts: [[144, 492, -1, 114], [139, 402, -1, 109], [134, 312, -1, 103.5],
        [266, 312, 1, 296.5], [261, 402, 1, 291], [256, 492, 1, 286]],
      postR: 4.2, bushR: 8.5, bush: 'press', button: 'keystone',
      truss: 'bell', inlay: 'crown',
      logo: { x: 200, y: 292, size: 40, rot: -4, kind: 'pearl' },
      trees: []
    },
    // малая голова 6 в линию в духе Stratocaster 50-х: янтарный нитролак клёна, деколь, скоба-«бабочка»
    'guitar-inline': {
      view: [-40, 96, 360, 636], nutY: 560, nutHalf: 46, botHalf: 48.5, botY: 726, nutMargin: 6,
      scaleMm: 648, upm: 2.14,
      outline: 'M246,560 C250,546 257,531 262,516 C267,500 268,484 262,466 C255,446 240,424 237,394 ' +
        'C234,364 244,336 262,308 C280,280 296,250 296,212 C296,160 262,118 214,111 C176,105 136,116 124,146 ' +
        'C119.5,158 119,168 119,182 L119,498 C119,528 136,550 154,560 Z',
      bbox: [119, 104, 297, 562],
      finish: 'maple', board: 'maple', edge: 'rgba(110,52,8,.55)',
      posts: [[148, 505, -1, 121], [148, 449, -1, 121], [148, 393, -1, 121],
        [148, 337, -1, 121], [148, 281, -1, 121], [148, 225, -1, 121]],
      postR: 4.4, bushR: 8, bush: 'press', button: 'kluson',
      truss: null,
      logo: { x: 242, y: 200, size: 40, rot: -90, kind: 'decal' },
      trees: [{ idx: [4, 5], y: 372, kind: 'wing' }]
    },
    // бас 2+2: вишнёвый махагон, открытые колки-«клевер» с червячной передачей
    'bass-split': {
      view: [-50, 280, 500, 440], nutY: 560, nutHalf: 46, botHalf: 48, botY: 712, nutMargin: 8,
      scaleMm: 864, upm: 2.14,
      outline: sym(154, 560, [
        [144, 556, 121, 549, 112, 530],
        [107, 500, 101, 400, 98.5, 336],
        [98, 324, 99.5, 316, 105.5, 311.5],
        [126, 298, 158, 289, 177, 292],
        [189, 294, 197, 300, 200, 309]
      ]),
      bbox: [98, 289, 302, 562],
      finish: 'cherry', board: 'rosewood', edge: 'rgba(30,4,0,.6)',
      posts: [[138, 500, -1, 108], [131, 390, -1, 101], [269, 390, 1, 299], [262, 500, 1, 292]],
      postR: 7, bushR: 12, bush: 'press', button: 'clover', btnScale: 1.3,
      truss: 'bell',
      logo: { x: 200, y: 352, size: 36, rot: 0, kind: 'gold' },
      trees: []
    },
    // бас 4 в линию в духе Precision 1957: большая «стратовская» голова, колки «слоновье ухо»
    'bass-inline': {
      view: [-50, 140, 370, 578], nutY: 560, nutHalf: 46, botHalf: 48, botY: 712, nutMargin: 8,
      scaleMm: 864, upm: 2.14,
      outline: 'M246,560 C251,545 260,530 266,514 C272,496 272,476 265,456 C257,434 242,414 240,384 ' +
        'C238,356 250,334 270,309 C288,286 302,262 302,229 C302,186 268,155 222,151 C182,148 140,159 128,188 ' +
        'C123,199 122,208 122,220 L122,498 C122,528 138,550 154,560 Z',
      bbox: [122, 149, 303, 562],
      finish: 'maple', board: 'maple', edge: 'rgba(110,52,8,.55)',
      posts: [[152, 505, -1, 124], [152, 432, -1, 124], [152, 359, -1, 124], [152, 286, -1, 124]],
      postR: 7, bushR: 12, bush: 'press', button: 'ear', btnScale: 1.3,
      truss: null,
      logo: { x: 248, y: 240, size: 38, rot: -90, kind: 'decal' },
      trees: [{ idx: [3], y: 404, kind: 'button' }]
    },
    // укулеле: вогнутая «корона», коа с переливом, окантовка, фрикционные колки с перламутром
    'ukulele-split': {
      view: [-10, 290, 420, 430], nutY: 560, nutHalf: 40, botHalf: 42, botY: 712, nutMargin: 7,
      scaleMm: 380, upm: 2.29,
      outline: sym(160, 560, [
        [151, 556, 133, 550, 127, 532],
        [124, 500, 121, 420, 120, 368],
        [119.6, 358, 120, 348, 122.5, 340],
        [148, 338, 176, 330, 190, 318],
        [194.5, 314, 198, 310, 200, 305]
      ]),
      bbox: [119, 303, 281, 562],
      finish: 'koa', binding: true, boardBinding: false, board: 'rosewood', edge: 'rgba(40,14,2,.6)',
      posts: [[146, 494, -1, 125], [142, 400, -1, 121], [258, 400, 1, 279], [254, 494, 1, 275]],
      postR: 4.2, bushR: 7.5, bush: 'washer', button: 'pearl',
      inlay: 'kite',
      logo: { x: 200, y: 360, size: 30, rot: 0, kind: 'mop' },
      trees: []
    }
  };

  // ---- кнопки колков: рисуются «наружу» по +x, центр головки кнопки — (center, 0) ----
  const SHAFT = (x, h, w) => '<rect x="' + x + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (h / 3.2).toFixed(1) + '" fill="url(#hsShaft)"/>';
  const BUTTONS = {
    // Kluson Deluxe «keystone»: состаренный перламутроид на никелевой втулке
    keystone: {
      reach: 54, center: 35, halo: 30, rx: 19, ry: 14,
      draw: () => SHAFT(-8, 5.2, 22) +
        '<rect x="11.5" y="-5.6" width="6.5" height="11.2" rx="1.4" fill="url(#hsChrome)" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>' +
        '<path class="face" d="M17,-5.4 C26,-5.8 35,-9.6 46.5,-13.8 C50.4,-15 53.4,-12.8 53.7,-9 C54.3,-3 54.3,3 53.7,9 ' +
        'C53.4,12.8 50.4,15 46.5,13.8 C35,9.6 26,5.8 17,5.4 Z" stroke="rgba(40,24,4,.55)" stroke-width=".6"/>' +
        '<path d="M24,1.2 C32,1.8 41,4.4 49.5,8.6" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2.6"/>' +
        '<path d="M21,-3.5 C30,-4.3 38,-7.7 46.5,-11.3 C49.6,-12.3 51.2,-10.6 51.5,-8 C42,-6.8 31,-3.8 21,-3.5 Z" fill="#fff" opacity=".6"/>' +
        '<path d="M20,4.2 C30,5.4 38.5,8.8 47.5,12.3" fill="none" stroke="rgba(60,34,0,.28)" stroke-width="1.3"/>'
    },
    // Kluson Deluxe: штампованная никелевая «ракушка» с завальцованным краем
    kluson: {
      reach: 53, center: 36, halo: 30, rx: 18, ry: 12.5,
      draw: () => SHAFT(-8, 5, 22) +
        '<rect x="12" y="-4.8" width="5" height="9.6" rx="1.2" fill="url(#hsChrome)" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>' +
        '<path d="M16.5,-3.4 L21,-4.8 L21,4.8 L16.5,3.4 Z" fill="url(#hsShaft)"/>' +
        '<path class="face" d="M19.5,0 C19.5,-7.6 26,-11.8 36,-11.8 C47,-11.8 53,-7.4 53,0 C53,7.4 47,11.8 36,11.8 ' +
        'C26,11.8 19.5,7.6 19.5,0 Z" stroke="rgba(0,0,0,.5)" stroke-width=".6"/>' +
        '<path d="M21.8,0 C21.8,-6.3 27.2,-9.8 36,-9.8 C45.4,-9.8 50.8,-6.2 50.8,0 C50.8,6.2 45.4,9.8 36,9.8 C27.2,9.8 21.8,6.3 21.8,0 Z" ' +
        'fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".8"/>' +
        '<path d="M25,-5.8 C29.5,-8.8 41,-9.2 48,-5.4 C40,-6.6 31,-6.6 25,-5.8 Z" fill="#fff" opacity=".75"/>' +
        '<path d="M24,7.4 C31,10.4 44,10.2 50,5.2" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.3"/>'
    },
    // открытый басовый колок с ключом-«клевером»; у кромки головы видна червячная передача
    clover: {
      reach: 66, center: 45, halo: 36, rx: 23, ry: 22,
      draw: () =>
        '<rect x="-8" y="-5.4" width="19" height="10.8" rx="2.4" fill="url(#hsShaft)" stroke="rgba(0,0,0,.45)" stroke-width=".6"/>' +
        '<path d="M1.6,-5 l1.8,10 M4.6,-5 l1.8,10 M7.6,-5 l1.8,10" stroke="rgba(40,36,30,.45)" stroke-width=".9"/>' +
        SHAFT(9, 7.4, 13) +
        '<rect x="18" y="-6.6" width="6" height="13.2" rx="1.6" fill="url(#hsChrome)" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>' +
        '<path class="face" d="M23,-4.6 C27,-4.6 30.5,-5 33.4,-8.15 A11,11 0 1 1 55,-10.95 A11,11 0 1 1 55,10.95 ' +
        'A11,11 0 1 1 33.4,8.15 C30.5,5 27,4.6 23,4.6 Z" stroke="rgba(0,0,0,.45)" stroke-width=".6"/>' +
        '<path d="M45,0 L36,-9 M45,0 L57,0 M45,0 L36,9" stroke="rgba(0,0,0,.13)" stroke-width="1.4"/>' +
        '<circle cx="44" cy="0" r="3.6" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.45)" stroke-width=".5"/>' +
        '<ellipse cx="43.5" cy="-15.5" rx="6.2" ry="2.4" fill="#fff" opacity=".55"/>' +
        '<ellipse cx="58" cy="-4" rx="3.6" ry="2" fill="#fff" opacity=".4"/>' +
        '<path d="M37,17.5 C42,20.5 48,20.5 52,17" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.3"/>'
    },
    // Kluson для баса 50-х: плоский ключ «слоновье ухо»
    ear: {
      reach: 66, center: 44, halo: 36, rx: 23, ry: 22,
      draw: () => SHAFT(-8, 7.2, 26) +
        '<rect x="15" y="-6.4" width="6" height="12.8" rx="1.6" fill="url(#hsChrome)" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>' +
        '<path class="face" d="M20,-4.6 C26,-5 30,-9 33,-14.5 C36,-19.6 41,-21.8 47.5,-21.8 C56.5,-21.8 63.8,-17 65,-9 ' +
        'C65.6,-4 65.6,4 65,9 C63.8,17 56.5,21.8 47.5,21.8 C41,21.8 36,19.6 33,14.5 C30,9 26,5 20,4.6 Z" stroke="rgba(0,0,0,.5)" stroke-width=".6"/>' +
        '<path d="M36,-14.4 C39.5,-18.6 46,-19.6 53,-19 C58,-18.4 61.6,-15.6 62.6,-11.4 C55,-14.4 45,-15.6 36,-14.4 Z" fill="#fff" opacity=".65"/>' +
        '<path d="M36,16.2 C40,19.4 50,20.2 57.5,18 C60.4,17 62.4,15 63.2,12.4" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.4"/>' +
        '<path d="M22.6,-2.6 C27.6,-3.4 31,-7 33.4,-12 C36.4,-17.8 41.4,-19.6 47.5,-19.6 C55.4,-19.6 61.6,-15.4 62.7,-8.6 ' +
        'C63.2,-4 63.2,4 62.7,8.6 C61.6,15.4 55.4,19.6 47.5,19.6 C41.4,19.6 36.4,17.8 33.4,12 C31,7 27.6,3.4 22.6,2.6" ' +
        'fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>' +
        '<circle cx="27" cy="0" r="2.6" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.45)" stroke-width=".5"/>'
    },
    // фрикционный колок укулеле: никелевый наконечник и перламутровая кнопка
    pearl: {
      reach: 50, center: 34, halo: 30, rx: 17, ry: 13.5,
      draw: () => SHAFT(-6, 5, 19) +
        '<path d="M11,-4 L18.5,-6.2 L18.5,6.2 L11,4 Z" fill="url(#hsChrome)" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>' +
        '<path class="face" d="M18,0 C18,-8 24,-12.8 33,-12.8 C43,-12.8 50,-8.4 50,0 C50,8.4 43,12.8 33,12.8 C24,12.8 18,8 18,0 Z" ' +
        'stroke="rgba(70,55,35,.5)" stroke-width=".6"/>' +
        '<path d="M23,5.5 C30,2.6 38,0 47,-1.2" fill="none" stroke="#d3c6ee" stroke-opacity=".3" stroke-width="3.4"/>' +
        '<ellipse cx="31" cy="-6.6" rx="9" ry="3" fill="#fff" opacity=".75"/>'
    }
  };

  // ---- материалы струн ----
  const LOOK = {
    plain: { edge: '#4b4f55', body: '#dcdcd8', hi: '#ffffff', hiOp: 0.85 },
    wound: { edge: '#3b362d', body: '#bdb39c', hi: '#f6efe0', hiOp: 0.5, wind: '#4a443a' },
    nylon: { edge: '#9b8f76', body: '#efe7d2', hi: '#ffffff', hiOp: 0.7 }
  };

  function rand(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // волокна дерева вдоль грифа
  function grain(seed, x0, x1, y0, y1, n, color, op0, op1, w0, w1, amp) {
    const r = rand(seed);
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i + r()) / n;
      const ph = r() * 6.283, fr = 0.006 + r() * 0.014, a = amp * (0.4 + r()), drift = (r() - 0.5) * 0.03;
      let d = 'M' + r1(x) + ',' + y0;
      for (let y = y0 + 14; y <= y1 + 14; y += 14) d += 'L' + r1(x + a * Math.sin(y * fr + ph) + (y - y0) * drift) + ',' + y;
      out += '<path d="' + d + '" stroke="' + color + '" stroke-opacity="' + (op0 + r() * (op1 - op0)).toFixed(2) +
        '" stroke-width="' + (w0 + r() * (w1 - w0)).toFixed(2) + '" fill="none"/>';
    }
    return out;
  }

  // поперечный «перелив» (свиль) — для коа
  function curl(seed, x0, x1, y0, y1, n) {
    const r = rand(seed);
    let out = '';
    for (let i = 0; i < n; i++) {
      const y = y0 + (y1 - y0) * (i + r()) / n, h = 4 + r() * 7, ph = r() * 6.28;
      let d = 'M' + x0 + ',' + r1(y);
      for (let x = x0 + 12; x <= x1 + 12; x += 12) d += 'L' + x + ',' + r1(y + 2.6 * Math.sin(x * 0.045 + ph));
      out += '<path d="' + d + '" stroke="#ffe0a8" stroke-opacity="' + (0.04 + r() * 0.06).toFixed(2) +
        '" stroke-width="' + r1(h) + '" fill="none"/>';
    }
    return out;
  }

  // градиенты: [[offset, цвет, прозрачность?], …]
  const stops = s => s.map(([o, c, a]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (a != null ? ' stop-opacity="' + a + '"' : '') + '/>').join('');
  const lin = (id, s, h) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (h ? 1 : 0) + '" y2="' + (h ? 0 : 1) + '">' + stops(s) + '</linearGradient>';
  const rad = (id, s, a) => '<radialGradient id="' + id + '"' + (a || '') + '>' + stops(s) + '</radialGradient>';

  function defs(ds, board) {
    return '<defs>' +
      // никель с лёгкой патиной (не хромово-синий)
      lin('hsChrome', [[0, '#fdfbf6'], [.2, '#dcd8cf'], [.48, '#8a857c'], [.6, '#eceae4'], [.85, '#a7a297'], [1, '#5b5750']]) +
      lin('hsShaft', [[0, '#8d8880'], [.35, '#f1eee7'], [1, '#5c5851']]) +
      rad('hsChromeR', [[0, '#ffffff'], [.3, '#e3dfd6'], [.72, '#8d887f'], [1, '#48443e']], ' cx=".38" cy=".32" r=".75"') +
      lin('hsGreen', [[0, '#e3fde9'], [.3, '#6ee79c'], [.68, '#16a34a'], [1, '#0b4f27']]) +
      lin('hsAmber', [[0, '#fff4d1'], [.3, '#fcd34d'], [.7, '#d97706'], [1, '#6b3500']]) +
      '<linearGradient id="hsPearl" x1="0" y1="0" x2="1" y2="1">' +
      stops([[0, '#fffdf8'], [.3, '#f1e9db'], [.5, '#e4efec'], [.7, '#f5e6ec'], [1, '#d6cab2']]) + '</linearGradient>' +
      // состаренный перламутроид кнопок keystone
      lin('hsKey', [[0, '#fbf4df'], [.35, '#ecdfba'], [.72, '#d5c08e'], [1, '#a88e5a']]) +
      lin('hsBone', [[0, '#fbf6e8'], [.55, '#ebe0c6'], [1, '#c8b892']]) +
      lin('hsGold', [[0, '#fff0c0'], [.45, '#e8c46c'], [.8, '#a8792a'], [1, '#f1d38e']]) +
      '<linearGradient id="hsMop" x1="0" y1="0" x2="1" y2="1">' +
      stops([[0, '#fffdf6'], [.25, '#dbeaf4'], [.5, '#fbe8ee'], [.75, '#e1f5ea'], [1, '#f6efe2']]) + '</linearGradient>' +
      lin('hsFret', [[0, '#f7f6f2'], [.45, '#b8b4ab'], [1, '#5f5b54']]) +
      rad('hsHaloA', [[0, '#fbbf24', .6], [.55, '#f59e0b', .22], [1, '#f59e0b', 0]]) +
      rad('hsHaloG', [[0, '#4ade80', .65], [.55, '#22c55e', .25], [1, '#22c55e', 0]]) +
      '<linearGradient id="hsGloss" x1="0" y1="0" x2="1" y2="1">' +
      stops([[0, '#fff', .26], [.32, '#fff', .06], [.56, '#fff', 0]]) + '</linearGradient>' +
      // потемнение к краям: лак набирается у кромки
      rad('hsVign', [[0, '#000', 0], [.62, '#000', 0], [1, '#2a1200', .4]], ' cx=".5" cy=".55" r=".72"') +
      lin('hsF-black', [[0, '#121113'], [.4, '#2a282c'], [.62, '#1b1a1d'], [1, '#09090a']], 1) +
      lin('hsF-maple', [[0, '#b9772e'], [.2, '#dc9d4d'], [.5, '#efc078'], [.8, '#d99a4a'], [1, '#b26f28']], 1) +
      lin('hsF-koa', [[0, '#6a3511'], [.25, '#a9692c'], [.5, '#c98b46'], [.75, '#9d5b23'], [1, '#5e2e0e']], 1) +
      lin('hsF-cherry', [[0, '#3a0c06'], [.25, '#6e1d0f'], [.5, '#912e16'], [.75, '#6a1a0d'], [1, '#340a05']], 1) +
      lin('hsB-rosewood', [[0, '#22120a'], [.5, '#3a2216'], [1, '#1f1009']], 1) +
      lin('hsB-maple', [[0, '#c98a40'], [.5, '#edbd76'], [1, '#c6863d']], 1) +
      '<filter id="hsShadow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="hsBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>' +
      '<clipPath id="hsClip"><path d="' + ds.outline + '"/></clipPath>' +
      '<clipPath id="hsBoardClip"><path d="' + board + '"/></clipPath>' +
      '</defs>';
  }

  function pegSvg(s, B) {
    return '<g class="peg" data-i="' + s.k + '" transform="translate(' + s.bx + ',' + s.py + ') scale(' + s.side * B.k + ',' + B.k + ')">' +
      '<circle class="halo" cx="' + B.center + '" cy="0" r="' + B.halo + '"/>' +
      B.draw() +
      '<circle class="ring" cx="' + B.center + '" cy="0" r="' + (B.halo - 6) + '"/>' +
      '<circle class="ping" cx="' + B.center + '" cy="0" r="' + (B.halo - 8) + '"/>' +
      '<rect class="hit" x="-4" y="' + (-B.halo) + '" width="' + (B.reach + 10) + '" height="' + (2 * B.halo) + '"/>' +
      '</g>';
  }

  function boardSvg(ds, board) {
    let g = '<path d="' + board + '" fill="url(#hsB-' + ds.board + ')"/>';
    g += '<g clip-path="url(#hsBoardClip)">';
    if (ds.board === 'rosewood') {
      g += grain(11, CX - 52, CX + 52, ds.nutY, ds.botY, 26, '#0b0503', 0.3, 0.6, 0.6, 1.7, 1.4);
      g += grain(12, CX - 52, CX + 52, ds.nutY, ds.botY, 10, '#7a5038', 0.08, 0.18, 0.5, 1.2, 1.2);
    } else {
      g += grain(13, CX - 52, CX + 52, ds.nutY, ds.botY, 16, '#9a5a1c', 0.06, 0.16, 0.5, 1.1, 1);
    }
    g += '</g>';
    const halfAt = y => ds.nutHalf + (ds.botHalf - ds.nutHalf) * (y - ds.nutY) / (ds.botY - ds.nutY);
    for (let n = 1; n <= 4; n++) {
      const y = ds.nutY + ds.scaleMm * (1 - Math.pow(2, -n / 12)) * ds.upm;
      if (y > ds.botY - 4) break;
      const hw = halfAt(y);
      g += '<rect x="' + r1(CX - hw) + '" y="' + r1(y + 1.4) + '" width="' + r1(2 * hw) + '" height="2" fill="rgba(0,0,0,.32)"/>';
      g += '<rect x="' + r1(CX - hw - 0.6) + '" y="' + r1(y - 1.7) + '" width="' + r1(2 * hw + 1.2) + '" height="3.4" rx="1.2" fill="url(#hsFret)"/>';
    }
    const L0 = CX - ds.nutHalf, L1 = CX - ds.botHalf, R0 = CX + ds.nutHalf, R1 = CX + ds.botHalf;
    if (ds.binding && ds.boardBinding !== false) {
      g += '<path d="M' + (L0 + 1.6) + ',' + ds.nutY + ' L' + (L1 + 1.6) + ',' + ds.botY + ' M' + (R0 - 1.6) + ',' + ds.nutY +
        ' L' + (R1 - 1.6) + ',' + ds.botY + '" stroke="#eadcb6" stroke-width="3.2"/>';
    }
    g += '<path d="M' + L0 + ',' + ds.nutY + ' L' + L1 + ',' + ds.botY + ' M' + R0 + ',' + ds.nutY + ' L' + R1 + ',' + ds.botY +
      '" stroke="' + ds.edge + '" stroke-width="1"/>';
    return g;
  }

  function headSvg(ds) {
    const [x0, y0, x1, y1] = ds.bbox, w = x1 - x0, h = y1 - y0;
    const O = ds.outline;
    let g = '<path d="' + O + '" fill="url(#hsF-' + ds.finish + ')"/>';
    g += '<g clip-path="url(#hsClip)">';
    if (ds.finish === 'maple') g += grain(3, x0 - 10, x1 + 10, y0, y1, 34, '#8f4f16', 0.05, 0.16, 0.5, 1.3, 1.6);
    if (ds.finish === 'koa') {
      g += grain(5, x0 - 10, x1 + 10, y0, y1, 30, '#3e1b06', 0.12, 0.34, 0.6, 1.8, 4);
      g += curl(6, x0 - 10, x1 + 10, y0, y1, 14);
    }
    if (ds.finish === 'cherry') {
      g += grain(7, x0 - 10, x1 + 10, y0, y1, 30, '#160201', 0.16, 0.38, 0.5, 1.5, 3);
      g += grain(8, x0 - 10, x1 + 10, y0, y1, 10, '#d0573a', 0.06, 0.12, 1, 2.4, 3);
    }
    // лак: потемнение к краям, мягкий общий блик и косой отсвет
    g += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="url(#hsVign)"/>';
    const gloss = { black: 1, maple: 0.6, koa: 0.7, cherry: 0.9 }[ds.finish];
    g += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="url(#hsGloss)" opacity="' + gloss + '"/>';
    g += '<path d="M' + r1(x0 + w * 0.12) + ',' + y1 + ' L' + r1(x0 + w * 0.3) + ',' + y1 + ' L' + r1(x1 - w * 0.02) + ',' + r1(y0 + h * 0.08) +
      ' L' + r1(x1 - w * 0.2) + ',' + r1(y0 + h * 0.08) + ' Z" fill="#fff" opacity="' + (ds.finish === 'black' ? 0.045 : 0.035) + '"/>';
    if (ds.binding) {
      // окантовка: слоновая кость / чёрная жилка / слоновая кость
      g += '<path d="' + O + '" fill="none" stroke="#e9dbb4" stroke-width="9.6"/>' +
        '<path d="' + O + '" fill="none" stroke="#141210" stroke-width="8.2"/>' +
        '<path d="' + O + '" fill="none" stroke="#efe3c2" stroke-width="6.6"/>' +
        '<path d="' + O + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" transform="translate(1.1,1.4)"/>';
    } else {
      // скруглённая кромка: тень внутри контура и тонкий блик сверху-слева
      g += '<path d="' + O + '" fill="none" stroke="' + ds.edge + '" stroke-opacity=".5" stroke-width="7"/>' +
        '<path d="' + O + '" fill="none" stroke="#fff3da" stroke-opacity=".3" stroke-width="1.6" transform="translate(1.6,1.8)"/>';
    }
    g += '</g>';
    g += '<path d="' + O + '" fill="none" stroke="' + ds.edge + '" stroke-width=".8"/>';
    return g;
  }

  // кубок-«корона» из перламутра (своя форма, не копия чужих инкрустаций)
  function crownSvg(x, y) {
    const t = 'translate(' + x + ',' + y + ')';
    const body = 'M0,-24 C2.6,-18 6,-13.5 5.4,-8 C9,-12.2 14,-14.4 19,-12.4 C15,-9 12.6,-3.6 11.6,1.6 L-11.6,1.6 ' +
      'C-12.6,-3.6 -15,-9 -19,-12.4 C-14,-14.4 -9,-12.2 -5.4,-8 C-6,-13.5 -2.6,-18 0,-24 Z';
    const band = 'M-12.6,3.6 L12.6,3.6 L11.4,8.6 L-11.4,8.6 Z';
    const foot = 'M-3,10.4 L3,10.4 L3.6,15.4 C7,16.4 8.6,18 8.6,20 L-8.6,20 C-8.6,18 -7,16.4 -3.6,15.4 Z';
    const p = d => '<path d="' + d + '"/>';
    return '<g transform="' + t + '">' +
      '<g fill="rgba(0,0,0,.55)" transform="translate(.7,1)">' + p(body) + p(band) + p(foot) + '</g>' +
      '<g fill="url(#hsMop)" stroke="rgba(255,255,255,.35)" stroke-width=".4">' + p(body) + p(band) + p(foot) + '</g>' +
      '<path d="M0,-17 L0,-2 M-11,-8 C-9,-6 -8,-3 -7.6,-0.6 M11,-8 C9,-6 8,-3 7.6,-0.6" stroke="rgba(120,140,170,.35)" stroke-width=".8" fill="none"/>' +
      '<circle cx="0" cy="6.1" r="1.5" fill="rgba(70,80,110,.35)"/></g>';
  }

  function trussSvg(ds) {
    const ny = ds.nutY, big = ds.button === 'clover';
    const hw = big ? 21 : 17.5, top = big ? 74 : 82, nw = big ? 7.5 : 6.5;
    // колокол: закруглённый верх, вогнутые бока, широкое основание; чёрный с белым скосом
    const d = 'M' + (CX - hw) + ',' + (ny - 10) + ' L' + (CX + hw) + ',' + (ny - 10) +
      ' C' + (CX + hw - 2) + ',' + (ny - 26) + ' ' + (CX + nw + 3) + ',' + (ny - top + 34) + ' ' + (CX + nw) + ',' + (ny - top + 14) +
      ' C' + (CX + nw - 0.6) + ',' + (ny - top + 4) + ' ' + (CX + 4) + ',' + (ny - top) + ' ' + CX + ',' + (ny - top) +
      ' C' + (CX - 4) + ',' + (ny - top) + ' ' + (CX - nw + 0.6) + ',' + (ny - top + 4) + ' ' + (CX - nw) + ',' + (ny - top + 14) +
      ' C' + (CX - nw - 3) + ',' + (ny - top + 34) + ' ' + (CX - hw + 2) + ',' + (ny - 26) + ' ' + (CX - hw) + ',' + (ny - 10) + ' Z';
    return '<path d="' + d + '" fill="rgba(0,0,0,.45)" transform="translate(1,1.6)"/>' +
      '<path d="' + d + '" fill="#0c0b0c" stroke="#efe6cf" stroke-width="1.8"/>' +
      '<circle cx="' + CX + '" cy="' + (ny - top + 9) + '" r="1.9" fill="url(#hsChromeR)"/>' +
      '<circle cx="' + CX + '" cy="' + (ny - 18) + '" r="1.9" fill="url(#hsChromeR)"/>';
  }

  function logoSvg(L) {
    const font = 'font-family="Yellowtail, \'Segoe Script\', cursive" font-size="' + L.size + '" text-anchor="middle"';
    const sub = (fill, op) => '<text x="' + (L.x + 3) + '" y="' + r1(L.y + L.size * 0.31) + '" text-anchor="middle" ' +
      'font-family="Georgia, \'Times New Roman\', serif" font-size="' + r1(L.size * 0.17) + '" letter-spacing="' + r1(L.size * 0.08) + '" ' +
      'fill="' + fill + '" opacity="' + op + '">TUNER</text>';
    let g = '<g transform="rotate(' + L.rot + ' ' + L.x + ' ' + L.y + ')">';
    if (L.kind === 'decal') {
      // деколь: золото с тонкой чёрной обводкой и едва заметная плёнка вокруг
      const fw = L.size * 2.7, fh = L.size * 1.15;
      g += '<rect x="' + r1(L.x - fw / 2) + '" y="' + r1(L.y - L.size * 0.78) + '" width="' + r1(fw) + '" height="' + r1(fh) + '" rx="5" ' +
        'fill="#fff6e0" fill-opacity=".035" stroke="#fff" stroke-opacity=".05" stroke-width=".6"/>' +
        '<text x="' + L.x + '" y="' + L.y + '" ' + font + ' fill="#f1cf78" stroke="#1a1006" stroke-width="1.7" paint-order="stroke" ' +
        'stroke-linejoin="round">Kolok</text>' + sub('#1a1006', 0.85);
    } else {
      // инкрустация / золотая надпись с тенью-углублением
      const fill = L.kind === 'gold' ? 'url(#hsGold)' : 'url(#hsMop)';
      g += '<text x="' + (L.x + 0.8) + '" y="' + (L.y + 1.1) + '" ' + font + ' fill="rgba(0,0,0,.55)">Kolok</text>' +
        '<text x="' + L.x + '" y="' + L.y + '" ' + font + ' fill="' + fill + '">Kolok</text>' +
        sub(L.kind === 'gold' ? '#e2bf6e' : '#e6dcc4', 0.8);
    }
    return g + '</g>';
  }

  function detailsSvg(ds) {
    let g = '';
    if (ds.truss === 'bell') g += trussSvg(ds);
    if (ds.inlay === 'crown') g += crownSvg(200, 352);
    if (ds.inlay === 'kite') {
      g += '<path d="M200,434 L205.6,447 L200,463 L194.4,447 Z" fill="rgba(0,0,0,.45)" transform="translate(.6,.9)"/>' +
        '<path d="M200,434 L205.6,447 L200,463 L194.4,447 Z" fill="url(#hsMop)" stroke="rgba(255,255,255,.3)" stroke-width=".4"/>' +
        '<path d="M200,438 L200,460" stroke="rgba(120,140,170,.3)" stroke-width=".7"/>';
    }
    if (ds.logo) g += logoSvg(ds.logo);
    return g;
  }

  function postSvg(s, ds) {
    const R = ds.bushR;
    let g = '<circle cx="' + r1(s.px + 1.2) + '" cy="' + r1(s.py + 2) + '" r="' + (R + 0.8) + '" fill="rgba(0,0,0,.42)"/>' +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + R + '" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.5)" stroke-width=".7"/>';
    if (ds.bush === 'press') {
      // запрессованная втулка: фаска и тёмный зазор вокруг шпильки
      g += '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + r1(R * 0.74) + '" fill="none" stroke="rgba(0,0,0,.28)" stroke-width=".9"/>';
    } else {
      g += '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + r1(R * 0.82) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>';
    }
    return g + '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + (ds.postR + 0.9) + '" fill="rgba(0,0,0,.35)"/>';
  }

  function nutSvg(ds, S) {
    const x = CX - ds.nutHalf - 1.5, w = 2 * ds.nutHalf + 3, y = ds.nutY - 8;
    let g = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="9.5" rx="2" fill="url(#hsBone)" stroke="rgba(60,40,15,.45)" stroke-width=".6"/>' +
      '<rect x="' + (x + 1) + '" y="' + (y + 0.6) + '" width="' + (w - 2) + '" height="1.6" rx=".8" fill="#fff" opacity=".55"/>';
    S.forEach(s => {
      g += '<rect x="' + r1(s.x0 - s.look.sw * 0.65) + '" y="' + y + '" width="' + r1(s.look.sw * 1.3) + '" height="3.4" fill="rgba(60,40,20,.45)"/>';
    });
    return g;
  }

  function stringSvg(s, ds) {
    const L = LOOK[s.look.kind], w = s.look.sw, pr = ds.postR;
    const d = 'M' + r1(s.xb) + ',' + (ds.botY + 6) + ' L' + r1(s.x0) + ',' + ds.nutY + ' L' + r1(s.tx) + ',' + s.py;
    const wr = r1(pr + w * 0.45);
    // шпилька Kluson «safety post»: прорезь и отверстие под конец струны
    const slot = ds.bush === 'press'
      ? '<path d="M' + r1(s.px - pr * 0.72) + ',' + s.py + ' L' + r1(s.px + pr * 0.72) + ',' + s.py + '" stroke="rgba(0,0,0,.55)" stroke-width="' + r1(pr * 0.26) + '"/>'
      : '';
    return '<g class="str" data-i="' + s.k + '">' +
      '<path d="' + d + '" transform="translate(1.6,2.4)" stroke="rgba(0,0,0,.4)" stroke-width="' + w + '" fill="none" stroke-linejoin="round"/>' +
      '<path class="glow" d="' + d + '" stroke-width="' + (w + 7) + '" fill="none" stroke-linejoin="round" filter="url(#hsBlur)"/>' +
      '<g class="body">' +
      '<path d="' + d + '" stroke="' + L.edge + '" stroke-width="' + r1(w + 0.8) + '" fill="none" stroke-linejoin="round"/>' +
      '<path d="' + d + '" stroke="' + L.body + '" stroke-width="' + w + '" fill="none" stroke-linejoin="round"/>' +
      (L.wind ? '<path d="' + d + '" stroke="' + L.wind + '" stroke-width="' + w + '" stroke-dasharray="0.7 1.1" opacity=".55" fill="none"/>' : '') +
      '<path d="' + d + '" stroke="' + L.hi + '" stroke-width="' + r1(w * 0.32) + '" opacity="' + L.hiOp + '" fill="none" ' +
      'stroke-linejoin="round" transform="translate(' + r1(-w * 0.18) + ',0)"/>' +
      '</g>' +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + wr + '" fill="none" stroke="' + L.edge + '" stroke-width="' + r1(w + 0.6) + '"/>' +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + wr + '" fill="none" stroke="' + L.body + '" stroke-width="' + r1(w * 0.8) + '"/>' +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + pr + '" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.6)" stroke-width=".6"/>' +
      slot +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + r1(pr * 0.3) + '" fill="#26231f"/>' +
      '</g>';
  }

  // точка струны на высоте y (между порожком и колком)
  const xAt = (s, ds, y) => s.x0 + (s.tx - s.x0) * (ds.nutY - y) / (ds.nutY - s.py);

  function treesSvg(ds, S) {
    return ds.trees.map(t => {
      const xs = t.idx.map(k => xAt(S[k], ds, t.y)), y = t.y;
      const screw = xc => '<circle cx="' + r1(xc) + '" cy="' + y + '" r="2.3" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.6)" stroke-width=".5"/>' +
        '<path d="M' + r1(xc - 1.5) + ',' + (y - 0.9) + ' L' + r1(xc + 1.5) + ',' + (y + 0.9) + '" stroke="rgba(0,0,0,.6)" stroke-width=".7"/>';
      if (t.kind === 'button') {
        // круглая скоба-«пуговица» басов 50-х
        const xc = xs[0] + 1;
        return '<circle cx="' + r1(xc + 1.2) + '" cy="' + (y + 1.8) + '" r="6.4" fill="rgba(0,0,0,.42)"/>' +
          '<circle cx="' + r1(xc) + '" cy="' + y + '" r="6.2" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.55)" stroke-width=".6"/>' +
          '<circle cx="' + r1(xc) + '" cy="' + y + '" r="4.4" fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".8"/>' + screw(xc);
      }
      // скоба-«бабочка»: два крыла над струнами и перемычка с винтом посередине
      const xa = Math.min(...xs) - 2.5, xb = Math.max(...xs) + 2.5, xm = (xa + xb) / 2, R = 4.6;
      const d = 'M' + r1(xa) + ',' + (y - R) + ' C' + r1(xa + 3) + ',' + (y - R) + ' ' + r1(xm - 4) + ',' + (y - 3) + ' ' + r1(xm) + ',' + (y - 3) +
        ' C' + r1(xm + 4) + ',' + (y - 3) + ' ' + r1(xb - 3) + ',' + (y - R) + ' ' + r1(xb) + ',' + (y - R) +
        ' A' + R + ',' + R + ' 0 0 1 ' + r1(xb) + ',' + (y + R) +
        ' C' + r1(xb - 3) + ',' + (y + R) + ' ' + r1(xm + 4) + ',' + (y + 3) + ' ' + r1(xm) + ',' + (y + 3) +
        ' C' + r1(xm - 4) + ',' + (y + 3) + ' ' + r1(xa + 3) + ',' + (y + R) + ' ' + r1(xa) + ',' + (y + R) +
        ' A' + R + ',' + R + ' 0 0 1 ' + r1(xa) + ',' + (y - R) + ' Z';
      return '<path d="' + d + '" fill="rgba(0,0,0,.42)" transform="translate(1.2,1.8)"/>' +
        '<path d="' + d + '" fill="url(#hsChrome)" stroke="rgba(0,0,0,.55)" stroke-width=".6"/>' + screw(xm);
    }).join('');
  }

  // стрелки вокруг шпильки: cw — по часовой (как видно спереди), ccw — против
  function turnSvg(s, ds) {
    const R = ds.bushR + 6.5, ac = s.side < 0 ? 180 : 0, span = 125;
    const pt = deg => [s.px + R * Math.cos(deg * Math.PI / 180), s.py + R * Math.sin(deg * Math.PI / 180)];
    const mk = (from, to, sweep) => {
      const [x0, y0] = pt(from), [x1, y1] = pt(to), th = to * Math.PI / 180;
      const t = sweep ? [-Math.sin(th), Math.cos(th)] : [Math.sin(th), -Math.cos(th)];
      const n = [Math.cos(th), Math.sin(th)];
      const tip = [x1 + t[0] * 6.5, y1 + t[1] * 6.5];
      const b1 = [x1 + n[0] * 4.8 - t[0], y1 + n[1] * 4.8 - t[1]], b2 = [x1 - n[0] * 4.8 - t[0], y1 - n[1] * 4.8 - t[1]];
      return '<path class="arc" d="M' + r1(x0) + ',' + r1(y0) + ' A' + R + ',' + R + ' 0 1 ' + sweep + ' ' + r1(x1) + ',' + r1(y1) + '"/>' +
        '<path class="head" d="M' + r1(tip[0]) + ',' + r1(tip[1]) + ' L' + r1(b1[0]) + ',' + r1(b1[1]) + ' L' + r1(b2[0]) + ',' + r1(b2[1]) + ' Z"/>';
    };
    return '<g class="turn" data-i="' + s.k + '" data-side="' + s.side + '">' +
      '<g class="cw">' + mk(ac - span, ac + span, 1) + '</g>' +
      '<g class="ccw">' + mk(ac + span, ac - span, 0) + '</g></g>';
  }

  function labelSvg(s, B) {
    const tip = r1(s.bx + s.side * (B.reach * B.k + 9)), L = s.lab, w = 64;
    return '<g class="lbl" data-i="' + s.k + '" data-tip="' + tip + '" data-side="' + s.side + '" data-y="' + s.py + '" ' +
      'transform="translate(' + (s.side < 0 ? tip - w : tip) + ',' + s.py + ')">' +
      '<rect class="pill" x="0" y="-14" width="' + w + '" height="28" rx="14"/>' +
      '<circle class="nb" cx="14" cy="0" r="10"/>' +
      '<text class="num" x="14" y="4" text-anchor="middle">' + s.num + '</text>' +
      '<text class="nt" x="29" y="5.5"><tspan class="nn">' + L.name + L.acc + '</tspan><tspan class="no" dy="3.5">' + L.octave + '</tspan></text>' +
      '</g>';
  }

  function designKey(instrument, layout) {
    const k = instrument + '-' + layout;
    return DESIGNS[k] ? k : instrument + '-split';
  }

  /* o = { instrument, layout, labels: [{name, acc, octave}], looks: [{sw, kind}] } — всё в физическом порядке струн */
  function build(o) {
    const key = designKey(o.instrument, o.layout), ds = DESIGNS[key], N = ds.posts.length;
    const B = Object.assign({ k: ds.btnScale || 1 }, BUTTONS[ds.button]);   // k — во сколько раз крупнее рисовать колки (у баса голова больше)
    const nutL = CX - ds.nutHalf, span = 2 * (ds.nutHalf - ds.nutMargin);
    const S = ds.posts.map((p, k) => {
      const [px, py, side, bx] = p, x0 = nutL + ds.nutMargin + span * k / (N - 1);
      return {
        k, px, py, side, bx, x0, num: N - k, look: o.looks[k], lab: o.labels[k],
        xb: CX + (x0 - CX) * ds.botHalf / ds.nutHalf, tx: px - side * ds.postR
      };
    });
    const board = 'M' + (CX - ds.nutHalf) + ',' + ds.nutY + ' L' + (CX + ds.nutHalf) + ',' + ds.nutY + ' L' + (CX + ds.botHalf) + ',' + ds.botY +
      ' L' + (CX - ds.botHalf) + ',' + ds.botY + ' Z';
    const shadowBtn = s => '<ellipse cx="' + r1(s.bx + s.side * B.center * B.k) + '" cy="' + s.py + '" rx="' + r1(B.rx * B.k) + '" ry="' + r1(B.ry * B.k) + '"/>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + ds.view.join(' ') + '" class="hs-svg" data-design="' + key + '" ' +
      'role="img" aria-label="Голова грифа: нажмите на колок, чтобы выбрать струну">' +
      defs(ds, board) +
      '<g class="content">' +
      '<g class="shadow" filter="url(#hsShadow)" transform="translate(5,11)" fill="#1e1006"><path d="' + ds.outline + '"/><path d="' + board + '"/>' +
      S.map(shadowBtn).join('') + '</g>' +
      S.map(s => pegSvg(s, B)).join('') +
      boardSvg(ds, board) +
      headSvg(ds) +
      detailsSvg(ds) +
      S.map(s => postSvg(s, ds)).join('') +
      nutSvg(ds, S) +
      S.map(s => stringSvg(s, ds)).join('') +
      treesSvg(ds, S) +
      S.map(s => turnSvg(s, ds)).join('') +
      S.map(s => labelSvg(s, B)).join('') +
      '</g></svg>';
  }

  // подогнать ширину подписей под текст и рамку рисунка под содержимое (вызывать, когда SVG виден)
  function layout(svg) {
    svg.querySelectorAll('.lbl').forEach(g => {
      const t = g.querySelector('.nt');
      const w = Math.ceil(29 + t.getComputedTextLength() + 12);
      g.querySelector('.pill').setAttribute('width', w);
      const tip = +g.dataset.tip, side = +g.dataset.side;
      g.setAttribute('transform', 'translate(' + (side < 0 ? tip - w : tip) + ',' + g.dataset.y + ')');
    });
    const bb = svg.querySelector('.content').getBBox();
    if (bb.width > 0) {
      const pad = 12;
      svg.setAttribute('viewBox', [r1(bb.x - pad), r1(bb.y - pad), r1(bb.width + 2 * pad), r1(bb.height + pad)].join(' '));
    }
  }

  /* states[i] = { tuned, active, ok, target, turn: 'tighten' | 'loosen' | null } */
  function apply(svg, states) {
    if (!svg) return;
    states.forEach((st, i) => {
      svg.querySelectorAll('[data-i="' + i + '"]').forEach(el => {
        const c = el.classList;
        c.toggle('tuned', !!st.tuned);
        c.toggle('active', !!st.active);
        c.toggle('ok', !!st.ok);
        c.toggle('target', !!st.target);
        if (c.contains('turn')) {
          // струна навита с внутренней стороны шпильки: слева подтягивают против часовой, справа — по часовой
          const left = +el.dataset.side < 0;
          const dir = st.turn === 'tighten' ? (left ? 'ccw' : 'cw') : st.turn === 'loosen' ? (left ? 'cw' : 'ccw') : '';
          c.toggle('cw', dir === 'cw');
          c.toggle('ccw', dir === 'ccw');
        }
      });
    });
  }

  function ping(svg, i) {
    if (!svg) return;
    svg.querySelectorAll('.peg[data-i="' + i + '"], .lbl[data-i="' + i + '"]').forEach(el => {
      el.classList.remove('ping-on');
      void el.getBBox();
      el.classList.add('ping-on');
      setTimeout(() => el.classList.remove('ping-on'), 1100);
    });
  }

  root.Headstock = { build, layout, apply, ping, designKey };
})(window);

/* Колок — голова грифа: рисованный SVG с колками, струнами и подписями нот.
   Все формы строятся в одной системе координат: ось грифа x = 200, верхний порожек y = nutY,
   голова уходит вверх. Колки перечислены в физическом порядке струн слева направо
   (от самой толстой к самой тонкой), side = −1 — колок слева, +1 — справа. */
(function (root) {
  'use strict';

  const CX = 200;
  const r1 = v => Math.round(v * 10) / 10;

  const DESIGNS = {
    'guitar-split': {
      view: [-40, 222, 480, 510], nutY: 560, nutHalf: 46, botHalf: 48.5, botY: 726, nutMargin: 6,
      scaleMm: 628, upm: 2.14,
      outline: 'M154,560 C140,552 116,540 110,512 C106,470 100,330 98,278 C97,268 99,262 104,258 ' +
        'C124,236 166,226 184,238 C192,243 197,249 200,252 C203,249 208,243 216,238 C234,226 276,236 296,258 ' +
        'C301,262 303,268 302,278 C300,330 294,470 290,512 C284,540 260,552 246,560 Z',
      bbox: [92, 222, 308, 562],
      finish: 'black', binding: true, board: 'rosewood',
      posts: [[140, 505, -1, 110], [134, 410, -1, 104], [129, 315, -1, 100],
        [271, 315, 1, 300], [266, 410, 1, 296], [260, 505, 1, 290]],
      postR: 4.6, bushR: 9.5, button: 'oval', hex: true,
      truss: 'bell', inlay: 'diamond',
      logo: { x: 200, y: 300, size: 40, rot: -4, fill: 'url(#hsGold)', sub: '#cfa94f' },
      trees: []
    },
    'guitar-inline': {
      view: [-40, 96, 360, 636], nutY: 560, nutHalf: 46, botHalf: 48.5, botY: 726, nutMargin: 6,
      scaleMm: 648, upm: 2.14,
      outline: 'M246,560 C250,542 258,522 262,506 C268,486 262,458 250,430 C238,402 232,362 236,322 ' +
        'C240,282 278,262 286,216 C294,170 268,122 222,112 C178,104 130,120 118,162 L120,500 ' +
        'C121,530 138,550 154,560 Z',
      bbox: [112, 100, 296, 562],
      finish: 'maple', board: 'maple',
      posts: [[150, 505, -1, 120], [148, 449, -1, 119.6], [146, 393, -1, 119.2],
        [144, 337, -1, 118.9], [142, 281, -1, 118.5], [140, 225, -1, 118.2]],
      postR: 4.6, bushR: 9.5, button: 'oval', hex: true,
      truss: 'bullet',
      logo: { x: 214, y: 174, size: 38, rot: -9, fill: '#151515', sub: '#151515' },
      trees: [{ idx: [4, 5], y: 372 }]
    },
    'bass-split': {
      view: [-50, 284, 500, 434], nutY: 560, nutHalf: 46, botHalf: 48, botY: 712, nutMargin: 8,
      scaleMm: 864, upm: 2.14,
      outline: 'M154,560 C138,552 112,540 106,510 C100,470 96,380 96,340 C96,322 104,310 120,304 ' +
        'C150,292 180,290 200,296 C220,290 250,292 280,304 C296,310 304,322 304,340 C304,380 300,470 294,510 ' +
        'C288,540 262,552 246,560 Z',
      bbox: [92, 288, 308, 562],
      finish: 'cherry', board: 'rosewood',
      posts: [[138, 500, -1, 106], [130, 385, -1, 98], [270, 385, 1, 302], [262, 500, 1, 294]],
      postR: 7, bushR: 12.5, button: 'clover', hex: true,
      truss: 'bell',
      logo: { x: 200, y: 345, size: 36, rot: 0, fill: 'url(#hsGold)', sub: '#cfa94f' },
      trees: []
    },
    'bass-inline': {
      view: [-50, 140, 370, 578], nutY: 560, nutHalf: 46, botHalf: 48, botY: 712, nutMargin: 8,
      scaleMm: 864, upm: 2.14,
      outline: 'M246,560 C252,540 262,522 266,505 C272,484 266,456 254,428 C242,400 236,368 240,334 ' +
        'C244,300 288,282 294,246 C300,200 272,160 226,154 C182,148 132,160 118,200 L120,500 ' +
        'C121,530 138,550 154,560 Z',
      bbox: [112, 146, 300, 562],
      finish: 'maple', board: 'maple',
      posts: [[150, 505, -1, 120], [147, 432, -1, 119.5], [144, 359, -1, 119], [141, 286, -1, 118.5]],
      postR: 7, bushR: 12.5, button: 'clover', hex: true,
      truss: 'bullet',
      logo: { x: 220, y: 212, size: 36, rot: -9, fill: '#151515', sub: '#151515' },
      trees: [{ idx: [3], y: 400 }]
    },
    'ukulele-split': {
      view: [-10, 286, 420, 430], nutY: 560, nutHalf: 40, botHalf: 42, botY: 712, nutMargin: 7,
      scaleMm: 380, upm: 2.29,
      outline: 'M160,560 C148,552 122,545 117,516 C112,482 110,402 112,362 C113,338 124,322 146,318 ' +
        'C168,314 186,306 200,294 C214,306 232,314 254,318 C276,322 287,338 288,362 C290,402 288,482 283,516 ' +
        'C278,545 252,552 240,560 Z',
      bbox: [108, 290, 292, 562],
      finish: 'koa', board: 'rosewood',
      posts: [[142, 495, -1, 114], [138, 395, -1, 111], [262, 395, 1, 289], [258, 495, 1, 286]],
      postR: 4.6, bushR: 9.5, button: 'pearl', hex: false,
      inlay: 'dot',
      logo: { x: 200, y: 352, size: 30, rot: 0, fill: 'url(#hsMop)', sub: '#f3dfbd' },
      trees: []
    }
  };

  // ---- кнопки колков: рисуются «наружу» по +x, центр головки кнопки — (center, 0) ----
  const BUTTONS = {
    oval: {
      reach: 53, center: 35, halo: 30, rx: 19, ry: 12,
      draw: () =>
        '<rect x="-8" y="-3" width="22" height="6" rx="1.5" fill="url(#hsShaft)"/>' +
        '<rect x="12" y="-5.5" width="5.5" height="11" rx="1.6" fill="url(#hsChrome)" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>' +
        '<path class="face" d="M16,-6 C16,-11 22,-12 34,-12 C47,-12 53,-8 53,0 C53,8 47,12 34,12 C22,12 16,11 16,6 Z" ' +
        'stroke="rgba(0,0,0,.45)" stroke-width=".6"/>' +
        '<path d="M21,-7 C24,-10 30,-10.2 36,-10.2 C44,-10.2 49,-8 50,-5 C44,-6.5 30,-6.8 21,-7 Z" fill="#fff" opacity=".6"/>' +
        '<path d="M22,8.2 C30,10.2 43,10.2 50,5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>'
    },
    pearl: {
      reach: 50, center: 33, halo: 30, rx: 17.5, ry: 14,
      draw: () =>
        '<rect x="-6" y="-2.9" width="21" height="5.8" rx="1.5" fill="url(#hsShaft)"/>' +
        '<rect x="12" y="-5.8" width="5.5" height="11.6" rx="1.8" fill="url(#hsChrome)" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>' +
        '<ellipse class="face" cx="33" cy="0" rx="17" ry="13.5" stroke="rgba(0,0,0,.38)" stroke-width=".7"/>' +
        '<ellipse cx="33" cy="0.6" rx="13.2" ry="10.2" fill="none" stroke="rgba(120,100,70,.18)" stroke-width="1"/>' +
        '<ellipse cx="31" cy="-5.6" rx="10" ry="3.6" fill="#fff" opacity=".65"/>' +
        '<path d="M21,7.5 C27,11.5 39,11.5 45,7.5" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>'
    },
    clover: {
      reach: 66, center: 43, halo: 36, rx: 23, ry: 21,
      draw: () =>
        '<rect x="-8" y="-4" width="25" height="8" rx="2" fill="url(#hsShaft)"/>' +
        '<rect x="14" y="-7" width="6.5" height="14" rx="2" fill="url(#hsChrome)" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>' +
        '<g class="clover" stroke="rgba(0,0,0,.4)" stroke-width=".6">' +
        '<circle class="face" cx="31" cy="0" r="11"/><circle class="face" cx="43" cy="-10.5" r="11"/>' +
        '<circle class="face" cx="43" cy="10.5" r="11"/><circle class="face" cx="55" cy="0" r="11"/></g>' +
        '<circle class="face" cx="43" cy="0" r="10.5"/>' +
        '<circle cx="43" cy="0" r="4.2" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/>' +
        '<ellipse cx="42" cy="-15" rx="6.5" ry="2.4" fill="#fff" opacity=".55"/>' +
        '<ellipse cx="30" cy="-4" rx="4.5" ry="2" fill="#fff" opacity=".45"/>'
    }
  };

  // ---- материалы струн ----
  const LOOK = {
    plain: { edge: '#4b5159', body: '#d8dce1', hi: '#ffffff', hiOp: 0.85 },
    wound: { edge: '#3b372f', body: '#b7af9c', hi: '#f4efe3', hiOp: 0.5, wind: '#4a453b' },
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
      for (let y = y0 + 12; y <= y1 + 12; y += 12) d += 'L' + r1(x + a * Math.sin(y * fr + ph) + (y - y0) * drift) + ',' + y;
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
      const y = y0 + (y1 - y0) * (i + r()) / n, h = 3 + r() * 8, ph = r() * 6.28;
      let d = 'M' + x0 + ',' + r1(y);
      for (let x = x0 + 10; x <= x1 + 10; x += 10) d += 'L' + x + ',' + r1(y + 3 * Math.sin(x * 0.05 + ph));
      out += '<path d="' + d + '" stroke="#ffe2b0" stroke-opacity="' + (0.04 + r() * 0.07).toFixed(2) +
        '" stroke-width="' + r1(h) + '" fill="none"/>';
    }
    return out;
  }

  function defs(ds, board) {
    return '<defs>' +
      '<linearGradient id="hsChrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/>' +
      '<stop offset=".22" stop-color="#cfd4db"/><stop offset=".5" stop-color="#7d8692"/><stop offset=".62" stop-color="#e6eaef"/>' +
      '<stop offset=".85" stop-color="#a1a9b3"/><stop offset="1" stop-color="#5b636d"/></linearGradient>' +
      '<linearGradient id="hsShaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f97a1"/>' +
      '<stop offset=".35" stop-color="#eef1f4"/><stop offset="1" stop-color="#5f6771"/></linearGradient>' +
      '<radialGradient id="hsChromeR" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/>' +
      '<stop offset=".28" stop-color="#dfe3e8"/><stop offset=".7" stop-color="#8c95a0"/><stop offset="1" stop-color="#4a515a"/></radialGradient>' +
      '<linearGradient id="hsGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3fde9"/>' +
      '<stop offset=".3" stop-color="#6ee79c"/><stop offset=".68" stop-color="#16a34a"/><stop offset="1" stop-color="#0b4f27"/></linearGradient>' +
      '<linearGradient id="hsAmber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d1"/>' +
      '<stop offset=".3" stop-color="#fcd34d"/><stop offset=".7" stop-color="#d97706"/><stop offset="1" stop-color="#6b3500"/></linearGradient>' +
      '<linearGradient id="hsPearl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf8"/>' +
      '<stop offset=".35" stop-color="#efe6d6"/><stop offset=".55" stop-color="#e3eef0"/><stop offset=".75" stop-color="#f6e6ee"/>' +
      '<stop offset="1" stop-color="#d9cfbb"/></linearGradient>' +
      '<linearGradient id="hsBone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7ec"/>' +
      '<stop offset=".55" stop-color="#ebe2cc"/><stop offset="1" stop-color="#c9bb99"/></linearGradient>' +
      '<linearGradient id="hsGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/>' +
      '<stop offset=".45" stop-color="#f0c75a"/><stop offset=".8" stop-color="#ad7a1b"/><stop offset="1" stop-color="#ffe49a"/></linearGradient>' +
      '<linearGradient id="hsMop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfaff"/>' +
      '<stop offset=".25" stop-color="#d4eaff"/><stop offset=".5" stop-color="#fde4f0"/><stop offset=".75" stop-color="#dcffee"/>' +
      '<stop offset="1" stop-color="#f3eeff"/></linearGradient>' +
      '<linearGradient id="hsFret" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f8fa"/>' +
      '<stop offset=".45" stop-color="#b4bac2"/><stop offset="1" stop-color="#5d646d"/></linearGradient>' +
      '<radialGradient id="hsHaloA"><stop offset="0" stop-color="#fbbf24" stop-opacity=".6"/>' +
      '<stop offset=".55" stop-color="#f59e0b" stop-opacity=".22"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="hsHaloG"><stop offset="0" stop-color="#4ade80" stop-opacity=".65"/>' +
      '<stop offset=".55" stop-color="#22c55e" stop-opacity=".25"/><stop offset="1" stop-color="#22c55e" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hsGloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/>' +
      '<stop offset=".3" stop-color="#fff" stop-opacity=".07"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hsF-black" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17171a"/>' +
      '<stop offset=".42" stop-color="#2d2d33"/><stop offset=".6" stop-color="#1e1e22"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient>' +
      '<linearGradient id="hsF-maple" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cf9449"/>' +
      '<stop offset=".3" stop-color="#ebbd76"/><stop offset=".55" stop-color="#f4d29a"/><stop offset=".8" stop-color="#e6b46d"/>' +
      '<stop offset="1" stop-color="#c4873e"/></linearGradient>' +
      '<linearGradient id="hsF-koa" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#743a14"/>' +
      '<stop offset=".25" stop-color="#b46c2c"/><stop offset=".5" stop-color="#d4934b"/><stop offset=".75" stop-color="#a65c23"/>' +
      '<stop offset="1" stop-color="#683310"/></linearGradient>' +
      '<linearGradient id="hsF-cherry" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a0705"/>' +
      '<stop offset=".3" stop-color="#5e150c"/><stop offset=".52" stop-color="#832614"/><stop offset=".75" stop-color="#5a130b"/>' +
      '<stop offset="1" stop-color="#230504"/></linearGradient>' +
      '<linearGradient id="hsB-rosewood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22120a"/>' +
      '<stop offset=".5" stop-color="#3a2216"/><stop offset="1" stop-color="#1f1009"/></linearGradient>' +
      '<linearGradient id="hsB-maple" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d69d55"/>' +
      '<stop offset=".5" stop-color="#f0c985"/><stop offset="1" stop-color="#d19851"/></linearGradient>' +
      '<filter id="hsShadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>' +
      '<filter id="hsBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>' +
      '<clipPath id="hsClip"><path d="' + ds.outline + '"/></clipPath>' +
      '<clipPath id="hsBoardClip"><path d="' + board + '"/></clipPath>' +
      '</defs>';
  }

  function pegSvg(s, B) {
    return '<g class="peg" data-i="' + s.k + '" transform="translate(' + s.bx + ',' + s.py + ') scale(' + s.side + ',1)">' +
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
      g += grain(11, CX - 52, CX + 52, ds.nutY, ds.botY, 30, '#0b0503', 0.3, 0.65, 0.6, 1.7, 1.4);
      g += grain(12, CX - 52, CX + 52, ds.nutY, ds.botY, 12, '#7a5038', 0.08, 0.2, 0.5, 1.2, 1.2);
    } else {
      g += grain(13, CX - 52, CX + 52, ds.nutY, ds.botY, 22, '#a7672a', 0.08, 0.22, 0.5, 1.2, 1.2);
    }
    g += '</g>';
    const halfAt = y => ds.nutHalf + (ds.botHalf - ds.nutHalf) * (y - ds.nutY) / (ds.botY - ds.nutY);
    for (let n = 1; n <= 4; n++) {
      const y = ds.nutY + ds.scaleMm * (1 - Math.pow(2, -n / 12)) * ds.upm;
      if (y > ds.botY - 4) break;
      const hw = halfAt(y);
      g += '<rect x="' + r1(CX - hw) + '" y="' + r1(y + 1.6) + '" width="' + r1(2 * hw) + '" height="2.2" fill="rgba(0,0,0,.35)"/>';
      g += '<rect x="' + r1(CX - hw - 0.6) + '" y="' + r1(y - 1.9) + '" width="' + r1(2 * hw + 1.2) + '" height="3.8" rx="1.3" fill="url(#hsFret)"/>';
    }
    const L0 = CX - ds.nutHalf, L1 = CX - ds.botHalf, R0 = CX + ds.nutHalf, R1 = CX + ds.botHalf;
    if (ds.binding) {
      g += '<path d="M' + (L0 + 1.5) + ',' + ds.nutY + ' L' + (L1 + 1.5) + ',' + ds.botY + ' M' + (R0 - 1.5) + ',' + ds.nutY +
        ' L' + (R1 - 1.5) + ',' + ds.botY + '" stroke="#efe5cc" stroke-width="3"/>';
    }
    g += '<path d="M' + L0 + ',' + ds.nutY + ' L' + L1 + ',' + ds.botY + ' M' + R0 + ',' + ds.nutY + ' L' + R1 + ',' + ds.botY +
      '" stroke="rgba(0,0,0,.45)" stroke-width="1"/>';
    return g;
  }

  function headSvg(ds) {
    const [x0, y0, x1, y1] = ds.bbox;
    let g = '<path d="' + ds.outline + '" fill="url(#hsF-' + ds.finish + ')"/>';
    g += '<g clip-path="url(#hsClip)">';
    if (ds.finish === 'maple') g += grain(3, x0 - 10, x1 + 10, y0, y1, 48, '#93561e', 0.06, 0.22, 0.5, 1.5, 3);
    if (ds.finish === 'koa') {
      g += grain(5, x0 - 10, x1 + 10, y0, y1, 40, '#3e1b06', 0.14, 0.42, 0.6, 2, 5);
      g += curl(6, x0 - 10, x1 + 10, y0, y1, 18);
    }
    if (ds.finish === 'cherry') g += grain(7, x0 - 10, x1 + 10, y0, y1, 42, '#150201', 0.18, 0.45, 0.5, 1.6, 4);
    const gloss = { black: 1, maple: 0.55, koa: 0.6, cherry: 0.85 }[ds.finish];
    g += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="url(#hsGloss)" opacity="' + gloss + '"/>';
    // косой блик лака
    g += '<path d="M' + (x0 + 30) + ',' + (y1 - 40) + ' L' + (x0 + 70) + ',' + (y1 - 40) + ' L' + (x1 - 10) + ',' + y0 +
      ' L' + (x1 - 50) + ',' + y0 + ' Z" fill="#fff" opacity="' + (ds.finish === 'black' ? 0.05 : 0.04) + '"/>';
    if (ds.binding) {
      g += '<path d="' + ds.outline + '" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="9.5"/>';
      g += '<path d="' + ds.outline + '" fill="none" stroke="#eee4ca" stroke-width="7.5"/>';
    } else {
      const edge = { maple: 'rgba(120,58,8,.4)', koa: 'rgba(40,14,2,.5)', cherry: 'rgba(0,0,0,.5)' }[ds.finish];
      g += '<path d="' + ds.outline + '" fill="none" stroke="' + edge + '" stroke-width="6"/>';
    }
    g += '</g>';
    g += '<path d="' + ds.outline + '" fill="none" stroke="rgba(0,0,0,.7)" stroke-width="1"/>';
    return g;
  }

  function detailsSvg(ds) {
    let g = '';
    const ny = ds.nutY;
    if (ds.truss === 'bell') {
      g += '<path d="M183,' + (ny - 11) + ' L217,' + (ny - 11) + ' C215,' + (ny - 30) + ' 211,' + (ny - 48) + ' 209,' + (ny - 66) +
        ' C208,' + (ny - 76) + ' 205,' + (ny - 82) + ' 200,' + (ny - 82) + ' C195,' + (ny - 82) + ' 192,' + (ny - 76) + ' 191,' + (ny - 66) +
        ' C189,' + (ny - 48) + ' 185,' + (ny - 30) + ' 183,' + (ny - 11) + ' Z" fill="#0d0d0f" stroke="#ece3cb" stroke-width="1.6"/>';
      g += '<circle cx="200" cy="' + (ny - 73) + '" r="2" fill="url(#hsChromeR)"/><circle cx="200" cy="' + (ny - 19) + '" r="2" fill="url(#hsChromeR)"/>';
    }
    if (ds.truss === 'bullet') {
      g += '<circle cx="200" cy="' + (ny - 15) + '" r="6.5" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.55)" stroke-width=".6"/>' +
        '<path d="M197.4,' + (ny - 16.5) + ' L200,' + (ny - 18) + ' L202.6,' + (ny - 16.5) + ' L202.6,' + (ny - 13.5) +
        ' L200,' + (ny - 12) + ' L197.4,' + (ny - 13.5) + ' Z" fill="#2a2a2a"/>';
    }
    if (ds.inlay === 'diamond') {
      g += '<path d="M200,334 L213,352 L200,370 L187,352 Z" fill="url(#hsMop)" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>';
    }
    if (ds.inlay === 'dot') {
      g += '<circle cx="200" cy="384" r="4" fill="url(#hsMop)" stroke="rgba(0,0,0,.3)" stroke-width=".5"/>';
    }
    if (ds.logo) {
      const L = ds.logo;
      g += '<g transform="rotate(' + L.rot + ' ' + L.x + ' ' + L.y + ')">' +
        '<text x="' + L.x + '" y="' + L.y + '" text-anchor="middle" font-family="Yellowtail, \'Segoe Script\', cursive" font-size="' + L.size +
        '" fill="' + L.fill + '">Kolok</text>' +
        '<text x="' + (L.x + 4) + '" y="' + (L.y + 12) + '" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="700" font-size="6.5" ' +
        'letter-spacing="2.8" fill="' + L.sub + '" opacity=".85">TUNER</text></g>';
    }
    return g;
  }

  function postSvg(s, ds) {
    let hex = '';
    if (ds.hex) {
      const r = ds.bushR * 0.8;
      let d = '';
      for (let a = 0; a < 6; a++) {
        const t = Math.PI / 6 + a * Math.PI / 3;
        d += (a ? 'L' : 'M') + r1(s.px + r * Math.cos(t)) + ',' + r1(s.py + r * Math.sin(t));
      }
      hex = '<path d="' + d + 'Z" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.45)" stroke-width=".7"/>';
    }
    return '<circle cx="' + (s.px + 1.4) + '" cy="' + (s.py + 2.2) + '" r="' + (ds.bushR + 0.8) + '" fill="rgba(0,0,0,.45)"/>' +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + ds.bushR + '" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.55)" stroke-width=".7"/>' +
      hex +
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + ds.postR + '" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.6)" stroke-width=".6"/>';
  }

  function nutSvg(ds, S) {
    const x = CX - ds.nutHalf - 1.5, w = 2 * ds.nutHalf + 3, y = ds.nutY - 8;
    let g = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="9.5" rx="2" fill="url(#hsBone)" stroke="rgba(0,0,0,.4)" stroke-width=".6"/>' +
      '<rect x="' + (x + 1) + '" y="' + (y + 0.6) + '" width="' + (w - 2) + '" height="1.6" rx=".8" fill="#fff" opacity=".55"/>';
    S.forEach(s => {
      g += '<rect x="' + r1(s.x0 - s.look.sw * 0.65) + '" y="' + y + '" width="' + r1(s.look.sw * 1.3) + '" height="3.4" fill="rgba(60,40,20,.45)"/>';
    });
    return g;
  }

  function stringSvg(s, ds) {
    const L = LOOK[s.look.kind], w = s.look.sw;
    const d = 'M' + r1(s.xb) + ',' + (ds.botY + 6) + ' L' + r1(s.x0) + ',' + ds.nutY + ' L' + r1(s.tx) + ',' + s.py;
    const wr = r1(ds.postR + w * 0.45);
    return '<g class="str" data-i="' + s.k + '">' +
      '<path d="' + d + '" transform="translate(1.6,2.4)" stroke="rgba(0,0,0,.42)" stroke-width="' + w + '" fill="none" stroke-linejoin="round"/>' +
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
      '<circle cx="' + s.px + '" cy="' + s.py + '" r="' + ds.postR + '" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.6)" stroke-width=".6"/>' +
      '</g>';
  }

  // точка струны на высоте y (между порожком и колком)
  const xAt = (s, ds, y) => s.x0 + (s.tx - s.x0) * (ds.nutY - y) / (ds.nutY - s.py);

  function treesSvg(ds, S) {
    return ds.trees.map(t => {
      const xs = t.idx.map(k => xAt(S[k], ds, t.y));
      const xc = xs.reduce((a, b) => a + b, 0) / xs.length;
      const w = Math.max(...xs) - Math.min(...xs) + 16;
      return '<rect x="' + r1(xc - w / 2 + 1.4) + '" y="' + (t.y - 1.5) + '" width="' + r1(w) + '" height="7" rx="3.5" fill="rgba(0,0,0,.4)"/>' +
        '<rect x="' + r1(xc - w / 2) + '" y="' + (t.y - 3.5) + '" width="' + r1(w) + '" height="7" rx="3.5" fill="url(#hsChrome)" stroke="rgba(0,0,0,.5)" stroke-width=".6"/>' +
        '<circle cx="' + r1(xc) + '" cy="' + t.y + '" r="2.4" fill="url(#hsChromeR)" stroke="rgba(0,0,0,.6)" stroke-width=".5"/>' +
        '<path d="M' + r1(xc - 1.6) + ',' + t.y + ' L' + r1(xc + 1.6) + ',' + t.y + '" stroke="rgba(0,0,0,.6)" stroke-width=".7"/>';
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
    const tip = r1(s.bx + s.side * (B.reach + 9)), L = s.lab, w = 64;
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
    const B = BUTTONS[ds.button];
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
    const shadowBtn = s => '<ellipse cx="' + r1(s.bx + s.side * B.center) + '" cy="' + s.py + '" rx="' + B.rx + '" ry="' + B.ry + '"/>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + ds.view.join(' ') + '" class="hs-svg" data-design="' + key + '" ' +
      'role="img" aria-label="Голова грифа: нажмите на колок, чтобы выбрать струну">' +
      defs(ds, board) +
      '<g class="content">' +
      '<g class="shadow" filter="url(#hsShadow)" transform="translate(6,10)" opacity=".6"><path d="' + ds.outline + '"/><path d="' + board + '"/>' +
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

/* Glyph Field graphs: seeded, pixel-dithered area charts. */
window.GlyphGraph = (() => {
  'use strict';
  const profileNames = {mixed:'Mixed', peaks:'Peaks', ramp:'Ramp', wave:'Wave', steps:'Steps', walk:'Random walk'};
  const palettes = {
    field:{name:'Field', colors:['#dbdbdb','#9c9c9c','#ededed','#7c7c7c']},
    reference:{name:'Reference', colors:['#e8443a','#3b7de8','#8b62ec','#3ccf8e']},
    sunset:{name:'Sunset', colors:['#ff6b4a','#ffb547','#ff4f8b','#ffd86b']},
    ocean:{name:'Ocean', colors:['#2ec4d6','#3b7de8','#5b5ff0','#8fe3ff']},
    toxic:{name:'Toxic', colors:['#a6ff3c','#3cffb0','#e8ff5a','#4cd964']},
    mono:{name:'Mono', colors:['#f2f2f2','#bdbdbd','#8a8a8a','#dcdcdc']},
    candy:{name:'Candy', colors:['#ff7ad9','#8f7bff','#5ee0ff','#ffe16b']},
  };
  const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v => (v + .5) / 16);
  const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i, i + 2), 16));
  function mix(a, b, t) {
    const x = rgb(a), y = rgb(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function normalize(h, floor) {
    let min = Infinity, max = -Infinity;
    for (const v of h) { if (v < min) min = v; if (v > max) max = v; }
    const span = max - min || 1;
    for (let i = 0; i < h.length; i++) h[i] = floor + (h[i] - min) / span * (1 - floor);
    return h;
  }
  // Heights are 0..1 per pixel column; roughness steers how busy the line is.
  function profile(kind, cols, rough, rnd) {
    const h = new Float32Array(cols), last = Math.max(1, cols - 1);
    if (kind === 'peaks') {
      const count = Math.max(2, Math.round((1 + rough * 6) * cols / 80)), peaks = [];
      for (let k = 0; k < count; k++) peaks.push({c:(k + .5) / count + (rnd() - .5) * .6 / count, height:.45 + rnd() * .55, width:(.8 + rnd() * .9) / count});
      for (let i = 0; i < cols; i++) {
        const u = i / last; let v = .14;
        for (const p of peaks) v = Math.max(v, p.height * (1 - Math.abs(u - p.c) / p.width));
        h[i] = v;
      }
      let max = 0; for (const v of h) max = Math.max(max, v);
      for (let i = 0; i < cols; i++) h[i] /= max;
    } else if (kind === 'ramp') {
      const curve = 1.1 + rnd() * 1.4, flip = rnd() < .3, wobble = rough * .08, phase = rnd() * 9;
      for (let i = 0; i < cols; i++) {
        const u = flip ? 1 - i / last : i / last;
        h[i] = .06 + .94 * (1 - Math.pow(1 - u, curve)) + Math.sin(u * 23 + phase) * wobble * u;
      }
      normalize(h, .05);
    } else if (kind === 'wave') {
      const cycles = .7 + rough * 4, phase = rnd() * Math.PI * 2, second = 1.8 + rnd() * 1.4;
      for (let i = 0; i < cols; i++) {
        const u = i / last;
        h[i] = Math.sin(Math.PI * 2 * cycles * u + phase) + .35 * Math.sin(Math.PI * 2 * cycles * second * u + phase * 1.7);
      }
      normalize(h, .12);
    } else if (kind === 'steps') {
      const segments = 3 + Math.round(rough * 14), values = [];
      let v = .3 + rnd() * .4;
      for (let k = 0; k < segments; k++) { v = Math.min(1, Math.max(.08, v + (rnd() - .45) * .45)); values.push(v); }
      for (let i = 0; i < cols; i++) h[i] = values[Math.min(segments - 1, Math.floor(i / cols * segments))];
      normalize(h, .1);
    } else {
      let v = 0, drift = (rnd() - .4) * .02;
      for (let i = 0; i < cols; i++) { v += drift + (rnd() - .5) * (.03 + rough * .16); v *= .985; h[i] = v; }
      normalize(h, .1);
    }
    for (let i = 0; i < cols; i++) h[i] = Math.min(1, Math.max(.02, h[i]));
    return h;
  }
  // paint(x, y, size, color, round) draws one cell in a 1500 px reference frame.
  // Shared geometry for both styles: series spans and column heights on a p-sized grid.
  function layout(s, W, H, rnd, p) {
    const count = s.graphSeries, stacked = s.graphLayout === 'stack' || count === 1;
    const snap = v => Math.round(v / p) * p;
    // Width caps the band so charts stay strip-like on portrait canvases.
    const bandRows = Math.max(4, Math.round(Math.min(H * .8, W * .5) * s.graphHeight / 100 / p));
    const tailRows = Math.max(3, Math.round(bandRows * .2));
    const baseline = snap(H * .5 + (bandRows - tailRows) * p * .5);
    const margin = W * .06, usable = W - margin * 2;
    const gap = stacked ? 0 : usable * s.graphGap / 400;
    const weights = Array.from({length:count}, () => .6 + rnd() * .8);
    const total = weights.reduce((a, b) => a + b, 0);
    const kinds = ['peaks','ramp','peaks','walk','wave'];
    const series = [];
    let cursor = margin;
    for (let i = 0; i < count; i++) {
      const width = stacked ? usable : (usable - gap * (count - 1)) * weights[i] / total;
      const x0 = snap(cursor), cols = Math.max(2, Math.floor(width / p));
      cursor += stacked ? 0 : width + gap;
      const kind = s.graphProfile === 'mixed' ? kinds[Math.floor(rnd() * kinds.length)] : s.graphProfile;
      series.push({x0, cols, heights:profile(kind, cols, s.graphRough / 100, rnd), amp:stacked && count > 1 ? 1 - i * .2 : 1, nx:rnd() * 60, ny:rnd() * 60});
    }
    return {series, baseline, bandRows, tailRows, gamma:.35 + s.graphFade / 100 * 2.2};
  }
  // Glyph style: the chart becomes a field mask over the area under the curve,
  // down to a flat end line. density() fades from 1 at the curve to 0 there.
  function mask(s, W, H, rnd, noise, p) {
    const {series, baseline, bandRows, tailRows, gamma} = layout(s, W, H, rnd, p);
    const end = baseline + tailRows * p * 1.6;
    function sample(sr, x, y) {
      const f = (x - sr.x0) / p;
      if (f < 0 || f > sr.cols - 1 || y > end) return -1;
      const i = Math.floor(f), u = f - i;
      const h = sr.heights[i] * (1 - u) + sr.heights[Math.min(sr.cols - 1, i + 1)] * u;
      const top = baseline - h * sr.amp * bandRows * p;
      if (y < top) return -1;
      return Math.max(.001, Math.pow(1 - (y - top) / (end - top), gamma));
    }
    function owner(x, y) { for (let i = series.length - 1; i > 0; i--) if (sample(series[i], x, y) > 0) return i; return 0; }
    return {
      field(x, y) { let best = -1; for (const sr of series) best = Math.max(best, sample(sr, x, y)); return best < 0 ? -.25 : .05 + best * .25; },
      owner,
      density(x, y) { return Math.max(0, sample(series[owner(x, y)], x, y)); },
    };
  }
  const bayer = (gx, gy) => BAYER[(gx & 3) + (gy & 3) * 4];
  function draw(s, W, H, rnd, paint) {
    const p = s.graphPixel;
    const colors = [s.series1, s.series2, s.series3, s.series4];
    const {series, baseline, bandRows, tailRows, gamma} = layout(s, W, H, rnd, p);
    const round = s.graphCell === 'dot', inset = s.graphCell === 'gapped' ? p * .12 : 0;
    function cell(x, y, size, color) {
      const offset = (p - size) / 2 + inset;
      paint(x + offset, y + offset, size - inset * 2, color, round);
    }
    series.forEach(({x0, cols, heights, amp}, i) => {
      const base = colors[i], shades = [0,1,2,3,4,5].map(level => mix(base, s.background, level / 6 * .72));
      const highlight = mix(base, '#ffffff', .38), star = mix(base, '#ffffff', .78);
      const tops = new Int32Array(cols);
      for (let c = 0; c < cols; c++) {
        const rows = Math.max(1, Math.round(heights[c] * amp * bandRows)), span = rows + tailRows;
        const top = baseline - rows * p, x = x0 + c * p, gx = Math.round(x / p);
        tops[c] = top;
        for (let r = 0; r < span; r++) {
          const y = top + r * p, gy = Math.round(y / p), t = r / span;
          if (s.graphEdge !== 'none' && r < 2) { cell(x, y, p, r === 0 && s.graphEdge === 'glow' ? highlight : base); continue; }
          const density = Math.pow(1 - t, gamma);
          const color = shades[Math.min(5, Math.floor(t * 6))];
          if (s.graphDither === 'halftone') { if (density > .07) cell(x, y, p * Math.sqrt(density), color); }
          else if (s.graphDither === 'scatter' ? rnd() < density : density > BAYER[(gx & 3) + (gy & 3) * 4]) cell(x, y, p, color);
        }
      }
      const stars = Math.round(s.graphStars / 100 * cols * .09);
      for (let n = 0; n < stars; n++) {
        const c = Math.floor(rnd() * cols), depth = (baseline - tops[c]) / p + tailRows + 3;
        cell(x0 + c * p, tops[c] + (2 + Math.floor(rnd() * depth)) * p, p, star);
      }
    });
  }
  return {profileNames, palettes, draw, mask, bayer};
})();

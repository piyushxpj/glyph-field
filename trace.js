/* Glyph Field trace: read a raster made with the studio back into a field. */
window.GlyphTrace = (() => {
  'use strict';
  const hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  function hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hueGap(a, b) { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); }
  // The most common border color is the background in every studio export.
  function background(px, w, h) {
    const bins = new Map();
    const add = i => { const k = (px[i] >> 4) << 8 | (px[i + 1] >> 4) << 4 | px[i + 2] >> 4; const e = bins.get(k) || [0, 0, 0, 0]; e[0]++; e[1] += px[i]; e[2] += px[i + 1]; e[3] += px[i + 2]; bins.set(k, e); };
    for (let x = 0; x < w; x += 2) { add(x * 4); add(((h - 1) * w + x) * 4); }
    for (let y = 0; y < h; y += 2) { add(y * w * 4); add((y * w + w - 1) * 4); }
    let best = [0, 0, 0, 0];
    for (const e of bins.values()) if (e[0] > best[0]) best = e;
    return [best[1] / best[0], best[2] / best[0], best[3] / best[0]];
  }
  function kmeans(samples, k) {
    const centers = [samples[Math.floor(samples.length / 2)]];
    while (centers.length < k) {
      let far = samples[0], farD = -1;
      for (const s of samples) { const d = Math.min(...centers.map(c => dist2(s, c))); if (d > farD) { farD = d; far = s; } }
      centers.push(far);
    }
    let counts = [];
    for (let it = 0; it < 10; it++) {
      const sums = centers.map(() => [0, 0, 0]); counts = centers.map(() => 0);
      for (const s of samples) {
        let bi = 0, bd = Infinity;
        centers.forEach((c, i) => { const d = dist2(s, c); if (d < bd) { bd = d; bi = i; } });
        sums[bi][0] += s[0]; sums[bi][1] += s[1]; sums[bi][2] += s[2]; counts[bi]++;
      }
      centers.forEach((c, i) => { if (counts[i]) centers[i] = sums[i].map(v => v / counts[i]); });
    }
    return centers.map((c, i) => ({c, n:counts[i]})).filter(e => e.n);
  }
  // Glyphs sit on a regular grid, so the foreground repeats at the glyph pitch.
  function pitch(mask, w, h) {
    const score = [];
    for (let lag = 3; lag <= 40; lag++) {
      let hit = 0, total = 0;
      for (let y = 2; y < h; y += 3) {
        const row = y * w;
        for (let x = 0; x + lag < w; x += 2) { if (mask[row + x]) { total++; hit += mask[row + x + lag]; } }
      }
      score[lag] = total ? hit / total : 0;
    }
    const peaks = [];
    for (let lag = 4; lag < 36; lag++) {
      if (score[lag] < score[lag - 1] || score[lag] < score[lag + 1]) continue;
      const p = score[lag] - (score[lag - 1] + score[lag + 1]) / 2 + score[lag] - Math.min(...score.slice(Math.max(3, lag - 4), lag));
      if (p > .01) peaks.push({lag, p});
    }
    // Overlapping edge glyphs leave no peak, only a flat shoulder at one glyph's width.
    // Edge glyphs are drawn about 1.95 grid steps wide.
    if (!peaks.length) {
      let flat = 18, slope = Infinity;
      for (let lag = 8; lag <= 28; lag++) { const d = score[lag - 1] - score[lag + 1]; if (d < slope) { slope = d; flat = lag; } }
      return flat / 1.95;
    }
    const best = peaks.reduce((a, b) => b.p > a.p ? b : a);
    // Glyph strokes repeat at half the pitch too; prefer the half when it is nearly as strong.
    const half = peaks.find(e => Math.abs(e.lag - best.lag / 2) <= 1 && e.p >= best.p * .5);
    return (half || best).lag;
  }
  async function analyze(file, sizeFor) {
    const bitmap = await createImageBitmap(file);
    const width = bitmap.width, height = bitmap.height, ratio = `${width}:${height}`, [w, h] = sizeFor(ratio, 1500);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', {willReadFrequently:true}); ctx.drawImage(bitmap, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const bg = background(px, w, h);
    const samples = [], fg = new Uint8Array(w * h);
    for (let i = 0, p = 0; p < w * h; i += 4, p++) {
      const c = [px[i], px[i + 1], px[i + 2]];
      if (px[i + 3] > 32 && dist2(c, bg) > 45 * 45) { fg[p] = 1; if (p % 7 === 0) samples.push(c); }
    }
    if (samples.length < 50) throw new Error('No glyphs found in this image.');
    const clusters = kmeans(samples.length > 9000 ? samples.filter((_, i) => i % Math.ceil(samples.length / 9000) === 0) : samples, 5).sort((a, b) => b.n - a.n);
    const main = clusters[0], mainHsl = hsl(main.c), bgHsl = hsl(bg);
    // Letter fragments use the accent: color against a gray field, or a clearly different hue.
    // Anti-aliased blends toward a colored background share its hue, so that hue is ignored.
    const accentLike = c => {
      const [hue, sat, l] = hsl(c);
      if (l < .12 || l > .95 || (bgHsl[1] > .2 && hueGap(hue, bgHsl[0]) < 30)) return false;
      return mainHsl[1] < .15 ? sat > .3 : sat > .2 && hueGap(hue, mainHsl[0]) > 35;
    };
    const bins = Array.from({length:12}, () => []);
    for (const c of samples) if (accentLike(c)) bins[Math.floor(hsl(c)[0] / 30) % 12].push(c);
    const peak = bins.reduce((a, b, i) => b.length > bins[a].length ? i : a, 0);
    const picked = [...bins[(peak + 11) % 12], ...bins[peak], ...bins[(peak + 1) % 12]];
    const accentColor = picked.length / samples.length > .003 ? [0, 1, 2].map(k => picked.reduce((a, c) => a + c[k], 0) / picked.length) : null;
    const accentHue = accentColor && hsl(accentColor)[0];
    const accent = accentColor && {c:accentColor, owns:c => accentLike(c) && hueGap(hsl(c)[0], accentHue) < 45};
    const integral = new Uint32Array((w + 1) * (h + 1)), lights = [];
    for (let y = 0, i = 0; y < h; y++) {
      let run = 0;
      for (let x = 0; x < w; x++, i++) {
        const c = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]];
        const own = fg[i] && !(accent && accent.owns(c));
        fg[i] = own ? 1 : 0; run += fg[i];
        integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + run;
        if (own && i % 5 === 0) lights.push(c);
      }
    }
    // The edge glyphs carry the brightest field color; use it as the glyph color.
    lights.sort((a, b) => (b[0] + b[1] + b[2]) - (a[0] + a[1] + a[2]));
    const top = lights.slice(0, Math.max(1, Math.floor(lights.length * .3)));
    const glyph = [0, 1, 2].map(k => top.reduce((a, c) => a + c[k], 0) / top.length);
    const thumb = document.createElement('canvas'), tw = 120, th = Math.round(120 * h / w);
    thumb.width = tw; thumb.height = th; thumb.getContext('2d').drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();
    function coverage(x, y, r) {
      const x0 = Math.max(0, Math.floor(x - r)), y0 = Math.max(0, Math.floor(y - r)), x1 = Math.min(w, Math.ceil(x + r)), y1 = Math.min(h, Math.ceil(y + r));
      if (x1 <= x0 || y1 <= y0) return 0;
      const W = w + 1, sum = integral[y1 * W + x1] - integral[y0 * W + x1] - integral[y1 * W + x0] + integral[y0 * W + x0];
      return sum / ((x1 - x0) * (y1 - y0));
    }
    return {
      name:file.name || 'image', ratio, width, height, thumb:thumb.toDataURL('image/png'),
      palette:{background:hex(bg), glyph:hex(glyph), accent:accent ? hex(accent.c) : null},
      step:Math.max(4, Math.min(32, Math.round(pitch(fg, w, h)))),
      src:URL.createObjectURL(file),
      field:(x, y, radius, threshold) => coverage(x, y, radius) - threshold,
    };
  }
  return {analyze};
})();

// A stamp for the album: a small picture of something that belongs to the country, on gummed paper with a perforated edge.
// One is hidden in every level. The picture is one of the country's own sprites, so a stamp shows the thing as the game draws it.
import { sprite } from './paint.js';

export const STAMP_W = 1, STAMP_H = 1.2;
export function paintStamp(ctx, w, h, pic, field = ['#8fc4ee', '#f4ecd8']) {
  ctx.fillStyle = '#fbf6e8'; ctx.fillRect(0, 0, w, h);
  // the perforations: a row of bites out of every edge
  const nx = 8, ny = 10, r = w / nx * 0.24; ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath();
  for (let i = 0; i <= nx; i++) { const x = (i / nx) * w; ctx.moveTo(x + r, 0); ctx.arc(x, 0, r, 0, 7); ctx.moveTo(x + r, h); ctx.arc(x, h, r, 0, 7); }
  for (let i = 0; i <= ny; i++) { const y = (i / ny) * h; ctx.moveTo(r, y); ctx.arc(0, y, r, 0, 7); ctx.moveTo(w + r, y); ctx.arc(w, y, r, 0, 7); }
  ctx.fill(); ctx.restore();
  const p = w * 0.105, fw = w - p * 2, fh = h - p * 2, g = ctx.createLinearGradient(0, p, 0, p + fh); g.addColorStop(0, field[0]); g.addColorStop(1, field[1]); ctx.fillStyle = g; ctx.fillRect(p, p, fw, fh);
  if (pic) { ctx.save(); ctx.beginPath(); ctx.rect(p, p, fw, fh); ctx.clip(); const s = Math.min((fw * 0.86) / pic.w, (fh * 0.8) / pic.h); ctx.fillStyle = 'rgba(40,50,60,0.16)'; ctx.beginPath(); ctx.ellipse(w / 2, p + fh * 0.9, pic.w * s * 0.42, fh * 0.035, 0, 0, 7); ctx.fill();
    ctx.drawImage(pic.c, w / 2 - (pic.w * s) / 2, p + fh * 0.92 - pic.h * s, pic.w * s, pic.h * s); ctx.restore(); }
  ctx.strokeStyle = 'rgba(60,70,90,0.45)'; ctx.lineWidth = w * 0.012; ctx.strokeRect(p, p, fw, fh);
}
const field = (theme) => { const d = theme.times.day || Object.values(theme.times)[0]; return [d.sky[1] || d.sky[0], d.haze]; };
// for the game's own picture: a sprite, made from the sprites the scene already has
export function stampSprite(theme, li, spr, ppu = 128) { const d = theme.stamps?.[li], pic = d && spr[d.s] ? spr[d.s][d.v || 0] : null; return sprite(STAMP_W, STAMP_H, (ctx) => paintStamp(ctx, STAMP_W, STAMP_H, pic, field(theme)), { ax: 0.5, ay: 0.5, ppu }); }
// for the pages: a canvas element. The country's sprites are made once, at midday, the first time one of its stamps is wanted.
const made = new Map();
// a country's sprites as they are at midday, for pictures shown away from that country: the album, and the gathering at the end
export function daySprites(theme) { let spr = made.get(theme.id); if (!spr) { spr = theme.sprites(theme.times.day || Object.values(theme.times)[0]); made.set(theme.id, spr); } return spr; }
export function stampCanvas(theme, li, px = 120) {
  let spr = made.get(theme.id); if (!spr) { spr = theme.sprites(theme.times.day || Object.values(theme.times)[0]); made.set(theme.id, spr); }
  const src = stampSprite(theme, li, spr, px).c, c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.className = 'stamp'; return c;
}

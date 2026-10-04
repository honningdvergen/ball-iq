// The branded share-card renderer, split out of App.jsx on 2026-10-04.
//
// ⚠️ SPLIT FOR WEIGHT. This canvas code only runs when a player taps Share,
// but it sat in GameRoot, which Home loads eagerly. Production's Home budget
// gate (scripts/audit-home-budget.mjs) failed at 910 KB > 909 KB the moment the
// Footle card redraw (#11) added a kilobyte, and every deploy after it was
// rejected. App.jsx now imports this module on demand from shareCard().
import { APP_NAME, MIN_RATED_ANSWERS } from './scoring.js';
import { tint as _tint } from './clubColour.js';
import { tierPalette, faceLabelType } from './ballIqCard.js';
import { resultVerdict } from './resultVerdict.js';

// ─── BRANDED SHARE CARD (NEW, 390×600 PORTRAIT) ─────────────────────────────
// Variants:
//   'wordle'    — Today's Puzzle. Score + emoji-tile grid.
//   'standard'  — Classic / Survival / Daily / Chaos / Legends / WC2026.
//   'hotstreak' — Hot Streak. Big streak number with orange accent.
//
// Returns a Promise<Blob> of a PNG. The card layout is fixed at 390×600
// portrait so it slots nicely into iOS / Android share sheets.

const SHARE_CARD_W = 390;
const SHARE_CARD_H = 600;

// Round-rect helper used for the rounded canvas clip and emoji tiles.
function _roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// Word-wrap helper. Draws each line via fillText, returns the next y after
// the last line. Used for variable-length labels (BallIQ funny label,
// Hot Streak descriptor) so they don't overflow on long strings.
function _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let curY = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = w;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
  return curY;
}

// Load an image for canvas compositing (profile-card photo avatar). crossOrigin
// 'anonymous' keeps the canvas untainted so toBlob() works (Supabase public
// storage sends CORS headers). Times out / rejects so a slow or blocked image
// falls back to the emoji avatar rather than hanging the share.
function _loadImage(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = setTimeout(() => reject(new Error("img timeout")), timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); reject(new Error("img error")); };
    // Unique per-load query so the CORS request never reuses a no-CORS cached
    // entry — on WKWebView that opaque cached response would taint the canvas
    // and silently degrade the photo card to text at toBlob().
    img.src = url + (url.includes("?") ? "&" : "?") + "_cb=" + Date.now();
  });
}

// Canvas has no CSS letter-spacing. `ctx.letterSpacing` exists in modern
// WebKit/Chrome but not in older WKWebView, and the rating is the hero — a
// gappy "8 7" on an older phone is not an acceptable degradation. So advance
// manually: measure each glyph and add the tracking ourselves. Works everywhere.
function _trackedText(ctx, text, x, y, tracking) {
  let cx = x;
  for (const ch of String(text)) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return cx - tracking - x;   // total advance, for centring callers
}

function _trackedWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of String(text)) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

export async function generateShareCard(type, data) {
  // ⚠️ THE IQ CARD GETS ITS OWN CANVAS, AND IT IS THE BIGGEST FIX HERE.
  // 390x600 is a 1x render. Saved to a modern camera roll and opened on a
  // ~1200px-wide phone it is upscaled 3x and looks soft — which is most of why
  // Alex called it "assembled, not designed". Layout cannot rescue resolution.
  // 1080x1350 is 4:5, the tallest ratio Instagram allows in feed and the one
  // people actually post, and it sits inside a 9:16 Story with clean margins.
  const IS_IQ = type === "iq";
  const W = IS_IQ ? 1080 : SHARE_CARD_W, H = IS_IQ ? 1440 : SHARE_CARD_H;
  // The IQ card is authored at full resolution above; every other card is
  // authored in 390x600 coordinates, so give those a 2x backing store and
  // scale the context — same sharpness fix, zero layout-math changes.
  const SCALE = IS_IQ ? 1 : 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (SCALE !== 1) ctx.scale(SCALE, SCALE);

  // Wait up to 1s for fonts to load. Without this the first card draw can
  // fall back to the platform default which looks off.
  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((res) => setTimeout(res, 1000)),
      ]);
    }
  } catch {}

  // Clip to a 20px rounded rect so the share card has soft corners on
  // platforms that render the file as-is (iMessage, Slack image previews).
  ctx.save();
  _roundRectPath(ctx, 0, 0, W, H, IS_IQ ? 0 : 20);
  ctx.clip();

  // Background
  ctx.fillStyle = "#0B0C10";
  ctx.fillRect(0, 0, W, H);

  // ⚠️ SKIPPED FOR THE IQ CARD. This chrome — accent bar, wordmark row, divider,
  // footer URL — wraps the small result cards, and wrapping the rating card in
  // it produced a CARD INSIDE A CARD: two nested rounded rects each with their
  // own border and padding, with the brand stamped THREE times (wordmark, URL
  // top-right, URL again at the foot). That is exactly what "assembled rather
  // than designed" looks like. The IQ card is one object and carries the mark
  // once, placed deliberately.
  const padX = 24;
  const headerY = 38;
  ctx.textBaseline = "alphabetic";
  if (!IS_IQ) {
  ctx.fillStyle = "#58CC02";
  ctx.fillRect(0, 0, W, 6);
  ctx.font = '800 22px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(`⚽ ${APP_NAME}`, padX, headerY);

  ctx.font = '500 12px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#9BA0B8";
  ctx.textAlign = "right";
  // The Footle card prints its address once, at the foot, with the path.
  if (type !== "wordle") ctx.fillText("balliq.app", W - padX, headerY);

  // Divider
  ctx.fillStyle = "#2F3240";
  ctx.fillRect(padX, 56, W - padX * 2, 1);

  // Centered footer URL (the Footle card draws its own foot, with the path)
  if (type !== "wordle") {
  ctx.font = '500 13px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#9BA0B8";
  ctx.textAlign = "center";
  ctx.fillText("balliq.app", W / 2, H - 24);
  }
  }

  // Per-variant content. All variants set textAlign = "center" by default.
  ctx.textAlign = "center";
  const cx = W / 2;

  if (type === "wordle") {
    // ── THE FOOTLE CARD (redrawn 2026-10-04) ────────────────────────────────
    // The old card led with "TODAY'S PUZZLE", carried no puzzle number, drew
    // 36px tiles in the top half and left ~250px of empty black above a second
    // "balliq.app". The number is the one thing that makes two grids
    // comparable between strangers (it is in every share line), so it now
    // heads the card; the grid is sized to the space it has and centred in
    // it; and the foot is one invitation to play the same puzzle instead of a
    // repeated URL.
    const grades = Array.isArray(data?.grades) ? data.grades : [];
    const score = data?.score ?? 0;
    const num = data?.num > 0 ? data.num : 0;
    const streak = data?.failed ? 0 : (Number(data?.streak) || 0);
    const colorMap = { green: "#58CC02", yellow: "#FFC107", grey: "#2A2E3B" };

    // Eyebrow: mode + number, in the accent. Then the date, quiet.
    ctx.font = '800 14px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#58CC02";
    const eyebrow = num ? `FOOTLE  No. ${num}` : "FOOTLE";
    const ew = _trackedWidth(ctx, eyebrow, 1.4);
    ctx.textAlign = "left";
    _trackedText(ctx, eyebrow, cx - ew / 2, 98, 1.4);
    ctx.textAlign = "center";
    ctx.font = '500 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText((data?.dateLabel || "") + (data?.clue ? " · with a clue" : ""), cx, 120);

    // Headline: guesses, not a fraction ("3/6" read like a quiz score).
    ctx.font = '800 32px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(data?.failed ? "Not today" : score === 1 ? "First guess" : `Solved in ${score} guesses`, cx, 168);

    // Grid: as large as fits in the band between the headline and the foot,
    // capped at 44px, centred vertically in that band.
    const cols = grades[0]?.length || 5;
    const rows = Math.max(1, grades.length);
    const gap = 5;
    const bandTop = 196, bandBottom = H - 150;
    const tile = Math.floor(Math.min(44, (W - 64 - (cols - 1) * gap) / cols, (bandBottom - bandTop - (rows - 1) * gap) / rows));
    const gridW = cols * tile + (cols - 1) * gap;
    const gridH = rows * tile + (rows - 1) * gap;
    const startX = cx - gridW / 2;
    let gy = bandTop + Math.max(0, (bandBottom - bandTop - gridH) / 2);
    for (const row of grades) {
      for (let i = 0; i < row.length; i++) {
        ctx.fillStyle = colorMap[row[i]] || colorMap.grey;
        _roundRectPath(ctx, startX + i * (tile + gap), gy, tile, tile, Math.round(tile * 0.18));
        ctx.fill();
      }
      gy += tile + gap;
    }

    // Streak, when there is one worth showing.
    if (streak >= 2) {
      ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = "#FFC107";
      ctx.fillText(`🔥 ${streak}-day Footle streak`, cx, H - 118);
    }

    // Foot: the invitation, as a pill, then where to go.
    const pillW = 236, pillH = 44, pillY = H - 96;
    ctx.fillStyle = "#58CC02";
    _roundRectPath(ctx, cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.font = '800 16px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#06230C";
    ctx.fillText(data?.failed ? "Can you get it?" : "Can you beat me?", cx, pillY + 28);
    ctx.font = '600 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("balliq.app/footle", cx, H - 24);
  } else if (type === "hotstreak") {
    const score = data?.score ?? 0;

    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("HOT STREAK", cx, 130);

    ctx.font = '900 88px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#FF6A00";
    ctx.fillText(String(score), cx, 260);

    // Descriptor — wrapped to 280px
    ctx.font = '600 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    _wrapText(ctx, "questions answered correctly in a row", cx, 308, 280, 22);

    // Subtitle
    ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me? ⚽", cx, 520);
  } else if (type === "iq") {
    // ── THE BALL IQ CARD ────────────────────────────────────────────────────
    // Designed as an editorial card, not a screenshot of a screen and not a
    // grid of chips. Three earlier attempts read as "assembled": boxes stacked
    // in horizontal bands, six equal-weight tiles heavier than the rating they
    // were meant to support, and the brand stamped three times. What fixed it:
    //   · the stats are an OPEN LIST on hairlines, not tiles in a box
    //   · the numeral and the avatar are the same optical size, so the top of
    //     the card is one composition rather than a number with a bullet
    //   · one diagonal foil sweep across the whole card, so it is one material
    //   · the invitation gets its own strip below a rule, not the next band down
    //
    // ⚠️ THIS IS THE SAME CARD THE PROFILE SHOWS. The profile renders the 540x620
    // content block; the shared PNG is that block plus a 100px footer carrying
    // "Can you beat me?" and the URL. Nothing is redesigned between them — the
    // whole point is that the card in a chat is the card you find on your own
    // profile after installing. Change one, change both.
    //
    // Drawn at 2x the design (1080x1440) because the mock is authored at 540x720.
    const card = data?.card;
    const t = tierPalette(card?.tier);
    const name = (data?.name || `${APP_NAME} Player`).slice(0, 14);
    const stops = String(t.bg).match(/#[0-9a-f]{6}/gi) || ["#1B1E27", "#080a0f"];
    const S2 = 2;                       // design px -> canvas px
    const px = (n) => n * S2;

    // Ground, bloom, foil sweep — one material.
    const ground = ctx.createLinearGradient(0, 0, W * 0.42, H);
    ground.addColorStop(0, stops[0]);
    ground.addColorStop(0.58, stops[1] || stops[0]);
    ground.addColorStop(1, "#090807");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, W, H);
    const bloom = ctx.createRadialGradient(W * 0.16, H * 0.06, 0, W * 0.16, H * 0.06, W * 0.72);
    bloom.addColorStop(0, _tint(t.accent, 0.19));
    bloom.addColorStop(1, _tint(t.accent, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);
    const sweep = ctx.createLinearGradient(W * 0.9, 0, W * 0.1, H);
    sweep.addColorStop(0.30, _tint(t.accent, 0));
    sweep.addColorStop(0.47, _tint(t.accent, 0.12));
    sweep.addColorStop(0.62, _tint(t.accent, 0));
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Wordmark, once.
    ctx.font = `900 ${px(13)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.text, 0.5);
    ctx.fillText("B A L L   I Q", px(40), px(52));

    // Rating and avatar: same optical size, held as a pair.
    ctx.font = `800 ${px(150)}px "JetBrains Mono", "Courier New", monospace`;
    ctx.fillStyle = t.accent;
    // An unrated card prints a dash, never a number. This drew card.overall
    // unconditionally until 2026-09-07, so a player who had answered fewer than
    // MIN_RATED_ANSWERS could save and post an image reading "64 · SILVER"
    // while their own card in the app correctly said ANSWER 10 TO GET RATED.
    // A shared image is the most public surface the rating has.
    const _rated = card?.rated !== false;
    _trackedText(ctx, _rated ? String(card?.overall ?? "—") : "—", px(30), px(205), px(-5));

    ctx.font = `900 ${px(11)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.text, 0.5);
    ctx.fillText("O V E R A L L", px(40), px(231));

    ctx.font = `900 ${px(14)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.accent, 0.92);
    ctx.fillText(_rated ? (t.label || "").split("").join(" ")
                        : `A N S W E R   ${MIN_RATED_ANSWERS}   T O   G E T   R A T E D`, px(40), px(261));

    const aR = px(75), aCx = W - px(38) - aR, aCy = px(76) + aR;
    ctx.save();
    ctx.beginPath();
    ctx.arc(aCx, aCy, aR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (data?.avatarImg) {
      ctx.drawImage(data.avatarImg, aCx - aR, aCy - aR, aR * 2, aR * 2);
    } else {
      ctx.fillStyle = data?.avatarBg || "#1F2430";
      ctx.fillRect(aCx - aR, aCy - aR, aR * 2, aR * 2);
      ctx.textAlign = "center";
      ctx.font = `900 ${px(68)}px Inter, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(data?.initial || "?", aCx, aCy + px(3));
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(aCx, aCy, aR, 0, Math.PI * 2);
    ctx.strokeStyle = _tint(t.accent, 0.85);
    ctx.lineWidth = px(4);
    ctx.stroke();

    ctx.font = `900 ${px(42)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(name, px(38), px(330));

    if (data?.levelName) {
      ctx.font = `700 ${px(13.5)}px Inter, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = _tint(t.text, 0.5);
      ctx.fillText(`${data.levelName} · ${Number(data.xp || 0).toLocaleString()} XP`, px(39), px(364));
    }

    // The six, as an open two-column list on hairlines. No tiles.
    const rows = Array.isArray(card?.ratings) ? card.ratings : [];
    const played = rows.filter((r) => r.answered >= MIN_RATED_ANSWERS);
    const bestAbbr = played.length ? played.reduce((a, b) => (b.rating > a.rating ? b : a)).abbr : null;
    const colW = (W - px(76) - px(36)) / 2;
    const listTop = px(404), rowH = px(64);
    rows.forEach((r, i) => {
      const cIdx = i % 2, rIdx = Math.floor(i / 2);
      const x = px(38) + cIdx * (colW + px(36));
      const y = listTop + rIdx * rowH;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(x, y, colW, 2);
      ctx.beginPath();
      ctx.arc(x + px(4.5), y + px(27), px(4.5), 0, Math.PI * 2);
      ctx.fillStyle = r.color || "#8A8A8A";
      ctx.fill();
      // ⚠️ 16px, not 14. At 14 the label sat at half the value's height and read
      // as a caption, so the numbers floated and the row lost its subject.
      // ⚠️ SAME LENGTH RULE AS THE REACT CARD — faceLabelType, base 16 here to
      // its 13. There is no overflow handling on a canvas: an unshrunk
      // "BUNDESLIGA" runs straight under the rating in the saved PNG.
      ctx.font = `800 ${px(faceLabelType(r.abbr, 16).size)}px Inter, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = _tint(t.text, 0.72);
      ctx.fillText(r.abbr, x + px(22), y + px(34));
      ctx.textAlign = "right";
      ctx.font = `800 ${px(27)}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillStyle = r.abbr === bestAbbr ? t.accent : _tint(t.text, 0.92);
      ctx.fillText(r.answered >= MIN_RATED_ANSWERS ? String(r.rating) : "—", x + colW, y + px(36));
      ctx.textAlign = "left";
    });

    // The footer strip — the ONLY thing the profile card does not show.
    ctx.fillStyle = _tint(t.accent, 0.20);
    ctx.fillRect(px(38), H - px(100), W - px(76), 2);
    ctx.textAlign = "center";
    ctx.font = `900 ${px(20)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me?", W / 2, H - px(58));
    ctx.font = `700 ${px(13)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.text, 0.45);
    ctx.fillText("balliq.app", W / 2, H - px(30));
  } else {
    // Standard variant — Classic, Survival, Daily, Chaos, Legends, WC2026
    const modeLabel = (data?.modeLabel || "Quiz").toUpperCase();
    const score = data?.score ?? 0;
    const total = data?.total ?? 0;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const streak = data?.streak;

    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText(modeLabel, cx, 130);

    ctx.font = '900 80px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#58CC02";
    ctx.fillText(`${score}/${total}`, cx, 250);

    ctx.font = '700 18px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${accuracy}% accuracy`, cx, 292);

    // Accuracy bar — fills the band with a real visual instead of dead space.
    const barW = W - padX * 2 - 40, barX = cx - barW / 2, barY = 318, barH = 14;
    _roundRectPath(ctx, barX, barY, barW, barH, 7);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    const fillW = Math.max(barH, Math.round(barW * Math.min(100, Math.max(0, accuracy)) / 100));
    _roundRectPath(ctx, barX, barY, fillW, barH, 7);
    ctx.fillStyle = "#58CC02";
    ctx.fill();

    // Tier tagline keyed to accuracy.
    const tier = resultVerdict(accuracy);
    ctx.font = '800 24px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tier, cx, 382);

    if (streak && streak >= 3) {
      ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = "#FF6A00";
      ctx.fillText(`🔥 ${streak} in a row`, cx, 416);
    }

    // CTA — filled green pill (matches the profile card).
    const ctaText = "Can you beat me? ⚽";
    ctx.font = '800 16px Inter, "Helvetica Neue", Arial, sans-serif';
    const ctaW = ctx.measureText(ctaText).width + 46;
    const ctaH = 42, ctaY = 470;
    ctx.fillStyle = "#58CC02";
    _roundRectPath(ctx, cx - ctaW / 2, ctaY, ctaW, ctaH, 21);
    ctx.fill();
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#06250F";
    ctx.fillText(ctaText, cx, ctaY + ctaH / 2 + 1);
    ctx.textBaseline = "alphabetic";
  }

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob returned null"));
    }, "image/png");
  });
}

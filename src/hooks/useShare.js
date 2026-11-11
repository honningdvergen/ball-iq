import { useState, useRef, useCallback } from "react";
import { useModalA11y } from "../useModalA11y.js";
import { computeCard, shareLine, readCardDelta } from "../lib/ballIqCard.js";
import { APP_NAME, getLevelInfo } from "../lib/scoring.js";
import { Share as CapShare } from "@capacitor/share";
import { avatarColour } from "../lib/avatarColour.js";
import { firstLetter as firstLetterOf } from "../components/ProfilePic.jsx";
import { t, getLang } from "../i18n/index.js";
import { loopEvent, shareCard, IS_NATIVE, INVITE_BASE_URL, LEAGUE_QUIZ_BY_CAT, CAT_TO_QUIZ_SLUG } from "../App.jsx";
// A club result only exists after launchClubQuiz has awaited the lazy club
// tables, so a share reads them synchronously (an await could spend the tap).
import { clubData } from "../lib/clubData.js";

// ── The share texts, in the sharer's language (i18n step 6) ─────────────────
// Pure, so tests/unit/i18n-last-english.test.js can hold the English to the
// code main had before step 6, byte for byte, over a grid of inputs.

/** The Daily 7 challenge share, line by line (the last line is the link). */
export function dailyShareLines({ score, total = 7, streak = 0, url, date = new Date() }) {
  const lang = getLang();
  const dateStr = date.toLocaleDateString(lang === "en" ? "en-GB" : lang, { day: "numeric", month: "short" });
  const grid = Array.from({ length: total }, (_, i) => i < score ? "✅" : "❌").join("");
  const streakLine = streak > 0 ? t("share.d7Streak", { n: streak }) : "";
  return [
    `⚽ ${APP_NAME} Daily 7`,
    `📅 ${dateStr}`,
    `🎯 ${score}/${total}`,
    streakLine,
    "",
    grid,
    "",
    t("share.d7Beat"),
    url,
  ].filter(Boolean);
}

// resultVerdict's bands (lib/resultVerdict.js) as the rv.* keys: the same English.
const verdictKey = (pct) => (pct === 100 ? "rv.100" : pct >= 80 ? "rv.80" : pct >= 60 ? "rv.60" : pct >= 40 ? "rv.40" : "rv.0");
const SCORE_KEYS = {
  daily: "share.mDaily", classic: "share.mClassic", survival: "share.mSurvival", hotstreak: "share.mHotstreak",
  truefalse: "share.mTruefalse", legends: "share.mLegends", local: "share.mLocal", chaos: "share.mChaos",
};
/** A mode's plain-text result (the image share's fallback, and local play's whole share). */
export function scoreShareText(mode, { score, total, url }) {
  const pct = total ? Math.round(score / total * 100) : 0;
  const key = SCORE_KEYS[mode] || SCORE_KEYS.classic;
  const vars = { app: APP_NAME, score, total, pct, url, beat: t("share.beat") };
  if (key === SCORE_KEYS.daily) vars.dots = Array.from({ length: total }, (_, i) => i < score ? "🟢" : "🔴").join("");
  if (key === SCORE_KEYS.classic) {
    vars.medal = pct === 100 ? "🏆" : pct >= 80 ? "🔥" : pct >= 60 ? "⚽" : "😅";
    vars.verdict = t(verdictKey(pct));
  }
  return t(key, vars);
}

const LABEL_KEYS = {
  classic: "share.lClassic", daily: "share.lDaily", survival: "share.lSurvival", hotstreak: "share.lHotstreak",
  truefalse: "share.lTruefalse", legends: "share.lLegends", local: "share.lLocal", chaos: "share.lChaos",
};
/** The result's name in the line under the card ("… on Arsenal Quiz"); the card itself prints the English. */
export function scoreShareLabel(mode, packName) {
  if (packName) return t("share.lPack", { name: packName });
  return LABEL_KEYS[mode] ? t(LABEL_KEYS[mode]) : t("share.lQuiz");
}

// Extracted from AppInner on 2026-09-06 (review E16). Everything a share needs
// is an input; the ask-your-name sheet's state is this hook's own.
export function useShare({ user, showToast, profile, setProfile, authProfile, stats, xp, loginStreak, dailyScore }) {
  const askShareNameRef = useRef(false);
  const [askShareName, setAskShareName] = useState(false);
  const [shareNameDraft, setShareNameDraft] = useState("");
  const shareNameRef = useRef(null);
  const resolveChallengerName = useCallback(() => {
    const u = authProfile?.username;
    if (u && u !== "Player" && !/^player_/i.test(u)) return u;
    const p = profile?.name;
    return (p && p !== "Player") ? p : "";
  }, [authProfile, profile]);
  const performDailyShare = useCallback(async (challengerName) => {
    // Daily share is intentionally TEXT-ONLY. Combined files+text shares strip
    // one or the other on iOS Safari → WhatsApp / Twitter / Instagram, and the
    // canvas→Blob path can silently fail. Plain text works universally.
    const score = dailyScore || 0;
    // 1.1 async challenge: encode score + date (+ challenger name) into the
    // link so a friend who opens it sees "beat my X/7" on today's deterministic
    // Daily 7 and gets a head-to-head compare after they finish. Format:
    // balliq.app/?c=SCORE.YYYYMMDD[.Name]
    const ymd = (() => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; })();
    const challengeUrl = `${INVITE_BASE_URL}/c/${score}.${ymd}${challengerName ? "." + encodeURIComponent(challengerName).replace(/\./g, "%2E") : ""}${user?.id ? `?f=${user.id}` : ""}`;
    const lines = dailyShareLines({ score, streak: loginStreak, url: challengeUrl });
    const text = lines.join("\n");
    // The share sheet gets the link as a first-class `url`, not buried at the
    // end of `text`: targets that keep only one field (Instagram, some mail
    // apps) keep the URL, and chat apps unfurl it as the card /c/ renders.
    // The clipboard copy keeps the link inside the text — it has nowhere
    // else to put it. (Share audit 2026-09-04: 153 share taps in 30 days,
    // 4 challenge opens; this and the /c/ hit log are how we find out where
    // the other 149 went.)
    const sheetText = lines.slice(0, -1).join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: `${APP_NAME} Daily 7`, text: sheetText, url: challengeUrl });
        loopEvent("share-daily-done", { via: "sheet" });
        return;
      }
    } catch (e) {
      // Cancelling the sheet is not a failure and must not produce a
      // "Copied to clipboard" toast for a share that never happened.
      if (e && e.name === "AbortError") { loopEvent("share-daily-cancel"); return false; }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("share.d7Copied"));
      loopEvent("share-daily-done", { via: "clipboard" });
    } catch {
      showToast(t("share.fail"));
    }
  }, [dailyScore, loginStreak, showToast]);
  const shareDaily = useCallback(() => {
    loopEvent("share-daily");
    const who = resolveChallengerName();
    if (!who) { setShareNameDraft(""); askShareNameRef.current = true; setAskShareName(true); return false; }
    return performDailyShare(who);
  }, [resolveChallengerName, performDailyShare]);
  const submitShareName = useCallback((who) => {
    const clean = String(who || "").trim().slice(0, 22);
    askShareNameRef.current = false;
    setAskShareName(false);
    // Persist even on the share sheet's own cancel — they told us who they
    // are, and re-asking on the next share would waste the one answer we got.
    if (clean) setProfile(p => ({ ...p, name: clean }));
    performDailyShare(clean);
  }, [setProfile, performDailyShare]);
  // ⚠️ DISMISSAL IS NOT SUBMISSION. onClose used to call submitShareName(""),
  // so Escape / the back gesture SHARED (clipboard write + a share-daily-done
  // row) with an empty name — the exact defect fixed on the report sheet the
  // day before. "Share without a name" is still one deliberate tap; backing
  // out now writes nothing. Verified in Chromium and WebKit: all four exits
  // shared before this change.
  const cancelShareName = useCallback(() => {
    askShareNameRef.current = false;
    setAskShareName(false);
  }, []);
  useModalA11y({ isOpen: askShareName, onClose: cancelShareName, ref: shareNameRef });
  const shareScore = useCallback(async (score, total, mode, extras = {}) => {
    // Per-mode plaintext fallback (used only when the image share path
    // fails). Game-result focused — no profile bits.
    // opportunity-scan #1: deep-link recipients into the app — and for
    // club/league results, into the exact quiz they were just beaten at.
    const clubs = clubData();
    const clubSlug = extras?.club ? clubs?.PACK_TO_CLUB_SLUG[extras.club] || null : null;
    const quizSlug = extras?.league ? CAT_TO_QUIZ_SLUG[extras.league] : null;
    const deepLink = clubSlug ? `/play?club=${clubSlug}` : quizSlug ? `/play?quiz=${quizSlug}` : "/play";
    const url = `balliq.app${deepLink}`;
    const text = scoreShareText(mode, { score, total, url });

    // Couch multiplayer (mode "local"): players rotate through ONE shared
    // question list, so there is no per-player score/total fraction — the
    // standard image card would render a bogus "0/0 · 0% accuracy". Share the
    // podium plaintext directly instead of a card.
    if (mode === "local") {
      try {
        if (IS_NATIVE) {
          await CapShare.share({ title: APP_NAME, text, dialogTitle: t("share.dlgResult") });
          return;
        }
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          await navigator.share({ title: APP_NAME, text });
          return;
        }
      } catch (err) {
        if (err && (err.name === "AbortError" || /cancel/i.test(err?.message || ""))) return;
      }
      try {
        await navigator.clipboard.writeText(text);
        showToast(t("share.copied"));
      } catch {}
      return;
    }

    // Pick the right card variant + payload for shareCard. The card is
    // English (lib/shareCardRender.js); shareLabel is the line under it.
    const MODE_LABELS = {
      classic: "Classic Quiz",
      daily: "Daily 7",
      survival: "Survival",
      hotstreak: "Hot Streak",
      truefalse: "True or False",
      legends: "Legends & History",
      local: "Local Multiplayer",
      chaos: "Chaos Quiz",
    };
    let cardType = "standard";
    let cardData;
    if (mode === "hotstreak") {
      cardType = "hotstreak";
      cardData = { score };
    } else {
      // Club/league quizzes run under mode:"classic" — surface the tribal
      // identity ("Arsenal Quiz — 9/10") instead of a generic Classic label;
      // the club/league name is the single most shareable element.
      const pack = extras?.club ? clubs?.CLUB_PACKS[extras.club] : null;
      const packName = pack ? pack.name
        : extras?.league && LEAGUE_QUIZ_BY_CAT[extras.league] ? LEAGUE_QUIZ_BY_CAT[extras.league].name
        : null;
      cardData = {
        modeLabel: packName ? `${packName} Quiz` : MODE_LABELS[mode] || "Quiz",
        shareLabel: scoreShareLabel(mode, packName),
        score,
        total,
        streak: extras?.streak,
        mode,
      };
    }
    cardData = { ...cardData, deepLink };
    await shareCard(cardType, cardData, { onToast: showToast, textFallback: text });
  }, [showToast]);
  const saveCardImage = useCallback(async () => {
    const correct = stats.totalCorrect || 0;
    const answered = stats.totalAnswered || 0;
    const card = computeCard(stats.catStats || {}, (answered > 0 && correct <= answered) ? correct / answered : 0.4, { c: correct, a: answered }, stats.cardLeague);
    const isDef = (nm) => !nm || nm === "Player" || /^player_/i.test(nm);
    const u = authProfile?.username;
    const name = (u && !isDef(u)) ? u
      : (profile.name && !isDef(profile.name)) ? profile.name
      : `${APP_NAME} Player`;
    const { level } = getLevelInfo(xp);

    // The avatar is the reason this looks like the player's card rather than a
    // generic one, so it is worth waiting for. A photo that will not load falls
    // back to the same colourway + monogram ProfilePic draws on screen — never
    // to a blank circle, which is the failure that component already documents.
    let avatarImg = null;
    const photo = authProfile?.avatar_url;
    if (photo) {
      avatarImg = await new Promise((resolve) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => resolve(im);
        im.onerror = () => resolve(null);
        // Never hang the share on a slow CDN.
        setTimeout(() => resolve(null), 3000);
        im.src = photo;
      });
    }
    const colourway = avatarColour(profile.avatar, user?.id || name);

    await shareCard("iq", {
      card, name,
      levelName: level?.name || "", levelIcon: level?.icon || "🏆", xp: xp || 0,
      avatarImg,
      avatarBg: colourway?.bg,
      initial: firstLetterOf(name),
    }, {
      onToast: showToast,
      textFallback: `${shareLine(card, readCardDelta(), APP_NAME, t)} ${INVITE_BASE_URL}/play`,
    });
  }, [stats, authProfile?.username, authProfile?.avatar_url, profile.name, profile.avatar, user?.id, xp, showToast]);
  const shareProfile = useCallback(async () => {
    // 1.1: share a balliq.app/p?... LINK that renders the player's Ball IQ card as
    // its Open Graph preview (server-rendered via /api/og). On iMessage a single
    // image FILE attaches but iOS strips the caption/link off it — a URL instead
    // gives a tappable link AND a rich card preview across iMessage/WhatsApp/
    // Twitter/Slack. Requires balliq.app to be deployed with api/og + api/p.
    const { level } = getLevelInfo(xp);
    const iq = stats.bestIQ || 0;
    const correct = stats.totalCorrect || 0;
    const answered = stats.totalAnswered || 0;
    const accuracy = (answered === 0 || correct > answered) ? "—" : `${Math.round(100 * correct / answered)}%`;
    const card = computeCard(stats.catStats || {}, (answered > 0 && correct <= answered) ? correct / answered : 0.4, { c: correct, a: answered }, stats.cardLeague);
    const params = new URLSearchParams({
      n: (() => {
        // Prefer the server username (where the set name actually lives) over the
        // local profile.name, mirroring the Home greeting — otherwise a signed-in
        // user's card shows "<App> Player" instead of their name.
        const isDef = (nm) => !nm || nm === "Player" || /^player_/i.test(nm);
        const u = authProfile?.username;
        if (u && !isDef(u)) return u;
        if (profile.name && !isDef(profile.name)) return profile.name;
        return `${APP_NAME} Player`;
      })(),
      l: level.name || "",
      li: level.icon || "⚽",
      x: String(xp || 0),
      g: String(stats.gamesPlayed || 0),
      s: String(loginStreak || 0),
      a: accuracy,
      // ⚠️ EMOJI ONLY. api/og.js renders ?e= as text at 100px; avatar_id is now
      // a colourway ('c07'), so passing one through would print "c07" on a
      // share card. Legacy emoji avatars still work; anything else falls back.
      e: (/^c\d\d$/.test(String(profile.avatar || "")) ? "⚽" : (profile.avatar || "⚽")),
      iq: String(iq || 0),
      // The rating fields are OMITTED until the card is rated. They were sent
      // unconditionally until 2026-09-07, and api/og.js publishes ov at 48px
      // to everyone who sees the unfurl -- so an unrated player was broadcasting
      // a number that is mostly prior, to an audience, from the app's most
      // public surface. api/og.js already falls back to "—" for each of these
      // (og.js:311 and the cell renderer), so leaving them out renders a card
      // with dashes rather than an invented rating.
      ...(card.rated ? {
        ov: String(card.overall),
        ti: card.tier,
        r: card.ratings.map(x => (x.rated ? x.rating : "")).join(","), // unrated face → og.js prints a dash
        // Slot 0 is the sharer's OWN league, and `r` is positional — without
        // this the unfurl would label their La Liga rating "EPL".
        lg: card.ratings[0]?.cat || "PL",
      } : {}),
    });
    const avatarUrl = authProfile?.avatar_url;
    if (avatarUrl) params.set("img", avatarUrl);
    const url = `https://balliq.app/p?${params.toString()}`;
    loopEvent("share-p");
    // Lead with the strongest league and today's move, not the overall alone.
    const text = shareLine(card, readCardDelta(), APP_NAME, t);
    try {
      if (IS_NATIVE) {
        await CapShare.share({ title: APP_NAME, text, url, dialogTitle: t("share.dlgProfile") });
        return;
      }
      if (navigator.share) { await navigator.share({ title: APP_NAME, text, url }); return; }
      if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); showToast(t("share.linkCopied")); return; }
    } catch (e) {
      if (e && (e.name === "AbortError" || /cancel/i.test(e?.message || ""))) return; // user dismissed the sheet
      try { if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); showToast(t("share.linkCopied")); } } catch {}
    }
  }, [xp, stats, profile, loginStreak, showToast, authProfile]);
  return { shareScore, saveCardImage, shareProfile, shareDaily, performDailyShare, submitShareName, cancelShareName, resolveChallengerName, askShareName, askShareNameRef, shareNameDraft, setShareNameDraft, shareNameRef };
}

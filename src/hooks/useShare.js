import { useState, useRef, useCallback } from "react";
import { useModalA11y } from "../useModalA11y.js";
import { computeCard } from "../lib/ballIqCard.js";
import { APP_NAME, getLevelInfo } from "../lib/scoring.js";
import { Share as CapShare } from "@capacitor/share";
import { avatarColour } from "../lib/avatarColour.js";
import { firstLetter as firstLetterOf } from "../components/ProfilePic.jsx";
import { resultVerdict } from "../screens/ModeResults.jsx";
import { loopEvent, shareCard, IS_NATIVE, INVITE_BASE_URL, CLUB_PACKS, LEAGUE_QUIZ_BY_CAT, PACK_TO_CLUB_SLUG, CAT_TO_QUIZ_SLUG } from "../App.jsx";

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
    const total = 7;
    const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const grid = Array.from({ length: total }, (_, i) => i < score ? "✅" : "❌").join("");
    const streakLine = loginStreak > 0
      ? `🔥 ${loginStreak}-day streak`
      : "";
    // 1.1 async challenge: encode score + date (+ challenger name) into the
    // link so a friend who opens it sees "beat my X/7" on today's deterministic
    // Daily 7 and gets a head-to-head compare after they finish. Format:
    // balliq.app/?c=SCORE.YYYYMMDD[.Name]
    const ymd = (() => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; })();
    const challengeUrl = `${INVITE_BASE_URL}/c/${score}.${ymd}${challengerName ? "." + encodeURIComponent(challengerName).replace(/\./g, "%2E") : ""}${user?.id ? `?f=${user.id}` : ""}`;
    const lines = [
      `⚽ ${APP_NAME} Daily 7`,
      `📅 ${dateStr}`,
      `🎯 ${score}/${total}`,
      streakLine,
      "",
      grid,
      "",
      "Think you can beat me?",
      challengeUrl,
    ].filter(Boolean);
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
      if (e && e.name === "AbortError") { loopEvent("share-daily-cancel"); return; }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("📋 Copied to clipboard");
      loopEvent("share-daily-done", { via: "clipboard" });
    } catch {
      showToast("Couldn't share — try again");
    }
  }, [dailyScore, loginStreak, showToast]);
  const shareDaily = useCallback(() => {
    loopEvent("share-daily");
    const who = resolveChallengerName();
    if (!who) { setShareNameDraft(""); askShareNameRef.current = true; setAskShareName(true); return undefined; }
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
  useModalA11y({ isOpen: askShareName, onClose: () => submitShareName(""), ref: shareNameRef });
  const shareScore = useCallback(async (score, total, mode, extras = {}) => {
    // Per-mode plaintext fallback (used only when the image share path
    // fails). Game-result focused — no profile bits.
    const pct = total ? Math.round(score / total * 100) : 0;
    const beat = "Can you beat me? ⚽";
    // opportunity-scan #1: deep-link recipients into the app — and for
    // club/league results, into the exact quiz they were just beaten at.
    const clubSlug = extras?.club ? PACK_TO_CLUB_SLUG[extras.club] : null;
    const quizSlug = extras?.league ? CAT_TO_QUIZ_SLUG[extras.league] : null;
    const deepLink = clubSlug ? `/play?club=${clubSlug}` : quizSlug ? `/play?quiz=${quizSlug}` : "/play";
    const url = `balliq.app${deepLink}`;
    const msgs = {
      daily: (() => {
        const dots = Array.from({length: total}, (_, i) => i < score ? '🟢' : '🔴').join('');
        return `⚽ ${APP_NAME} — Daily 7\n${dots}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      classic: (() => {
        const medal = pct === 100 ? '🏆' : pct >= 80 ? '🔥' : pct >= 60 ? '⚽' : '😅';
        return `${medal} ${APP_NAME} — Classic Quiz\n${resultVerdict(pct)}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      speed:     `⚡ ${APP_NAME} — Speed Round\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      survival:  `🔥 ${APP_NAME} — Survival\n${score} in a row before missing one\n${beat}\n${url}`,
      hotstreak: `⚡🔥 ${APP_NAME} — Hot Streak\n${score} correct in 60 seconds (${total} answered)\n${beat}\n${url}`,
      truefalse: `✅ ${APP_NAME} — True or False\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      legends:   `📜 ${APP_NAME} — Legends & History\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      local:     `🤝 ${APP_NAME} — Local Multiplayer\nFinal scores in — settle it on the rematch.\n${beat}\n${url}`,
      chaos:     `🎭 ${APP_NAME} — Chaos\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
    };
    const text = msgs[mode] || msgs.classic;

    // Couch multiplayer (mode "local"): players rotate through ONE shared
    // question list, so there is no per-player score/total fraction — the
    // standard image card would render a bogus "0/0 · 0% accuracy". Share the
    // podium plaintext directly instead of a card.
    if (mode === "local") {
      try {
        if (IS_NATIVE) {
          await CapShare.share({ title: APP_NAME, text, dialogTitle: "Share result" });
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
        showToast("Copied to clipboard 📋");
      } catch {}
      return;
    }

    // Pick the right card variant + payload for shareCard.
    const MODE_LABELS = {
      classic: "Classic Quiz",
      daily: "Daily 7",
      survival: "Survival",
      hotstreak: "Hot Streak",
      truefalse: "True or False",
      speed: "Speed Round",
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
      const packLabel = extras?.club && CLUB_PACKS[extras.club] ? `${CLUB_PACKS[extras.club].name} Quiz`
        : extras?.league && LEAGUE_QUIZ_BY_CAT[extras.league] ? `${LEAGUE_QUIZ_BY_CAT[extras.league].name} Quiz`
        : null;
      cardData = {
        modeLabel: packLabel || MODE_LABELS[mode] || "Quiz",
        score,
        total,
        streak: extras?.streak,
      };
    }
    cardData = { ...cardData, deepLink };
    await shareCard(cardType, cardData, { onToast: showToast, textFallback: text });
  }, [showToast]);
  const saveCardImage = useCallback(async () => {
    const correct = stats.totalCorrect || 0;
    const answered = stats.totalAnswered || 0;
    const card = computeCard(stats.catStats || {}, (answered > 0 && correct <= answered) ? correct / answered : 0.4);
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
      textFallback: `My Ball IQ is ${card.overall}. Can you beat me? ⚽ ${INVITE_BASE_URL}/play`,
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
    const card = computeCard(stats.catStats || {}, (answered > 0 && correct <= answered) ? correct / answered : 0.4);
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
      ov: String(card.overall),
      ti: card.tier,
      r: card.ratings.map(x => x.rating).join(","),
    });
    const avatarUrl = authProfile?.avatar_url;
    if (avatarUrl) params.set("img", avatarUrl);
    const url = `https://balliq.app/p?${params.toString()}`;
    loopEvent("share-p");
    const text = `Can you beat me at ${APP_NAME}? ⚽`;
    try {
      if (IS_NATIVE) {
        await CapShare.share({ title: APP_NAME, text, url, dialogTitle: "Share your profile" });
        return;
      }
      if (navigator.share) { await navigator.share({ title: APP_NAME, text, url }); return; }
      if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); showToast("Link copied 📋"); return; }
    } catch (e) {
      if (e && (e.name === "AbortError" || /cancel/i.test(e?.message || ""))) return; // user dismissed the sheet
      try { if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); showToast("Link copied 📋"); } } catch {}
    }
  }, [xp, stats, profile, loginStreak, showToast, authProfile]);
  return { shareScore, saveCardImage, shareProfile, shareDaily, performDailyShare, submitShareName, resolveChallengerName, askShareName, askShareNameRef, shareNameDraft, setShareNameDraft, shareNameRef };
}

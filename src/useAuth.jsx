import { useState, useEffect, useRef, createContext, useContext } from 'react'
import * as Sentry from '@sentry/react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { App as CapApp } from '@capacitor/app'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'
import { supabase } from './supabase.js'
import { safeSetItem } from './safeStorage.js'
import { perfMark } from './lib/perf.js'
import { isProfaneUsername } from './lib/profanity.js'
import { unregisterPush } from './lib/push.js'

// Sprint #94 III3: native OAuth uses a custom URL scheme registered in
// ios/App/App/Info.plist (CFBundleURLTypes). Supabase redirects the auth
// flow to this URI after consent; Capacitor's appUrlOpen handler catches
// it and exchanges the code for a session.
const NATIVE_OAUTH_REDIRECT = 'app.balliq://auth/callback'

// Sprint #96 Track 1: native Apple sign-in uses ASAuthorizationController
// via @capacitor-community/apple-sign-in. The JWT issued by Apple has
// aud = bundle ID (not the Services ID used for the web/browser flow).
// Supabase Auth → Providers → Apple → "Client IDs" must include BOTH
// "app.balliq.signin" (web Services ID) AND "app.balliq" (native bundle
// ID) — comma-separated — or signInWithIdToken rejects the JWT with an
// audience-mismatch error. Verified configured 2026-06-10.
const NATIVE_APPLE_BUNDLE_ID = 'app.balliq'

const AuthContext = createContext(null)

// Per-user localStorage keys cleared on sign-out and account delete to
// prevent User A's data from leaking into User B's session on shared
// devices via hydrate's max/union merges. Device-scoped keys (UX
// preferences and dismiss-flags) are intentionally preserved:
//   - biq_settings, biq_first_tip_shown, biq_rate_shown, biq-splash
//   - biq_onboarded (UX dismiss-flag — same-device sign-out followed by
//     re-sign-in should NOT replay onboarding; the original Phase B
//     inclusion was an over-zealous catch-all and caused real-user
//     replay reports. performDelete clears it explicitly since account
//     deletion is the "nuke everything" path.)
//   - biq_install_dismissed (Sprint #34 BB2: 30-day TTL flag set when
//     the user dismisses the "Install Ball IQ" card in Settings. Install
//     state is per-device — preserving on sign-out matches user intent.)
//   - biq_streak_death_ack (UX dismiss-flag — day number of the last
//     acknowledged streak death; keeps the "streak reset" toast one-shot.
//     Safe across accounts: biq_login_streak IS cleared on sign-out, so a
//     new user's first tick has no cached streak and the death check
//     can't fire until a fresh death lands on a new day number.)
//   - ballIQ_guestMode (handled separately by signOut)
const USER_SCOPED_STATIC_KEYS = [
  'biq_xp',
  'biq_stats',
  'biq_login_streak',
  'biq_iq_history',
  'biq_hotstreak_best',
  'biq_skill_level',
  'biq_profile',
  'biq_review_idx',
  'biq_seen_history_v2',
  'biq_pending_join',
  'biq_last_email',
  'biq_mp_history', // Online-tab h2h ledger — per-user W/L record, must not leak across accounts
]
const USER_SCOPED_PREFIXES = ['biq_daily_', 'biq_wordle_']

export function clearAllUserLocalStorage() {
  try {
    for (const k of USER_SCOPED_STATIC_KEYS) localStorage.removeItem(k)
    const matches = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && USER_SCOPED_PREFIXES.some(p => k.startsWith(p))) matches.push(k)
    }
    for (const k of matches) localStorage.removeItem(k)
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  // Sprint #100 guest-first: the Login screen is an on-demand overlay, not
  // the app's front door. authPromptOpen drives it; authPromptReason lets a
  // trigger pass context ('online' / 'friends' / 'leaderboard' / 'save' /
  // 'expired') so the overlay can show a reward-framed header.
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [authPromptReason, setAuthPromptReason] = useState(null)
  // Password-recovery flow: supabase fires PASSWORD_RECOVERY when the user
  // arrives via the balliq.app/reset email link (the recovery session is
  // already active); this mounts the new-password overlay app-wide.
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  // Tracks the currently-authenticated userId for hydrate-race protection.
  // hydrateLocalFromRemote captures userId at start; if this ref no longer
  // matches when hydrate runs, the user has signed out or switched accounts
  // mid-flight and hydrate aborts to avoid leaking the previous user's
  // data into the new session. signOut() invalidates this synchronously
  // BEFORE its supabase.auth.signOut() await so any in-flight hydrate
  // resolved during that await window sees the change and bails.
  const activeUserIdRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id, user)
    } else {
      setProfile(null)
    }
  }, [user?.id])

  useEffect(() => {
    // Sprint #100 guest-first: pre-set guest for instant UI if the user
    // previously chose guest explicitly. We no longer early-return here —
    // getSession + the auth listener ALWAYS run so a guest can convert to
    // an account on demand (via the auth overlay) and be caught below.
    if (localStorage.getItem('ballIQ_guestMode') === 'true') setIsGuest(true)

    perfMark('useAuth: getSession() called');
    supabase.auth.getSession().then(({ data: { session } }) => {
      perfMark(`useAuth: getSession() resolved (user=${!!session?.user})`);
      activeUserIdRef.current = session?.user?.id ?? null
      setUser(session?.user ?? null)
      // Sprint #61 DD3: tag initial-session user. onAuthStateChange handles
      // subsequent sign-ins / sign-outs.
      if (session?.user) {
        try { Sentry.setUser({ id: session.user.id, segment: 'authenticated' }) } catch {}
      } else {
        // Sprint #100 guest-first: no stored session → land in the app as a
        // guest instead of showing a login wall. The Login screen is now an
        // on-demand overlay (openAuthPrompt), not the front door. Guests can
        // play everything except online MP / friends / leaderboards, and are
        // prompted to sign up only when they reach for those.
        setIsGuest(true)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        activeUserIdRef.current = session?.user?.id ?? null
        setUser(session?.user ?? null)
        if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
        if (session?.user) {
          setIsGuest(false)
          setAuthPromptOpen(false)   // close the auth overlay on success
          localStorage.removeItem('ballIQ_guestMode')
          // Sprint #61 DD3: attach user id to every Sentry event so the 2am
          // launch-day debugger can answer "who hit this?". main.jsx's
          // beforeSend already strips email + username so this stays
          // PII-safe — id only.
          try { Sentry.setUser({ id: session.user.id, segment: 'authenticated' }) } catch {}
          // Sprint #100 guest→account convergence. Guarded by the
          // biq_auth_attempt sentinel (set at the start of every USER-
          // INITIATED sign-in/up) so this runs exactly once per real
          // conversion — NEVER on a silent session restore at launch or a
          // background token refresh (either of which would otherwise wipe
          // a returning user's local stats on every app open).
          //
          //   • New / fresh account  → ABSORB. We do NOT clear the user-
          //     scoped localStorage; hydrate's max-merge carries the guest's
          //     XP / stats / streak up into the 0/0 server account and
          //     pushes it on the next sync. The try-before-signup payoff,
          //     identical for email and social.
          //   • Existing account     → WIPE the guest-scoped localStorage so
          //     the real account's remote data is authoritative and a
          //     throwaway guest session can't pollute it. (Also fixes a
          //     latent bug where guest→signin merged into real stats.)
          //
          // Discriminator: account age. created_at is the auth.users
          // creation time, fixed at signup — a brand-new account is < 2 min
          // old; a returning user's is older. The legacy email-signup
          // sentinel also forces "new". biq_pending_join is preserved across
          // a wipe so a guest who followed an invite link, then signed in,
          // still lands in the room.
          try {
            // medical auth-session (low): the sentinel used to be a bare '1'
            // that was never cleared on a failed/cancelled attempt, so it
            // could linger for days and mis-fire the migration on a much
            // later unrelated SIGNED_IN. Now a timestamp with a 10-minute
            // TTL — abandoned attempts expire on their own. ('1' accepted
            // one release for pre-deploy stragglers.)
            const attemptRaw = localStorage.getItem('biq_auth_attempt')
            if (attemptRaw) localStorage.removeItem('biq_auth_attempt') // consume on ANY sign-in, fresh or stale
            const attemptFresh = attemptRaw === '1'
              || (Number(attemptRaw) > 0 && Date.now() - Number(attemptRaw) < 600000)
            if (attemptFresh) {
              const createdAtMs = Date.parse(session.user.created_at || '') || 0
              const isFreshAccount = createdAtMs > 0 && (Date.now() - createdAtMs) < 120000
              const explicitSignup = localStorage.getItem('biq_signup_pending_clear') === '1'
              const isNewSignup = explicitSignup || isFreshAccount
              if (!isNewSignup) {
                // Preserve a few keys across the existing-account wipe:
                //   • biq_pending_join — an invite-link guest still lands in
                //     the room they were headed to.
                //   • TODAY's Footle + Daily-7 — a guest who just played
                //     today's puzzles shouldn't lose them merely by signing
                //     in (1.0.2 fix for "Footle doesn't save"). hydrate's
                //     max-merge still lets the account's own remote state win
                //     if it already completed today on another device, so this
                //     only rescues the same-day progress the guest can see.
                const todayKey = (() => {
                  const d = new Date()
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                })()
                const preserve = {}
                for (const k of ['biq_pending_join', `biq_wordle_${todayKey}`, `biq_daily_${todayKey}`]) {
                  try { const v = localStorage.getItem(k); if (v != null) preserve[k] = v } catch {}
                }
                clearAllUserLocalStorage()
                for (const k of Object.keys(preserve)) {
                  try { localStorage.setItem(k, preserve[k]) } catch {}
                }
              } else if (!explicitSignup) {
                // Fresh SOCIAL sign-up (Apple/Google). Email sign-ups already
                // chose a username at the Login screen (explicitSignup); social
                // ones land on a server default (player_xxxxx). Flag the
                // one-time "pick your username" step — App shows it once
                // authProfile resolves, and clears the flag when done. (1.0.2
                // Feature E.)
                try { localStorage.setItem('biq_needs_username', '1') } catch {}
              }
              // else: new account → keep guest-local; hydrate absorbs it.
              localStorage.removeItem('biq_signup_pending_clear')
            }
          } catch {}
        } else {
          try { Sentry.setUser(null) } catch {}
          // Sprint #100 guest-first: after sign-out or session expiry, drop
          // the user back into the app as a guest (not a login wall).
          setIsGuest(true)
        }
        setLoading(false)

        // Distinguish intentional signOut from Supabase-driven session
        // expiry (refresh token TTL, multi-device rotation invalidation,
        // server-side revocation). signOut() and performDelete() set a
        // localStorage sentinel with a fresh timestamp right before
        // calling supabase.auth.signOut(); if the flag is absent or
        // older than 5s when SIGNED_OUT fires, this was expiry. On expiry
        // we open the auth overlay with an "expired" reason so the user can
        // re-authenticate without losing their place (they're now a guest).
        if (event === 'SIGNED_OUT') {
          let intentional = false
          try {
            const flagAt = parseInt(localStorage.getItem('biq_signout_intentional_at') || '0', 10)
            intentional = flagAt > 0 && (Date.now() - flagAt) < 5000
          } catch {}
          if (!intentional) {
            try { window.dispatchEvent(new CustomEvent('biq:session-expired')) } catch {}
            setAuthPromptReason('expired')
            setAuthPromptOpen(true)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId, userObj) {
    const metaUsername = userObj?.user_metadata?.username
    const fallbackProfile = {
      id: userId,
      username: metaUsername || 'Player',
      avatar_id: '⚽',
      total_score: 0,
      games_played: 0,
      correct_answers: 0,
    }
    setProfile(fallbackProfile)

    try {
      // Phase I cutover: profile metadata + aggregate stats live on `profiles`;
      // game state (daily_*, wordle_state, login_streak) lives on
      // `user_game_state`. Fetch both in parallel and merge so the rest of
      // the app continues to see a unified `profile.*` shape.
      const [profileResult, gameStateResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_game_state').select('*').eq('user_id', userId).maybeSingle(),
      ])

      const { data: profileData, error: profileError, status: profileStatus } = profileResult
      const { data: gameStateData, error: gameStateError, status: gameStateStatus } = gameStateResult

      if (profileError) {
        console.error('[loadProfile] profiles error', { userId, status: profileStatus, code: profileError.code, message: profileError.message, details: profileError.details, hint: profileError.hint })
        return
      }
      if (!profileData) {
        console.warn('[loadProfile] no profile row found for user — keeping metadata fallback', { userId, username: metaUsername })
        // Silent-empty signal: an authenticated user with no profile row means
        // the on-signup trigger never fired or RLS is blocking SELECT. User
        // experience degrades silently to "Player" fallback; Sentry alert
        // routes the regression.
        Sentry.captureMessage('Empty result: profiles row missing for authenticated user', {
          level: 'warning',
          tags: { check: 'empty-profile' },
          extra: { user_id: userId },
        })
        return
      }

      // user_game_state failure is non-fatal: keep going with profile-only
      // data. UI shows fallback/empty for daily/wordle/streak; hydrate falls
      // back to local biq_* cache if present.
      let gameState = null
      if (gameStateError) {
        console.error('[loadProfile] user_game_state error (non-fatal)', { userId, status: gameStateStatus, code: gameStateError.code, message: gameStateError.message })
      } else if (!gameStateData) {
        console.warn('[loadProfile] no user_game_state row for user — trigger should have created one', { userId })
        Sentry.captureMessage('Empty result: user_game_state row missing for authenticated user', {
          level: 'warning',
          tags: { check: 'empty-user-game-state' },
          extra: { user_id: userId },
        })
      } else {
        gameState = gameStateData
      }

      // Merge: profile fields, then explicitly source the 5 game-state
      // columns from gameState. Sprint #69 KK2 dropped these columns from
      // profiles, so the spread no longer carries them — but keep the
      // explicit assignment for shape stability and so a user_game_state
      // fetch failure leaves the keys as undefined (not stale).
      const merged = {
        ...profileData,
        daily_scores:        gameState?.daily_scores,
        daily_wrong_answers: gameState?.daily_wrong_answers,
        daily_all_answers:   gameState?.daily_all_answers,
        wordle_state:        gameState?.wordle_state,
        login_streak:        gameState?.login_streak,
        username: profileData.username || metaUsername || 'Player',
      }
      setProfile(merged)
      // Cross-device sync: max-merge local <-> remote so signing in on a fresh
      // device (or PWA install) restores progress, while never losing newer
      // local progress that hasn't synced yet.
      hydrateLocalFromRemote(userId, merged).catch(e => {
        console.error('[hydrate] failed', e?.message || e)
      })
    } catch (e) {
      console.error('[loadProfile] exception', { userId, error: e })
    }
  }

  // Cross-device sync: takes max(local, remote) for each tracked field and
  // writes the result to localStorage. Read-only with respect to Supabase —
  // saveStats (App.jsx) is the canonical writer via atomic delta RPCs. After
  // resolving, dispatches a custom 'biq:hydrated' event so AppInner can
  // refresh its in-memory xp/stats state (its useState initializers ran once
  // at mount with whatever was in localStorage at the time, so we need to
  // push the new values back through).
  //
  // Why no back-sync to Supabase: previously this function did
  // `update(profiles) SET total_score = finalTotalCorrect` etc. when local
  // was higher than remote. That created a race: if the user reset Supabase
  // to zero (or another device wrote fresh values) while localStorage still
  // held an old higher value, hydration would silently restore the old
  // values, undoing the reset/write. Local-only merge is safe because
  // genuinely-ahead local values get pushed up by the next saveStats RPC.
  //
  // Failure modes:
  //   - Network error reading remote: hydration is a no-op, local values stay
  //     intact. App continues to work offline.
  //   - Empty remote stats column (existing pre-migration users): treated as
  //     {} so local values dominate locally; remote catches up via saveStats.
  async function hydrateLocalFromRemote(userId, remoteProfile) {
    if (!remoteProfile) return
    // Hydrate-race guard: if the active userId no longer matches the one
    // this hydrate was started for, bail without writing. Prevents an
    // in-flight hydrate (started after sign-in's profiles SELECT) from
    // repopulating biq_* keys after a fast sign-out has already wiped
    // them. Diagnostic warning kept enabled in production — if this
    // ever fires we want visibility.
    if (activeUserIdRef.current !== userId) {
      console.warn('[hydrate] aborted — userId changed mid-flight', {
        capturedUserId: userId,
        currentUserId: activeUserIdRef.current,
      })
      return
    }

    let localXp = 0
    try { localXp = parseInt(localStorage.getItem('biq_xp') || '0', 10) || 0 } catch {}
    let localStats = {}
    try { localStats = JSON.parse(localStorage.getItem('biq_stats') || '{}') || {} } catch {}

    const remoteXp = remoteProfile.xp || 0
    const remoteTotalScore = remoteProfile.total_score || 0
    const remoteGamesPlayed = remoteProfile.games_played || 0
    const remoteCorrectAnswers = remoteProfile.correct_answers || 0
    const remoteStats = (remoteProfile.stats && typeof remoteProfile.stats === 'object') ? remoteProfile.stats : {}

    // Per-field max
    const finalXp = Math.max(localXp, remoteXp)
    const finalGamesPlayed = Math.max(localStats.gamesPlayed || 0, remoteGamesPlayed)
    // totalCorrect tracked locally is the canonical "running correct-answers" count;
    // remote stores the same number under both total_score (delta-incremented) and
    // correct_answers (snapshot). Pull max of all three.
    const finalTotalCorrect = Math.max(
      localStats.totalCorrect || 0,
      remoteTotalScore,
      remoteCorrectAnswers
    )
    const bestKeys = ['bestScore', 'bestStreak', 'bestIQ', 'bestHotStreak', 'bestTrueFalse', 'totalAnswered']
    const finalStats = { ...localStats, gamesPlayed: finalGamesPlayed, totalCorrect: finalTotalCorrect }
    for (const k of bestKeys) {
      finalStats[k] = Math.max(localStats[k] || 0, remoteStats[k] || 0)
    }

    // catStats (per-competition {c,a}) powers the Ball IQ card. It's a jsonb map,
    // not a scalar, so it needs its own merge: pick the fuller record per cat
    // (more answers) so a fresh install / new device restores it from remote,
    // while a device with more local play keeps its higher counts. Without this
    // the card resets to a flat all-baseline on every reinstall.
    const localCat = (localStats.catStats && typeof localStats.catStats === 'object') ? localStats.catStats : {}
    const remoteCat = (remoteStats.catStats && typeof remoteStats.catStats === 'object') ? remoteStats.catStats : {}
    const mergedCat = {}
    for (const cat of new Set([...Object.keys(localCat), ...Object.keys(remoteCat)])) {
      const l = localCat[cat] || { c: 0, a: 0 }
      const r = remoteCat[cat] || { c: 0, a: 0 }
      mergedCat[cat] = ((r.a || 0) > (l.a || 0)) ? r : l
    }
    finalStats.catStats = mergedCat

    // Write to localStorage. Hydration is intentionally read-only with respect
    // to Supabase: saveStats (App.jsx) is the canonical writer for aggregate
    // stats via atomic delta RPCs. Letting hydration also write back creates
    // a race where stale localStorage values can overwrite freshly-zeroed or
    // freshly-incremented Supabase values.
    safeSetItem('biq_xp', String(finalXp))
    safeSetItem('biq_stats', JSON.stringify(finalStats))

    // ── Phase 5v: cross-device sync for daily/wordle ──
    // (login_streak removed from hydrate in Phase G — handled by the
    //  tick_login_streak RPC instead.) These two remaining categories are
    // per-day-keyed, so union-merge is safe — there's no "delete a day"
    // operation that a stale local value could undo. Local-only days
    // back-sync up.

    // Daily scores (score per YMD) AND daily wrongAnswers (array per YMD).
    // Phase 5w followup added the wrongAnswers sync; folded into the same
    // merge pass so each per-day localStorage write happens once with
    // both fields. The two remote columns are independent; the local
    // representation keeps both in the same biq_daily_<ymd> record.
    const remoteDailyScores = (remoteProfile.daily_scores && typeof remoteProfile.daily_scores === 'object')
      ? remoteProfile.daily_scores : {}
    const localDailyScores = readLocalMap(/^biq_daily_(\d{4}-\d{2}-\d{2})$/, p => (typeof p?.score === 'number' ? p.score : null))
    const mergedDailyScores = { ...localDailyScores, ...remoteDailyScores }

    const remoteDailyWA = (remoteProfile.daily_wrong_answers && typeof remoteProfile.daily_wrong_answers === 'object')
      ? remoteProfile.daily_wrong_answers : {}
    const localDailyWA = readLocalMap(
      /^biq_daily_(\d{4}-\d{2}-\d{2})$/,
      p => (Array.isArray(p?.wrongAnswers) && p.wrongAnswers.length > 0 ? p.wrongAnswers : null)
    )
    const mergedDailyWA = { ...localDailyWA, ...remoteDailyWA }

    // Phase 5x: full per-question review. allAnswers is the source of
    // truth for the Daily review screen; wrongAnswers is now derivable
    // (filter !isCorrect) but kept in parallel for legacy paths.
    const remoteDailyAA = (remoteProfile.daily_all_answers && typeof remoteProfile.daily_all_answers === 'object')
      ? remoteProfile.daily_all_answers : {}
    const localDailyAA = readLocalMap(
      /^biq_daily_(\d{4}-\d{2}-\d{2})$/,
      p => (Array.isArray(p?.allAnswers) && p.allAnswers.length > 0 ? p.allAnswers : null)
    )
    const mergedDailyAA = { ...localDailyAA, ...remoteDailyAA }

    // One write per day with all three fields. Skip orphan WA/AA entries
    // that somehow lack a score (shouldn't happen, defensive).
    const allDailyDays = new Set([
      ...Object.keys(mergedDailyScores),
      ...Object.keys(mergedDailyWA),
      ...Object.keys(mergedDailyAA),
    ])
    for (const ymd of allDailyDays) {
      const score = mergedDailyScores[ymd]
      if (typeof score !== 'number') continue
      const wrongs = mergedDailyWA[ymd]
      const all = mergedDailyAA[ymd]
      const record = { score }
      if (wrongs) record.wrongAnswers = wrongs
      if (all) record.allAnswers = all
      safeSetItem(`biq_daily_${ymd}`, JSON.stringify(record))
    }

    // Back-sync: one-time per device per user. Pre-launch, no need to
    // batch — at worst a few dozen rows. Flag for batching (chunks of
    // 50 with a delay) if/when this becomes load-bearing.
    const localOnlyDailyDays = Object.keys(localDailyScores).filter(d => !(d in remoteDailyScores))
    if (localOnlyDailyDays.length > 0) {
      Promise.all(localOnlyDailyDays.map(d =>
        supabase.rpc('upsert_daily_score', { p_ymd: d, p_score: localDailyScores[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync daily]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync daily]', e?.message || e))
    }
    const localOnlyDailyWADays = Object.keys(localDailyWA).filter(d => !(d in remoteDailyWA))
    if (localOnlyDailyWADays.length > 0) {
      Promise.all(localOnlyDailyWADays.map(d =>
        supabase.rpc('upsert_daily_wrong_answers', { p_ymd: d, p_wrongs: localDailyWA[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync daily wa]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync daily wa]', e?.message || e))
    }
    const localOnlyDailyAADays = Object.keys(localDailyAA).filter(d => !(d in remoteDailyAA))
    if (localOnlyDailyAADays.length > 0) {
      Promise.all(localOnlyDailyAADays.map(d =>
        supabase.rpc('upsert_daily_all_answers', { p_ymd: d, p_answers: localDailyAA[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync daily aa]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync daily aa]', e?.message || e))
    }

    // Wordle state (full {guesses, status} per YMD).
    const remoteWordleState = (remoteProfile.wordle_state && typeof remoteProfile.wordle_state === 'object')
      ? remoteProfile.wordle_state : {}
    const localWordleState = readLocalMap(/^biq_wordle_(\d{4}-\d{2}-\d{2})$/, p => (
      p && Array.isArray(p.guesses) && typeof p.status === 'string' ? p : null
    ))
    const mergedWordleState = { ...localWordleState, ...remoteWordleState }
    for (const [ymd, st] of Object.entries(mergedWordleState)) {
      safeSetItem(`biq_wordle_${ymd}`, JSON.stringify(st))
    }
    const localOnlyWordleDays = Object.keys(localWordleState).filter(d => !(d in remoteWordleState))
    if (localOnlyWordleDays.length > 0) {
      Promise.all(localOnlyWordleDays.map(d =>
        supabase.rpc('upsert_wordle_state', { p_ymd: d, p_state: localWordleState[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync wordle]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync wordle]', e?.message || e))
    }

    // Login streak removed from hydrate in Phase G (audit finding 2.1) —
    // tick_login_streak RPC is now the single source of truth for the
    // login_streak jsonb column. AppInner's tickLoginStreak useEffect
    // calls the RPC after auth settles; hydrate no longer reads, merges,
    // or writes login_streak.

    // Notify AppInner — its xp/stats/dailyHistory useState initializers
    // already ran with the pre-hydration localStorage values, so they need
    // a kick to pick up the freshly-merged numbers.
    try {
      window.dispatchEvent(new CustomEvent('biq:hydrated', {
        detail: {
          xp: finalXp,
          stats: finalStats,
          dailyScores: mergedDailyScores,
          wordleState: mergedWordleState,
        },
      }))
    } catch {}
  }

  // Scan localStorage for keys matching `pattern`. For each match, parse
  // the stored JSON and run `extract` to either pluck a value or reject
  // (return null). Returns a {ymd: value} map. Used by hydrate for
  // daily_scores / wordle_state local-side reads.
  function readLocalMap(pattern, extract) {
    const out = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        const m = k && k.match(pattern)
        if (!m) continue
        try {
          const p = JSON.parse(localStorage.getItem(k))
          const v = extract(p)
          if (v !== null && v !== undefined) out[m[1]] = v
        } catch {}
      }
    } catch {}
    return out
  }

  async function signUp(email, password, username) {
    Sentry.addBreadcrumb({ category: 'auth', message: 'sign-up attempted', level: 'info' })
    // Sprint #100: mark a user-initiated auth so the SIGNED_IN handler runs
    // the guest→account migration exactly once (and not on session restore).
    try { localStorage.setItem('biq_auth_attempt', String(Date.now())) } catch {}
    // emailRedirectTo lands the confirm link on a GAME path (/play), not the
    // Site URL (=/ marketing). Marketing renders WITHOUT AuthProvider, so the
    // session token Supabase appends to the redirect hash would go unconsumed —
    // the user would confirm, land on the landing page, and still not be logged
    // in. /play mounts GameRoot → useAuth picks up the session → SIGNED_IN runs
    // the guest→account migration. Harmless if not yet allowlisted (Supabase
    // falls back to Site URL = today's behaviour); takes effect once
    // https://balliq.app/play is added to Auth → URL Configuration → Redirect URLs.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username },
        emailRedirectTo: 'https://balliq.app/play',
      }
    })
    if (error) return { error }
    // Prefill the return trip: signup forces an email-confirm round trip that
    // bounces through the browser, so when the user comes back to sign in the
    // address should already be waiting in the form (signIn persists this on
    // success; the signup path previously never did).
    safeSetItem('biq_last_email', email)
    // Sprint #76 RR1: schedule a clear of guest-progress local-storage on
    // the next sign-in. Done at first-signin (not now) because the user
    // is still in guest mode between this signUp and email confirmation —
    // wiping immediately would clear their session state mid-browse.
    //
    // Only set on REAL new signups. Supabase's enumeration-protection
    // returns success with data.user.identities=[] when the email is
    // already registered; that path is handled in Login.jsx with a
    // clarifying message and shouldn't trigger a guest-progress wipe.
    try {
      if (Array.isArray(data?.user?.identities) && data.user.identities.length > 0) {
        localStorage.setItem('biq_signup_pending_clear', '1')
      }
    } catch {}
    return { data }
  }

  async function signIn(email, password) {
    Sentry.addBreadcrumb({ category: 'auth', message: 'sign-in attempted', level: 'info' })
    try { localStorage.setItem('biq_auth_attempt', String(Date.now())) } catch {}
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (!result.error && result.data?.session) {
      // Pre-fill convenience for next visit (post-expiry, re-launch).
      // Cleared by clearAllUserLocalStorage on explicit signOut so a
      // shared device's next user starts blank.
      safeSetItem('biq_last_email', email)
    }
    return result
  }

  // Password reset: sends the recovery email; its link lands on
  // balliq.app/reset (non-/ paths render the game), where the
  // PASSWORD_RECOVERY event above mounts the new-password overlay.
  // NOTE: https://balliq.app/reset must be listed in Supabase Auth →
  // URL Configuration → Redirect URLs or the link falls back to Site URL.
  async function resetPassword(email) {
    Sentry.addBreadcrumb({ category: 'auth', message: 'password-reset requested', level: 'info' })
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://balliq.app/reset' })
  }

  async function updatePassword(newPassword) {
    Sentry.addBreadcrumb({ category: 'auth', message: 'password-update attempted', level: 'info' })
    return supabase.auth.updateUser({ password: newPassword })
  }

  // Sprint #94 III3: social-auth shared helper. Web: standard
  // signInWithOAuth redirect (Supabase handles the browser hop + auto-
  // detects tokens on return). Native: skipBrowserRedirect so we get
  // the consent URL back, then open it via @capacitor/browser; the
  // Supabase auth callback redirects to app.balliq://auth/callback,
  // which Capacitor's appUrlOpen handler catches (App.jsx) and
  // exchanges for a session via exchangeOAuthCallback below.
  //
  // Email collision: Supabase's default for an existing email signed
  // up email/password and then re-attempting via OAuth is to BLOCK with
  // a "User already registered" error. We surface the error verbatim
  // so the user can sign in with their original method and link the
  // OAuth identity from Settings (post-launch task — not blocking V1).
  async function signInWithOAuth(provider) {
    Sentry.addBreadcrumb({ category: 'auth', message: `oauth ${provider} attempted`, level: 'info' })
    try { localStorage.setItem('biq_auth_attempt', String(Date.now())) } catch {}
    const isNative = Capacitor.isNativePlatform?.()
    if (isNative) {
      console.log('[OAuth] start', { provider, redirectTo: NATIVE_OAUTH_REDIRECT })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: NATIVE_OAUTH_REDIRECT,
          skipBrowserRedirect: true,
        },
      })
      if (error) {
        console.log('[OAuth] supabase.signInWithOAuth error', error.message)
        return { error }
      }
      // Surface the redirect_to Supabase embedded in the consent URL so we
      // can tell from logs whether the dashboard allow-list accepted our
      // app.balliq:// scheme. If logs show redirect_to=https%3A%2F%2Fballiq.app
      // (the Site URL), the dashboard hasn't been updated to allow the custom
      // scheme — Supabase silently falls back, the redirect goes to web,
      // and the appUrlOpen listener below never fires.
      try {
        const u = new URL(data?.url || '')
        console.log('[OAuth] supabase returned URL', {
          host: u.host,
          path: u.pathname,
          redirect_to: u.searchParams.get('redirect_to'),
          provider: u.searchParams.get('provider'),
          hasCodeChallenge: !!u.searchParams.get('code_challenge'),
        })
      } catch (e) {
        console.log('[OAuth] could not parse supabase URL', { url: data?.url, err: e?.message })
      }
      if (data?.url) {
        try {
          console.log('[OAuth] opening browser sheet')
          await Browser.open({ url: data.url, presentationStyle: 'popover' })
          console.log('[OAuth] Browser.open resolved — sheet presented')
        } catch (e) {
          console.log('[OAuth] Browser.open threw', e?.message)
          return { error: { message: e?.message || 'Could not open sign-in browser' } }
        }
      }
      // Session arrives asynchronously when the callback URL fires.
      // Caller should not navigate — onAuthStateChange + AppGate will.
      return { data, pending: true }
    }
    // Web / PWA: full-page redirect. After consent, Supabase returns to
    // location.origin with tokens in the URL; the supabase-js client
    // auto-detects + calls onAuthStateChange.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    return { data, error }
  }

  async function signInWithGoogle() { return signInWithOAuth('google') }

  // Sprint #96 Track 1: Apple sign-in. On native iOS, use the system
  // ASAuthorizationController sheet (Face ID, no Safari, in-app) via
  // @capacitor-community/apple-sign-in. On web, full-page redirect
  // through Supabase OAuth (unchanged). If the native path throws
  // anywhere (plugin missing, capability not enabled, audience
  // mismatch, network error mid-flow), we fall back SILENTLY to the
  // browser-based flow (the Sprint #94 path that's known to work) so
  // a single misconfiguration can't brick auth for users — and log a
  // Sentry warning so we still see the failure rate.
  // User cancellations are NOT bubbled through Sentry (they're noise);
  // they return cleanly so Login can clear its loading state.
  async function signInWithApple() {
    Sentry.addBreadcrumb({ category: 'auth', message: 'apple sign-in attempted', level: 'info' })
    try { localStorage.setItem('biq_auth_attempt', String(Date.now())) } catch {}
    const isNative = Capacitor.isNativePlatform?.()
    if (!isNative) return signInWithOAuth('apple')
    try {
      return await signInWithAppleNative()
    } catch (e) {
      const msg = e?.message || ''
      const code = e?.code || e?.errorCode || ''
      // User-cancellation codes vary by error origin: native cancel = 1001
      // (ASAuthorizationErrorCanceled); plugin wraps that as a JS Error
      // with message containing 'canceled' / 'cancelled' / '1001'.
      const isUserCancel =
        /1001|cancell?ed|cancel/i.test(msg) ||
        String(code).includes('1001') ||
        msg.toLowerCase().includes('user canceled')
      if (isUserCancel) {
        console.log('[OAuth] native Apple: user cancelled, no fallback')
        return { error: { message: 'Sign-in cancelled' }, cancelled: true }
      }
      console.log('[OAuth] native Apple failed, falling back to browser', { msg, code })
      try {
        Sentry.captureMessage('Native Apple sign-in fallback to browser', {
          level: 'warning',
          tags: { feature: 'auth-apple-fallback' },
          extra: { error: msg, code },
        })
      } catch {}
      return signInWithOAuth('apple')
    }
  }

  // Sprint #96 Track 1: native Apple via ASAuthorizationController.
  // Generates a raw nonce, SHA-256-hashes it, passes the hash to Apple
  // (Apple embeds it in the issued JWT), then passes the RAW nonce to
  // Supabase's signInWithIdToken which re-hashes and compares. This
  // closes a replay window where a stolen JWT could be re-presented.
  async function signInWithAppleNative() {
    console.log('[OAuth] native Apple sheet — start')
    const rawNonce = (typeof crypto?.randomUUID === 'function')
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const hashedNonce = await sha256Hex(rawNonce)

    // clientId is required by the plugin type but is only used as a
    // fallback for web/Android paths. On iOS native, ASAuthorization
    // derives the audience from the bundle ID automatically. Passing
    // the bundle ID here keeps types happy and matches the Supabase
    // Client IDs allowlist.
    const result = await SignInWithApple.authorize({
      clientId: NATIVE_APPLE_BUNDLE_ID,
      redirectURI: NATIVE_OAUTH_REDIRECT,
      scopes: 'email name',
      state: 'native',
      nonce: hashedNonce,
    })
    console.log('[OAuth] native Apple sheet returned', {
      hasIdentityToken: !!result?.response?.identityToken,
      hasAuthCode: !!result?.response?.authorizationCode,
      hasGivenName: !!result?.response?.givenName,
      hasFamilyName: !!result?.response?.familyName,
      hasEmail: !!result?.response?.email,
      userIdLen: result?.response?.user?.length,
    })

    const idToken = result?.response?.identityToken
    if (!idToken) {
      const err = new Error('Apple sign-in returned no identity token')
      throw err
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
      nonce: rawNonce,
    })
    console.log('[OAuth] signInWithIdToken returned', {
      hasSession: !!data?.session,
      userId: data?.session?.user?.id || data?.user?.id,
      error: error?.message,
    })
    if (error) throw error

    // Sprint #96 Track 2: derive username from Apple's first-sign-in
    // name fields. Apple ONLY sends givenName/familyName on the FIRST
    // sign-in for a given (clientId, Apple ID) pair — including across
    // app uninstalls. Subsequent sign-ins return them as null. Capture
    // here while available; loadProfile + handle_new_user have already
    // created the profile row with the default username by this point.
    const derivedName = [result.response.givenName, result.response.familyName]
      .filter(Boolean).join(' ').trim()
    const user = data?.user || data?.session?.user
    if (derivedName && user) {
      // Fire-and-forget — failure here doesn't fail the sign-in.
      deriveUsernameFromIdentity(user.id, derivedName, 'apple-native').catch(e => {
        console.log('[OAuth] deriveUsernameFromIdentity (apple-native) failed', e?.message)
        try {
          Sentry.captureException(e, { tags: { feature: 'username-derive' }, extra: { source: 'apple-native' } })
        } catch {}
      })
    }

    return { data }
  }

  // Sprint #96 Track 2: SHA-256 → lowercase hex. Used to hash the
  // sign-in-with-Apple nonce per Apple + Supabase spec.
  async function sha256Hex(s) {
    const buf = new TextEncoder().encode(s)
    const digest = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Sprint #96 Track 2: rename the auto-generated profile username to
  // something derived from the provider's full name on first social
  // sign-up. Safe to call multiple times — early-returns if the user
  // has already customised their username (i.e. it doesn't match the
  // server-assigned default shape).
  //
  // Default shapes treated as "needs-override":
  //   - 'Player'                  (client-side fallback in loadProfile)
  //   - /^player_/i              (server-side handle_new_user trigger)
  //   - 'Player_<short-id>'      (some legacy paths)
  //
  // Collision strategy: try base, then "Base 2", "Base 3"... up to 50
  // suffixes. If all collide or the candidate fails the profanity
  // check, silently leave the default in place — user can change it
  // manually in Profile.
  async function deriveUsernameFromIdentity(userId, fullName, source) {
    if (!userId || !fullName) return
    console.log('[OAuth] deriveUsername start', { userId, source, name: fullName })
    const { data: current, error: fetchError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()
    if (fetchError) {
      console.log('[OAuth] deriveUsername: fetch failed', fetchError.message)
      return
    }
    const existing = current?.username || ''
    const isDefault = /^player(_|$)/i.test(existing) || existing === 'Player'
    if (!isDefault) {
      console.log('[OAuth] deriveUsername: existing username is user-set, skipping', existing)
      return
    }
    const cleaned = fullName.trim().replace(/\s+/g, ' ').slice(0, 24)
    if (cleaned.length < 3) {
      console.log('[OAuth] deriveUsername: cleaned name too short, skipping')
      return
    }
    if (isProfaneUsername(cleaned)) {
      console.log('[OAuth] deriveUsername: profanity-filtered, keeping default')
      return
    }
    for (let suffix = 0; suffix < 50; suffix++) {
      const candidate = suffix === 0 ? cleaned : `${cleaned} ${suffix + 1}`
      if (candidate.length > 30) break
      const { data: clash } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', candidate)
        .maybeSingle()
      if (!clash) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: candidate })
          .eq('id', userId)
        if (updateError) {
          // Most common: the SQL profanity trigger blocked it (extra
          // belt-and-braces — we already client-checked) or a race-
          // condition concurrent update from another session. Either
          // way, leave the default in place.
          console.log('[OAuth] deriveUsername: update failed', updateError.message)
          return
        }
        console.log('[OAuth] deriveUsername: set to', candidate)
        return
      }
    }
    console.log('[OAuth] deriveUsername: too many collisions, keeping default')
  }

  // Sprint #96 Track 2: wrapper that extracts a usable display name from
  // a Supabase user (post-browser-flow sign-in) and dispatches to
  // deriveUsernameFromIdentity if present. Fire-and-forget — failure
  // never blocks sign-in. Identity providers expose name under several
  // metadata keys depending on the provider + version of supabase-js,
  // so we check the union.
  function tryDeriveUsernameFromUser(user, source) {
    if (!user) return
    const m = user.user_metadata || {}
    const nameCandidates = [
      m.full_name,
      m.name,
      m.preferred_username,
      [m.given_name, m.family_name].filter(Boolean).join(' '),
      m.display_name,
    ].filter(s => typeof s === 'string' && s.trim().length > 0)
    const name = nameCandidates[0]
    if (!name) {
      console.log('[OAuth] tryDeriveUsernameFromUser: no name in user_metadata', { source, keys: Object.keys(m) })
      return
    }
    deriveUsernameFromIdentity(user.id, name, source).catch(e => {
      console.log('[OAuth] tryDeriveUsernameFromUser failed', e?.message)
      try {
        Sentry.captureException(e, { tags: { feature: 'username-derive' }, extra: { source } })
      } catch {}
    })
  }

  // Sprint #94 III3: called from App.jsx's appUrlOpen handler when a
  // app.balliq://auth/callback URL arrives after OAuth consent. Extracts
  // the PKCE auth code from the URL and exchanges it for a session.
  // Browser.close() drops the in-app browser sheet on success or error
  // (otherwise it hangs around in front of the app on iOS).
  // Sprint #94 III3: native-only listener for the OAuth callback URL
  // (app.balliq://auth/callback?code=...). MUST live in AuthProvider
  // because the user is on the Login screen during sign-in — AppInner
  // is not yet mounted, so its appUrlOpen listener (for /join/ Universal
  // Links) cannot catch the callback. AuthProvider stays mounted across
  // auth states, so this listener fires whenever the URL arrives.
  useEffect(() => {
    if (!Capacitor.isNativePlatform?.()) return
    // Diagnostic: also report the launch URL if the app was cold-started
    // by a deep-link tap (some Supabase + iOS combinations route the
    // callback as a launch rather than appUrlOpen, especially if the app
    // wasn't running when Apple sign-in started).
    CapApp.getLaunchUrl().then(r => {
      if (r?.url) console.log('[OAuth] CapApp.getLaunchUrl on mount', { url: r.url })
    }).catch(e => console.log('[OAuth] getLaunchUrl failed', e?.message))
    let handlePromise = CapApp.addListener('appUrlOpen', e => {
      const url = e?.url
      console.log('[OAuth] appUrlOpen fired', { url })
      if (!url) {
        console.log('[OAuth] appUrlOpen: empty url, ignoring')
        return
      }
      try {
        const u = new URL(url)
        const hashStr = u.hash?.startsWith('#') ? u.hash.slice(1) : (u.hash || '')
        const hashKeys = hashStr ? Array.from(new URLSearchParams(hashStr).keys()) : []
        console.log('[OAuth] appUrlOpen parsed', {
          protocol: u.protocol,
          host: u.host,
          pathname: u.pathname,
          paramKeys: Array.from(u.searchParams.keys()),
          hashKeys,
        })
        if (u.protocol === 'app.balliq:' && (u.host === 'auth' || u.pathname.startsWith('/auth'))) {
          console.log('[OAuth] URL matched auth pattern, calling exchangeOAuthCallback')
          // Fire-and-forget — onAuthStateChange fires AppGate routing on success
          exchangeOAuthCallback(url)
        } else {
          console.log('[OAuth] URL did NOT match auth pattern (protocol+host check failed)')
        }
      } catch (err) {
        console.log('[OAuth] URL parse failed in appUrlOpen', err?.message)
      }
    })
    return () => {
      Promise.resolve(handlePromise).then(h => h?.remove?.()).catch(() => {})
    }
  }, [])

  async function exchangeOAuthCallback(url) {
    console.log('[OAuth] exchangeOAuthCallback start')
    try {
      const parsed = new URL(url)
      // Supabase returns the OAuth result in one of two shapes:
      //   - Implicit flow: tokens in the URL HASH fragment
      //       app.balliq://auth/callback#access_token=...&refresh_token=...
      //     Handler: supabase.auth.setSession({ access_token, refresh_token }).
      //   - PKCE flow: code in the query string
      //       app.balliq://auth/callback?code=...
      //     Handler: supabase.auth.exchangeCodeForSession(code).
      // Native Supabase OAuth currently returns the implicit-flow shape (the
      // earlier 'hasCodeChallenge: false' log on the consent URL confirmed
      // PKCE wasn't engaged). We accept BOTH so future flow changes / web
      // re-use don't break this path.
      const queryParams = parsed.searchParams
      const hashStr = parsed.hash?.startsWith('#') ? parsed.hash.slice(1) : (parsed.hash || '')
      const hashParams = new URLSearchParams(hashStr)

      const code = queryParams.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const errDesc = queryParams.get('error_description') || hashParams.get('error_description')

      console.log('[OAuth] callback parsed', {
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        errDesc,
      })

      if (errDesc) {
        console.log('[OAuth] supabase returned error_description', errDesc)
        try { await Browser.close() } catch {}
        return { error: { message: decodeURIComponent(errDesc) } }
      }

      // Implicit flow: hash fragment carries the session directly.
      if (accessToken && refreshToken) {
        console.log('[OAuth] implicit flow detected — calling setSession')
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        console.log('[OAuth] setSession returned', {
          hasSession: !!data?.session,
          userId: data?.session?.user?.id,
          error: error?.message,
        })
        try { await Browser.close() } catch {}
        if (error) return { error }
        tryDeriveUsernameFromUser(data?.user || data?.session?.user, 'browser-implicit')
        return { data }
      }

      // PKCE flow: query string carries the auth code.
      if (code) {
        console.log('[OAuth] PKCE flow detected — calling exchangeCodeForSession')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('[OAuth] exchangeCodeForSession returned', {
          hasSession: !!data?.session,
          userId: data?.session?.user?.id,
          error: error?.message,
        })
        try { await Browser.close() } catch {}
        if (error) return { error }
        tryDeriveUsernameFromUser(data?.user || data?.session?.user, 'browser-pkce')
        return { data }
      }

      console.log('[OAuth] callback had neither code nor tokens')
      try { await Browser.close() } catch {}
      return { error: { message: 'Auth callback missing code and tokens' } }
    } catch (e) {
      console.log('[OAuth] exchangeOAuthCallback threw', e?.message)
      try { await Browser.close() } catch {}
      return { error: { message: e?.message || 'Auth callback parse failed' } }
    }
  }

  async function signOut() {
    Sentry.addBreadcrumb({ category: 'auth', message: 'sign-out initiated', level: 'info' })
    // Sentinel flag for the auth state listener: marks this SIGNED_OUT
    // as intentional so it won't dispatch biq:session-expired (which
    // would surface a confusing "session expired" banner on Login).
    // Uses localStorage so cross-tab sign-outs propagate the intent;
    // 5s TTL on the read side means a stale flag from an interrupted
    // signOut won't bleed into a later genuine expiry event. Set FIRST
    // so the flag is in place even if anything in the cleanup path
    // below throws.
    try { localStorage.setItem('biq_signout_intentional_at', String(Date.now())) } catch {}

    // Order matters:
    // 1. Invalidate the userId ref synchronously so any in-flight hydrate
    //    (resolved during the supabase.auth.signOut await window below)
    //    sees the mismatch and bails before writing.
    // 2. Wipe user-scoped localStorage keys synchronously so the next
    //    user's hydrate doesn't max/union-merge stale data on shared
    //    devices. Device-scoped keys (settings, UX dismiss-flags) are
    //    preserved by the helper.
    // 3. End the auth session.
    // 4. Clear ballIQ_guestMode + isGuest state.
    const signedOutUid = activeUserIdRef.current
    activeUserIdRef.current = null
    clearAllUserLocalStorage()
    // Drop this device's push token BEFORE ending the session — the delete is
    // RLS-gated on auth.uid(), so it must run while still authenticated. Stops
    // a shared device from receiving pushes for the account that just signed
    // out. Best-effort, native-only (no-ops on web). (medical auth-session.)
    try { await unregisterPush(signedOutUid) } catch {}
    await supabase.auth.signOut()
    localStorage.removeItem('ballIQ_guestMode')
    setIsGuest(false)
  }

  function continueAsGuest() {
    localStorage.setItem('ballIQ_guestMode', 'true')
    setIsGuest(true)
  }

  function exitGuestMode() {
    localStorage.removeItem('ballIQ_guestMode')
    setIsGuest(false)
  }

  // Sprint #100 guest-first: open / close the Login overlay on demand.
  // reason is a short tag a trigger can pass for a contextual header.
  function openAuthPrompt(reason = null) {
    setAuthPromptReason(reason)
    setAuthPromptOpen(true)
  }
  function closeAuthPrompt() {
    setAuthPromptOpen(false)
  }

  // Crops centered to a square and resizes to targetW × targetH, then encodes JPEG.
  async function resizeImageToBlob(file, targetW, targetH) {
    let dataURL
    try {
      dataURL = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = () => reject(new Error('FileReader error: ' + (r.error?.message || 'unknown')))
        r.readAsDataURL(file)
      })
    } catch (e) {
      console.error('[uploadAvatar] resize: FileReader failed', e)
      throw e
    }
    let img
    try {
      img = await new Promise((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error('Image decode failed (format may be unsupported — e.g. HEIC)'))
        i.src = dataURL
      })
    } catch (e) {
      console.error('[uploadAvatar] resize: image decode failed', e)
      throw e
    }
    const side = Math.min(img.width, img.height)
    if (!side) {
      console.error('[uploadAvatar] resize: image has zero dimensions')
      throw new Error('Image has no dimensions')
    }
    const sx = (img.width - side) / 2
    const sy = (img.height - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('[uploadAvatar] resize: could not get canvas 2d context')
      throw new Error('Canvas 2d unavailable')
    }
    ctx.drawImage(img, sx, sy, side, side, 0, 0, targetW, targetH)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))), 'image/jpeg', 0.85)
    })
    return blob
  }

  // Dumps EVERY property of an error-like object — Supabase's storage errors
  // are plain objects (not Error instances), so JSON.stringify can collapse
  // them to "{}" unless we pull props out by name.
  function dumpErr(e) {
    if (!e) return null
    const out = {}
    const keys = [
      'message', 'statusCode', 'status', 'error', 'cause', 'name', 'code',
      'details', 'hint', 'stack', 'originalError', 'body',
    ]
    for (const k of keys) {
      try { if (e[k] !== undefined) out[k] = e[k] } catch {}
    }
    try {
      for (const k of Object.getOwnPropertyNames(e)) {
        if (out[k] === undefined) out[k] = e[k]
      }
    } catch {}
    return out
  }

  // Direct REST-API upload path. Bypasses the supabase-js storage client
  // entirely and POSTs the blob straight to the Supabase Storage endpoint
  // with the current session's Bearer token, so we can see the raw HTTP
  // status + body if anything fails.
  async function uploadAvatar(file) {
    if (!file) {
      console.error('[uploadAvatar] aborted: no file')
      return { error: 'No file provided' }
    }
    // Defensive guard. The primary gate is in App.jsx handleFileChosen
    // (rejects before CropModal opens, where the actual decode/canvas
    // crash happens on low-RAM devices). This catches any future caller
    // that uploads a blob without going through the cropper path.
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'Photo is too large — please pick one under 10MB' }
    }

    // 1. Pull the live session — need the access_token for the Bearer header
    //    and user.id for the object path.
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
    if (sessErr) console.error('[uploadAvatar] getSession error', dumpErr(sessErr))
    const token = sessionData?.session?.access_token
    const userId = sessionData?.session?.user?.id
    if (!token || !userId) {
      console.error('[uploadAvatar] aborted: no session token / user id')
      return { error: 'No session' }
    }

    // 2. Resize/crop to a 400×400 JPEG blob
    let blob
    try {
      blob = await resizeImageToBlob(file, 400, 400)
      if (!blob || blob.size === 0) return { error: 'Empty blob after resize' }
    } catch (e) {
      console.error('[uploadAvatar] resize threw', dumpErr(e))
      return { error: e?.message || 'Resize failed' }
    }

    // 3. Upload via REST — POST /storage/v1/object/avatars/{path}
    const path = `${userId}.jpg`
    const url = `https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/avatars/${path}`
    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: blob,
      })
    } catch (fetchEx) {
      console.error('[uploadAvatar] fetch threw (network-level failure)', dumpErr(fetchEx))
      return { error: fetchEx?.message || 'Network error' }
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '<unreadable body>')
      console.error('[uploadAvatar] Storage upload failed:', response.status, bodyText)
      console.error('[uploadAvatar] response details', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType: response.headers.get('content-type'),
      })
      return { error: bodyText }
    }

    // 4. Build a public URL with a cache-busting query string
    const publicUrl = `https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/public/avatars/${path}?t=${Date.now()}`

    // 5. Persist onto the profile row
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
      if (updErr) {
        console.error('[uploadAvatar] profile update failed', dumpErr(updErr))
      }
    } catch (updEx) {
      console.error('[uploadAvatar] profile update threw', dumpErr(updEx))
    }

    // Auth-boundary guard (Audit Phase 1, Finding 1.1): if the user
    // signed out + signed in as a different account during the upload
    // window (resize + REST POST + profile UPDATE — typically 1-3s),
    // skip the in-memory setProfile so the NEW user doesn't briefly
    // see the OLD user's avatar URL on their profile. The server-side
    // writes already landed correctly against the OLD user's id (storage
    // path + profiles row both used the captured userId), so no server-
    // side leak. This guards the React state only.
    if (activeUserIdRef.current !== userId) {
      return { url: publicUrl }
    }
    // Update in-memory profile so the avatar swaps immediately
    setProfile(prev => (prev ? { ...prev, avatar_url: publicUrl } : prev))
    return { url: publicUrl }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isGuest,
      signUp,
      signIn,
      resetPassword,
      updatePassword,
      passwordRecovery,
      clearPasswordRecovery: () => setPasswordRecovery(false),
      signInWithGoogle,
      signInWithApple,
      exchangeOAuthCallback,
      signOut,
      continueAsGuest,
      exitGuestMode,
      uploadAvatar,
      authPromptOpen,
      authPromptReason,
      openAuthPrompt,
      closeAuthPrompt,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

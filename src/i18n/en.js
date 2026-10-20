// English — THE SOURCE OF TRUTH for every UI string that goes through t().
// Statically imported by src/i18n/index.js, so these bytes are on Home's eager
// path: keep it to UI copy (question text is not i18n's job).
//
// Adding a string: add the key HERE first (English exactly as it renders
// today), then the same key in es.js, then call t('the.key') at the site.
// Keys are flat 'area.name' strings. Placeholders are {name}. Plurals are two
// keys, 'area.thing_one' and 'area.thing_other', chosen by t(key, { count }).
import { FOOTLE_SHORT } from '../lib/modeCopy.js';

export default {
  // Bottom tab bar (App.jsx, the mobile/native tab bar).
  'tab.home': 'Home',
  'tab.online': 'Multiplayer',
  'tab.daily': 'History',
  'tab.profile': 'Profile',

  // Home greeting (components/HomeGreeting.jsx). Time of day, no name.
  'home.greeting.night': 'Still up',
  'home.greeting.morning': 'Good morning',
  'home.greeting.afternoon': 'Good afternoon',
  'home.greeting.evening': 'Good evening',

  // ── Shared words (Home, nav and the screens steps 3-4 will move). ──
  'common.play': 'Play',
  'common.new': 'NEW',
  // The Footle prompt keeps ONE English source, lib/modeCopy.js (see the
  // drift story there and tests/unit/footle-prompt-copy.test.js).
  'mode.footle.short': FOOTLE_SHORT,

  // ── Navigation: the desktop rail (BiqNav.jsx), the web app bar
  // (components/AppBar.jsx), the in-app header (App.jsx). The four tab names
  // are the tab.* keys above, so the three navs cannot disagree.
  'nav.primary': 'Primary',
  'nav.play': 'Play', // the web app bar's first tab: the SITE header is "home" there
  'nav.settings': 'Settings',
  'nav.notifications': 'Notifications',
  'nav.notificationsNew_one': 'Notifications, {count} new',
  'nav.notificationsNew_other': 'Notifications, {count} new',
  'nav.newDot': 'new',
  'nav.getTheApp': 'Get the app',

  // ── The site header (marketing/SiteHeader.jsx): web front door + the app in
  // a browser. Keep in step with scripts/seo/shell-i18n.mjs, which renders the
  // same header as static HTML (its es values are the ones used here).
  'site.homeLabel': 'Ball IQ home',
  'site.sections': 'Sections',
  'site.today': 'Today',
  'site.games': 'Games',
  'site.clubs': 'Clubs',
  'site.quizzes': 'Quizzes',
  'site.lists': 'Lists',
  'site.signIn': 'Sign in',
  'site.find': 'Find your club or league',
  'site.findEmpty': 'Nothing on file called “{q}” yet.',
  'site.findSeeAll': 'See every club',
  'site.findLeague': 'League quiz',
  'site.getAppPill': 'Get app',
  'site.menu': 'Menu',
  'site.closeMenu': 'Close menu',

  // ── Home (screens/HomeScreen.jsx) ──
  'home.streak_one': '{count}-day streak',
  'home.streak_other': '{count}-day streak',
  // The async challenge banner (a friend's "beat my Daily 7" link).
  'home.challenge.by': '{name} challenged you',
  'home.challenge.anon': 'You\'ve been challenged',
  'home.challenge.beat': 'Beat {score}/7 on today\'s Daily 7',
  'home.challenge.beatYesterday': 'Beat {score}/7 (yesterday\'s score) on today\'s Daily 7',
  'home.challenge.dismiss': 'Dismiss challenge',
  // The Today block: status button, rows, the folded "all done" strip.
  'home.today.label': 'Today\'s puzzles',
  'home.today.allDone': '{total}/{total} done',
  'home.today.progress': '{done}/{total} today',
  'home.today.allDoneAria': 'All {total} of today\'s puzzles done — open History',
  'home.today.progressAria': '{done} of {total} puzzles played today — open History',
  'home.row.no': 'No. {n}',
  'home.row.review': 'Review',
  'home.row.continue': 'Continue',
  'home.row.open': 'Open',
  'home.row.doneScore': 'Done · {score}',
  'home.row.ariaPlay': 'Play today\'s {mode}',
  'home.row.ariaReview': 'Today\'s {mode}: done — review',
  // ⚠️ ONE LINE EACH at 320-360 px (see HomeScreen): Spanish is shortened, not English.
  'home.footle.solved': 'Solved in {n}',
  'home.footle.lost': 'Out of guesses',
  'home.footle.inProgress': 'In progress · {n} of 6',
  'home.footle.start': 'Start here · six guesses',
  'home.daily7.sub': '7 questions · ~3 min',
  'home.daily7.ariaPlay': 'Play Daily 7',
  'home.daily7.ariaDone': 'Daily 7 complete: {score} out of 7',
  'home.trail.sub': 'Whose career is this?',
  'home.trail.doneSub': 'Done · today\'s player',
  'home.top10.sub': 'Name all ten · 3 lives',
  'home.top10.found': '{n} of 10 found so far',
  'home.top10.ariaDone': 'Today\'s Top 10: done, {n} out of 10 — review',
  'home.top10.ariaOpen': 'Today\'s Top 10: {n} of 10 found — continue',
  'home.mystery.sub': 'Guess who from clues',
  'home.mystery.doneSub': 'Done · guess who',
  'home.mystery.guessesIn_one': '{count} guess in · keep hunting',
  'home.mystery.guessesIn_other': '{count} guesses in · keep hunting',
  'home.mystery.ariaOpen_one': 'Today\'s Mystery Player: {count} guess in — continue',
  'home.mystery.ariaOpen_other': 'Today\'s Mystery Player: {count} guesses in — continue',
  'home.done.titleFour': 'Today’s four, done',
  'home.done.title': 'Today’s {n}, done',
  'home.done.next': 'New in {time}',
  // Multiplayer row (components/MultiplayerCard.jsx); its name is tab.online.
  'home.mp.openAria': 'Open the Multiplayer tab',
  'home.mp.sub': 'Play your mates live',
  'home.mp.invite': 'Invite',
  'home.mp.inviteAria': 'Create a room and invite friends',
  // Desktop right rail.
  'home.rail.label': 'Your stats',
  'home.rail.anonName': 'Ball IQ Player',
  'home.rail.overall': 'OVERALL',
  'home.rail.unrated': 'Answer 10 questions to get rated',
  'home.rail.viewProfile': 'View full profile →',
  'home.rail.dayStreak': 'Day streak',
  'home.rail.best': 'Best · {n}',
  'home.rail.formAria': 'Login streak: {n} of the last 14 days',
  'home.rail.last14': 'Last 14 days',
  'home.rail.yourForm': 'Your form',
  'home.rail.accuracy': 'Accuracy',
  'home.rail.bestScore': 'Best score',
  'home.rail.strongest': 'Strongest',
  'home.rail.formEmpty': 'Play a game to see your form.',
  // Find a quiz: the club finder (search + chips) and the Quiz row.
  'home.findQuiz': 'Find a quiz',
  'home.finder.placeholder': 'Find your club…',
  'home.finder.label': 'Find your club',
  'home.finder.results': 'Clubs',
  'home.finder.empty': 'No club called “{q}” on file yet.',
  'home.finder.seeAll': 'See every club',
  'home.finder.play': 'Play →',
  'home.finder.chips': 'Most played clubs',
  'home.finder.all_one': 'All {count} clubs →',
  'home.finder.all_other': 'All {count} clubs →',
  'home.quiz.title': 'Quiz',
  'home.quiz.sub': 'Ten questions · any league, era or theme',
  'home.quiz.aria': 'Quiz: ten questions on any league, era or theme',
  // More modes.
  'home.moreModes': 'More modes',
  'home.draft.sub': 'Spin real seasons, build an XI, win the league',
  'home.draft.aria': 'Play the Draft: build an eleven out of real seasons',
  'home.top10lists.title': 'Top 10 lists',
  'home.top10lists.sub': 'Your club’s lists, and every past daily',
  'home.top10lists.aria': 'Top 10 lists: your club\'s lists and every past daily',
  'home.mode.survival': 'Survival',
  'home.mode.survivalDesc': 'One miss, out',
  'home.mode.hotstreak': 'Hot Streak',
  'home.mode.hotstreakDesc': '60 seconds',
  'home.comingSoon': 'Coming soon: {list}',
  // The desktop app-download banner, and the store badges it shares with the rail.
  'home.appBanner.title': 'Take {app} everywhere',
  'home.appBanner.sub': 'Your streak, rating and friends follow your account — on your phone or in any browser.',
  'store.appStore.aria': 'Download on the App Store',
  'store.appStore.eyebrow': 'Download on the',
  'store.play.aria': 'Get it on Google Play',
  'store.play.eyebrow': 'Get it on',

  // Settings → language row (the option names are endonyms in i18n/index.js).
  'settings.language': 'Language',
};

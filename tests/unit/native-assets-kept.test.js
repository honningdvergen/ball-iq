// Two things Alex's screenshot of 28 Nov 2026 showed on one question card: a
// broken-image "?" where Turkey's flag should be, and "Süper Lig" with that
// flag standing over "In which country's top division does Beşiktaş play?".
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { QUIZ_LEAGUE_FLAGS, QUIZ_LEAGUE_COUNTRY, topicAnswersQuestion } from '../../src/lib/quizTopicMarks.js';
import nationFlags from '../../src/data/nationFlags.json';

describe('what the app draws from /public is inside the native app', () => {
  // scripts/prune-native-web-assets.mjs deletes every top-level entry of the
  // native web copy that is not on its allowlist. The flags were added to the
  // app on 26 Nov and not to the list, so builds 194 to 199 shipped without
  // them: every flag was a broken image, with or without a network.
  const prune = readFileSync('scripts/prune-native-web-assets.mjs', 'utf8');
  const keep = new Set([...prune.match(/const KEEP_EXACT = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/^\s*'([^']+)'/gm)].map((m) => m[1]));
  const drawn = [...Object.values(QUIZ_LEAGUE_FLAGS), ...Object.values(nationFlags.files || nationFlags).filter((v) => typeof v === 'string')];

  it('every picture path the flag tables name starts in a folder the prune keeps', () => {
    expect(drawn.length).toBeGreaterThan(50);
    for (const path of drawn) expect(keep.has(path.split('/')[0]), `${path}: its folder is pruned from the native app`).toBe(true);
  });
  it('and the files are really there', () => {
    const have = new Set(readdirSync('public/flags'));
    for (const path of Object.values(QUIZ_LEAGUE_FLAGS)) expect(existsSync(`public/${path}`), path).toBe(true);
    expect(have.size).toBeGreaterThan(100);
  });
});

describe('the topic line never answers the question', () => {
  const besiktas = { cat: 'SuperLig', o: ['Greece', 'Bulgaria', 'Azerbaijan', 'Turkey'], a: 3 };
  it('the question Alex was served: the right answer is the topic\'s country', () => {
    expect(topicAnswersQuestion(besiktas, 'Süper Lig')).toBe(true);
  });
  it('the right answer naming the league itself counts too, accents or not', () => {
    expect(topicAnswersQuestion({ cat: 'SuperLig', o: ['La Liga', 'Super Lig', 'Serie A', 'Ligue 1'], a: 1 }, 'Süper Lig')).toBe(true);
    expect(topicAnswersQuestion({ cat: 'UCL', o: ['Europa League', 'Champions League', 'Cup Winners\' Cup', 'UEFA Cup'], a: 1 }, 'Champions League')).toBe(true);
  });
  it('an ordinary question keeps its topic line', () => {
    expect(topicAnswersQuestion({ cat: 'SuperLig', o: ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor'], a: 0 }, 'Süper Lig')).toBe(false);
    expect(topicAnswersQuestion({ cat: 'PL', o: ['1990-91', '1992-93', '1994-95', '1988-89'], a: 1 }, 'Premier League')).toBe(false);
    expect(topicAnswersQuestion({ cat: 'PL', a: true, type: 'tf' }, 'Premier League')).toBe(false);
  });
  it('every league topic has its country', () => {
    expect(Object.keys(QUIZ_LEAGUE_COUNTRY).sort()).toEqual(Object.keys(QUIZ_LEAGUE_FLAGS).sort());
  });
});

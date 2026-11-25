// ONE SHARE MESSAGE (25 Nov 2026). The four dailies' finishes had two ways to
// share: "Send it to a mate" (a line and the puzzle's link) and "Just share my
// result" (a picture, or a block of text with the date, the number and a
// streak). Alex, to "one button that sends one message, or keep two?": "Yeah go
// with 1 if you think it's right"; and on the lines here: "yeah those look way
// better now, good work".
//
// The message, the same for every daily:
//   one line     what happened, with ONE figure in it, and the dare
//   the squares  Footle only: its coloured rows, never a letter
//   the link     the same puzzle (/c/...), which a chat app shows as a card
// No picture file, no date and no puzzle number in the sentence (his point on
// the first drawings: "too many numbers"). The link's card says the rest.
//
// The line is written by the sharer in the sharer's language (share.one.* in
// i18n/en.js and es.js). The card's title (api/c.js) is about them, in English.
import { t } from '../i18n/index.js';

// A score game's best result gets its own line: there is nothing left to beat.
const ALL = { top10: 10, daily7: 7 };

/**
 * The first line. `score` is what the challenge link carries: the guesses
 * (Footle) or clubs (Transfer Trail) used, 0 when it was not solved; the number
 * right for Top 10 and the Daily 7.
 */
export function shareFirstLine(game, score) {
  const n = Math.max(0, Math.round(Number(score) || 0));
  if (n === 0) return t(`share.one.${game}.lost`);
  if (game === 'footle' || game === 'trail') return n === 1 ? t(`share.one.${game}.first`) : t(`share.one.${game}`, { n });
  return n >= ALL[game] ? t(`share.one.${game}.all`) : t(`share.one.${game}`, { n });
}

/**
 * The whole message. `text` and `url` go to the phone's share sheet as two
 * fields (a target that keeps only one keeps the link); `full` is the same
 * message as one string, for the clipboard, with the link on its own line.
 */
export function shareMessage({ game, score, grid = '', url }) {
  const line = shareFirstLine(game, score);
  const text = grid ? `${line}\n\n${grid}\n` : line;
  return { line, text, url, full: `${text}\n${url}` };
}

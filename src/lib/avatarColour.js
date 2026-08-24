/**
 * A default that is different for every player.
 *
 * ⚠️ MEASURED 2026-08-24: 204 of 219 accounts (93.2%) have no uploaded photo,
 * so they render as the SAME ball image. Names are not the problem — only 5.9%
 * carry an auto-generated `player_xxxx` username; 94% have a real name from
 * Apple or Google. The anonymity is entirely the picture. Friends lists,
 * leaderboards and multiplayer lobbies are a wall of identical balls.
 *
 * Alex, 2026-08-24: *"i think we should have another profile picture default
 * for players too."* One more default still leaves hundreds of people sharing
 * two images, so this derives a distinct one PER PLAYER instead. It costs the
 * user nothing, which matters: the 93% who never open Profile are exactly the
 * people it has to work for.
 *
 * ⚠️ THE COLOURWAY IS STORED IN `avatar_id`, NOT COMPUTED AT RENDER TIME.
 * `avatar_id` already exists, already rides along on every friends/leaderboard/
 * challenge query, and is already passed to ProfilePic at all eight render
 * sites — so persisting it means no call site changes and, more importantly,
 * your colour is the SAME one your friends see. A render-time hash of whatever
 * id happened to be in scope would drift between surfaces, and a player whose
 * face changes depending on which list you view is worse than one shared ball.
 *
 * The previous values were emoji ('⚽', '🏆', '🧠'…), which ProfilePic never
 * rendered — it read `url || BALL_SRC` and ignored `value` entirely. Six
 * players had picked an emoji and were shown a ball anyway. Those legacy values
 * still resolve here (see `avatarColour`), so nobody's stored value breaks.
 */

/**
 * Sixteen colourways. Deliberately not random: each is a football-kit colour
 * that sits on the app's near-black ground without vibrating, and none is the
 * brand green — a player whose avatar is #58CC02 reads as a UI element rather
 * than a person.
 */
export const AVATAR_COLOURS = [
  { id: 'c01', bg: '#C8102E', ink: '#FFFFFF' }, // red
  { id: 'c02', bg: '#034694', ink: '#FFFFFF' }, // royal blue
  { id: 'c03', bg: '#6C1D45', ink: '#FFFFFF' }, // claret
  { id: 'c04', bg: '#0057B8', ink: '#FFFFFF' }, // cobalt
  { id: 'c05', bg: '#FFB81C', ink: '#231F20' }, // amber
  { id: 'c06', bg: '#00A398', ink: '#04231F' }, // teal
  { id: 'c07', bg: '#7A1FA2', ink: '#FFFFFF' }, // purple
  { id: 'c08', bg: '#E8541E', ink: '#1F0A02' }, // orange
  { id: 'c09', bg: '#1B7F3B', ink: '#FFFFFF' }, // forest (distinct from brand)
  { id: 'c10', bg: '#2E3192', ink: '#FFFFFF' }, // indigo
  { id: 'c11', bg: '#B0134D', ink: '#FFFFFF' }, // magenta
  { id: 'c12', bg: '#0E7C9E', ink: '#FFFFFF' }, // sky
  { id: 'c13', bg: '#8C6A1F', ink: '#FFFFFF' }, // bronze
  { id: 'c14', bg: '#495A6B', ink: '#FFFFFF' }, // slate
  { id: 'c15', bg: '#A31515', ink: '#FFFFFF' }, // deep red
  { id: 'c16', bg: '#3D2E86', ink: '#FFFFFF' }, // violet
];

const BY_ID = new Map(AVATAR_COLOURS.map((c) => [c.id, c]));

/**
 * Stable hash. FNV-1a rather than anything cryptographic: this picks a colour,
 * it is not a secret, and it must produce the same answer in the browser, in
 * Node during a backfill, and in SQL if it ever needs reproducing.
 */
export function avatarHash(seed) {
  const s = String(seed || '');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The colourway id a brand-new account should be given. */
export function defaultAvatarId(seed) {
  return AVATAR_COLOURS[avatarHash(seed) % AVATAR_COLOURS.length].id;
}

/**
 * Resolve any stored avatar_id to a colourway.
 *
 * ⚠️ Never returns null. Legacy values ('ball', '⚽', '🏆', and the handful of
 * other emoji still in the table) are hashed to a stable colour rather than
 * rejected, so an old row looks intentional instead of falling back to the one
 * ball this whole change exists to remove.
 */
export function avatarColour(avatarId, fallbackSeed) {
  if (avatarId && BY_ID.has(avatarId)) return BY_ID.get(avatarId);
  const seed = avatarId || fallbackSeed || '';
  if (!seed) return AVATAR_COLOURS[0];
  return AVATAR_COLOURS[avatarHash(seed) % AVATAR_COLOURS.length];
}

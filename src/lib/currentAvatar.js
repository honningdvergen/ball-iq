/**
 * Which avatar id represents the signed-in person, everywhere.
 *
 * ⚠️ WHY THIS EXISTS. Six sites resolved the same fallback chain by hand in TWO
 * ORDERS: the Profile card read the LOCAL profile.avatar first, the Online tab
 * and the multiplayer surfaces read the SERVER avatar_id first. For an account
 * whose local copy was a legacy value the two disagreed — NotMaguire showed
 * forest green on Profile (local '⚽' hashes to c09) and cobalt on Online
 * (server c04). Same person, two colours, on adjacent tabs.
 *
 * The server row is what friends and opponents see and what the picker writes,
 * so it wins whenever there is one. The local value is only for a guest with no
 * row at all. Same shape as friendableOpponents: one function, every caller.
 */
export function currentAvatarId(authProfile, profile) {
  return authProfile?.avatar_id || profile?.avatar || '';
}

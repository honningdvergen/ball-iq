// One small hash, shared by the generator and the app, so a build can tell
// whether a schedule fetched from the site starts with the schedule the build
// itself carries (see top10Remote.js). FNV-1a over the list ids, as eight hex
// digits. Not a secret and not a signature: it guards against a wrong or
// rolled-back file, not against someone who controls the site.
export function logHash(log) {
  let h = 2166136261;
  const s = log.join('\n');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

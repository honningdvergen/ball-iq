import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase.js';

/**
 * Resolve uploaded profile photos for a list of user ids.
 *
 * ⚠️ NEITHER MULTIPLAYER SOURCE CARRIES A PHOTO. `room_players` holds the
 * avatar ID that create_room / join_room were given, and the Online hub's
 * "recent opponents" are rebuilt from local match history — both have a
 * user_id and a monogram colour and nothing else. Alex, twice: "i still do not
 * see my friends chosen profile picture but just the j for his username".
 *
 * It does NOT need a migration. profiles.avatar_url is readable by any
 * signed-in client, so the ids resolve in one query.
 *
 * ⚠️ ONE HOOK, USED EVERYWHERE. The first fix put this inside
 * OnlineMultiplayer and left the Online hub — the screen Alex was actually
 * looking at — still showing monograms. Every avatar surface that has user ids
 * and no photos calls this, or the same bug comes back on whichever screen was
 * missed.
 *
 * Fails silently to monograms: a lobby must never block on decoration.
 */
export function useProfilePhotos(ids) {
  const [photos, setPhotos] = useState({});
  const key = useMemo(
    () => [...new Set((ids || []).filter(Boolean))].sort().join(','),
    [ids]
  );
  useEffect(() => {
    if (!key) { setPhotos({}); return undefined; }
    let alive = true;
    (async () => {
      try {
        // ⚠️ A query builder RESOLVES on error — destructure, never bare-await.
        const { data, error } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', key.split(','));
        if (error) throw error;
        if (!alive) return;
        const map = {};
        for (const r of data || []) if (r.avatar_url) map[r.id] = r.avatar_url;
        setPhotos(map);
      } catch {
        if (alive) setPhotos({});
      }
    })();
    return () => { alive = false; };
  }, [key]);
  return photos;
}

// Headless HOST for verifying the reordered game-over screen + ready-up fix.
// Creates a room, waits for the browser guest, starts a 3-question race,
// advances the clock (host-only RPC), ends, then readies up so the browser
// side can be verified at 1/2 -> 2/2.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('/Users/alexanderbrynolsen/ball-iq/.env.local','utf8')
  .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0,l.indexOf('=')), l.slice(l.indexOf('=')+1).trim()]));
const sb = createClient(env.VITE_SUPABASE_URL || 'https://blcisypmngimqkwxrrdm.supabase.co', env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);

const { data: auth, error: aerr } = await sb.auth.signInAnonymously();
if (aerr) { console.error('anon sign-in failed:', aerr.message); process.exit(1); }
log('host is', auth.user.id);

const created = await sb.rpc('create_room', { p_capacity: 8, p_name: 'Host Bot 7', p_avatar: '' });
if (created.error) { console.error('create failed:', created.error.message); process.exit(1); }
const code = created.data?.code || created.data?.[0]?.code || created.data;
log('ROOM CODE:', JSON.stringify(created.data));

log('holding the lobby for inspection…');
await new Promise(r => setTimeout(r, 150000));
await sb.auth.signOut();
log('done');

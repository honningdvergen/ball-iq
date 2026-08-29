// Headless guest B for the 2-player MP verification. Signs in anonymously
// (the same public flow the "Play as guest" button uses), joins the given
// room, and answers every question until the room ends. No funnel events, no
// scores writes of its own — it exists so the REAL client in the browser tab
// has an opponent and the room can legally start and end.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(readFileSync('/Users/alexanderbrynolsen/ball-iq/.env.local','utf8')
  .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0,l.indexOf('=')), l.slice(l.indexOf('=')+1).trim()]));
const url = env.VITE_SUPABASE_URL || 'https://blcisypmngimqkwxrrdm.supabase.co';
const key = env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!key) { console.error('no anon key in .env.local'); process.exit(1); }

const code = process.argv[2];
if (!code) { console.error('usage: node mp-guest-bot.mjs ROOMCODE'); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false } });
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);

const { data: auth, error: aerr } = await sb.auth.signInAnonymously();
if (aerr) { console.error('anon sign-in failed:', aerr.message); process.exit(1); }
log('guest B is', auth.user.id);

const join = await sb.rpc('join_room', { p_code: code, p_name: 'Headless Bot 42', p_avatar: '' });
if (join.error) { console.error('join failed:', join.error.message); process.exit(1); }
log('joined room', code);

let answered = -1;
for (let tick = 0; tick < 240; tick++) {           // ≤ 4 minutes
  const { data: rooms, error } = await sb.from('game_rooms').select('state,current_question,questions').eq('code', code).limit(1);
  if (error) { log('poll error:', error.message); await new Promise(r=>setTimeout(r,1000)); continue; }
  const room = rooms?.[0];
  if (!room) { log('room gone'); break; }
  if (room.state === 'ended') { log('room ENDED — bot done'); break; }
  if (room.state === 'playing') {
    const q = room.current_question ?? 0;
    if (q !== answered) {
      // Answer the CORRECT option when visible so the race actually scores;
      // fall back to 0. (Phase-1 rooms still carry `correct` in the payload.)
      const qq = Array.isArray(room.questions) ? room.questions[q] : null;
      const idx = (qq && Number.isInteger(qq.correct)) ? qq.correct : 0;
      const res = await sb.rpc('submit_answer', { p_code: code, p_question_idx: q, p_answer_idx: idx, p_lock_time: 2500 });
      if (res.error) log(`answer q${q} error:`, res.error.message);
      else { log(`answered q${q} (idx ${idx})`, JSON.stringify(res.data)); answered = q; }
    }
  }
  await new Promise(r => setTimeout(r, 1000));
}
await sb.auth.signOut();

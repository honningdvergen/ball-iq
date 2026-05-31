// Sprint #84 AAA3 — Report-user + block-user helpers.
// Wraps the user_reports / user_blocks tables created in the matching
// migration. RLS on both tables means these calls only succeed for an
// authenticated user, operating on their own reporter_id / blocker_id.

import { supabase } from '../supabase.js';

export const REPORT_REASONS = [
  { value: 'offensive_username', label: 'Offensive username' },
  { value: 'harassment',         label: 'Harassment' },
  { value: 'spam',               label: 'Spam' },
  { value: 'other',              label: 'Other' },
];

// Submit a report against another user. Returns { error } shape.
// Idempotent per (reporter, reported, reason) via the dedup unique
// constraint — re-submitting the same reason returns the unique-
// violation error, which we map back to a friendlier message.
export async function submitReport({ reportedId, reason, message }) {
  if (!reportedId || !reason) return { error: { message: 'Missing fields' } };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const row = {
    reporter_id: user.id,
    reported_id: reportedId,
    reason,
    message: (message || '').trim() || null,
  };
  const { error } = await supabase.from('user_reports').insert(row);
  if (error) {
    // 23505 = unique_violation (dedup): already reported with this reason
    if (error.code === '23505') {
      return { error: { message: 'You already reported this user with this reason.' } };
    }
    return { error };
  }
  return { error: null };
}

// Block another user. Returns { error } shape. Idempotent — re-blocking
// resolves to a unique-violation that we treat as success.
export async function blockUser(blockedId) {
  if (!blockedId) return { error: { message: 'Missing user' } };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });
  if (error && error.code !== '23505') return { error };
  return { error: null };
}

export async function unblockUser(blockedId) {
  if (!blockedId) return { error: { message: 'Missing user' } };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId);
  return { error: error || null };
}

// Returns a Set<string> of blocked user ids for the caller. RLS limits
// the SELECT to the caller's own blocks. Empty Set on any error so the
// UI fails open (showing all friends) rather than silently hiding them.
export async function listBlockedIds() {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id');
  if (error || !Array.isArray(data)) return new Set();
  return new Set(data.map(r => r.blocked_id));
}

// Symmetric block mask used by friend search / friend list to hide
// users that EITHER side has blocked. Returns Set<string> of user ids
// the viewer should not see anywhere.
//
// Backed by the SECURITY DEFINER RPC get_block_mask() since the table's
// SELECT RLS limits direct queries to your own blocker_id rows — we
// can't read incoming-block rows (people who've blocked us) without
// either loosening RLS (leaks "X blocked me") or going through the
// owner-privileged function. The function returns a SET of UUIDs with
// no direction info, which is the right privacy posture.
//
// Fails open (returns empty set) on any error so the friend list
// doesn't silently lose rows because of a network blip.
export async function listBlockMaskIds() {
  const { data, error } = await supabase.rpc('get_block_mask');
  if (error || !Array.isArray(data)) return new Set();
  // The RPC returns rows like [{ get_block_mask: '<uuid>' }, ...] or
  // sometimes plain uuid strings depending on the supabase-js version.
  return new Set(data.map(r => (typeof r === 'string' ? r : r.get_block_mask)));
}

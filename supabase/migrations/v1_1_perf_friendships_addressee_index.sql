-- 1.1 Perf — friendships.addressee_id was unindexed (only PK + the
-- (requester_id, addressee_id) UNIQUE existed), so the friend-list OR query
-- `.or(requester_id.eq.X, addressee_id.eq.X)` seq-scanned on the addressee leg,
-- the realtime INSERT filter (addressee_id=eq.X) was unindexed, and the FK was
-- flagged by the performance advisor. The composite (addressee_id, status) also
-- covers the incoming-requests derivation (status='pending' AND addressee_id=me).
-- Zero-risk; latency-at-scale fix (invisible at current row counts).
create index if not exists friendships_addressee_id_status_idx
  on public.friendships (addressee_id, status);

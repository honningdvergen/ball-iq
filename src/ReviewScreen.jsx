// Hidden in-app review tool for the question bank. Reachable via Settings →
// Review (only rendered for the gated reviewer email — the gate is in
// App.jsx; this component trusts that whoever reaches it is allowed).
//
// Decisions persist to Supabase table `question_review` keyed by question_id.
// RLS scopes rows to reviewed_by = auth.uid(), so each reviewer only sees and
// writes their own decisions. Local state is the source of truth during the
// session; writes are optimistic with a revert + toast on failure.
//
// MVP only: approve / reject / flag / nav. No inline editing, no filters, no
// bulk ops — those are V2.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from './supabase.js';
import { useAuth } from './useAuth.jsx';
import { QB, TF_STATEMENTS } from './questions.js';

// One stable, ordered pool combining both banks. CHAOS_QB items are already
// inlined into QB at runtime, so they're naturally included here.
const REVIEW_POOL = [
  ...QB.map(q => ({ source: 'qb', q })),
  ...TF_STATEMENTS.map(q => ({ source: 'tf', q })),
];
const TOTAL = REVIEW_POOL.length;
const IDX_KEY = 'biq_review_idx';

const STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FLAGGED:  'flagged',
};

export default function ReviewScreen({ onBack }) {
  const { user } = useAuth();
  const [idx, setIdx] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(IDX_KEY) || '0', 10);
      return Number.isFinite(saved) && saved >= 0 && saved < TOTAL ? saved : 0;
    } catch { return 0; }
  });
  const [decisions, setDecisions] = useState(new Map()); // id -> { status, source, updated_at }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null); // { msg, kind: 'ok'|'err' }

  const item = REVIEW_POOL[idx];
  const id = item?.q?.id;
  const currentStatus = decisions.get(id)?.status || STATUS.PENDING;

  const counts = useMemo(() => {
    let approved = 0, rejected = 0, flagged = 0;
    for (const d of decisions.values()) {
      if (d.status === STATUS.APPROVED) approved++;
      else if (d.status === STATUS.REJECTED) rejected++;
      else if (d.status === STATUS.FLAGGED) flagged++;
    }
    const reviewed = approved + rejected + flagged;
    return { approved, rejected, flagged, reviewed, pending: TOTAL - reviewed };
  }, [decisions]);

  // Initial load
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_review')
        .select('question_id, status, source, updated_at')
        .eq('reviewed_by', user.id);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message || 'Failed to load decisions');
        setLoading(false);
        return;
      }
      const m = new Map();
      for (const row of data || []) {
        m.set(row.question_id, {
          status: row.status,
          source: row.source,
          updated_at: row.updated_at,
        });
      }
      setDecisions(m);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    try { localStorage.setItem(IDX_KEY, String(idx)); } catch {}
  }, [idx]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg, kind = 'ok') => setToast({ msg, kind }), []);
  const advance = useCallback(() => setIdx(i => Math.min(i + 1, TOTAL - 1)), []);
  const back = useCallback(() => setIdx(i => Math.max(i - 1, 0)), []);

  const jumpNextPending = useCallback(() => {
    // Search forward from current position, then wrap.
    for (let step = 1; step <= TOTAL; step++) {
      const j = (idx + step) % TOTAL;
      const status = decisions.get(REVIEW_POOL[j].q.id)?.status;
      if (!status || status === STATUS.PENDING) {
        setIdx(j);
        return;
      }
    }
    showToast('No pending questions left');
  }, [idx, decisions, showToast]);

  const decide = useCallback(async (status) => {
    if (!item || !user?.id) return;
    const targetId = item.q.id;
    const targetSource = item.source;
    const previous = decisions.get(targetId);
    const nowIso = new Date().toISOString();

    // Optimistic local update + advance immediately so the next question is
    // ready before the network round-trip completes.
    setDecisions(prev => {
      const next = new Map(prev);
      next.set(targetId, { status, source: targetSource, updated_at: nowIso });
      return next;
    });
    advance();

    const { error } = await supabase
      .from('question_review')
      .upsert({
        question_id: targetId,
        source: targetSource,
        status,
        reviewed_by: user.id,
      }, { onConflict: 'question_id,reviewed_by' });

    if (error) {
      setDecisions(prev => {
        const next = new Map(prev);
        if (previous) next.set(targetId, previous);
        else next.delete(targetId);
        return next;
      });
      showToast('Save failed: ' + (error.message || 'unknown'), 'err');
    }
  }, [item, decisions, user?.id, advance, showToast]);

  // Keyboard shortcuts. Skip when focus is inside an editable element so we
  // don't intercept typing — currently no inputs exist on this screen, but
  // V2 will add them.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'a')      { e.preventDefault(); decide(STATUS.APPROVED); }
      else if (k === 'r') { e.preventDefault(); decide(STATUS.REJECTED); }
      else if (k === 'f') { e.preventDefault(); decide(STATUS.FLAGGED); }
      else if (k === 'j') { e.preventDefault(); back(); }
      else if (k === 'k') { e.preventDefault(); advance(); }
      else if (e.key === '/') { e.preventDefault(); jumpNextPending(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, back, advance, jumpNextPending]);

  if (loading) {
    return (
      <Frame onBack={onBack}>
        <div style={{padding:24, textAlign:'center', color:'var(--t2)'}}>Loading decisions…</div>
      </Frame>
    );
  }
  if (loadError) {
    return (
      <Frame onBack={onBack}>
        <div style={{padding:20, color:'var(--red)', fontSize:14}}>
          <div style={{fontWeight:700, marginBottom:6}}>Couldn't load decisions</div>
          <div style={{color:'var(--t2)', fontSize:13}}>{loadError}</div>
        </div>
      </Frame>
    );
  }
  if (!item) {
    return (
      <Frame onBack={onBack}>
        <div style={{padding:20}}>No questions in pool.</div>
      </Frame>
    );
  }

  const q = item.q;
  const isMcq = item.source === 'qb';
  const isTf = item.source === 'tf';
  const questionText = isTf ? q.s : q.q;

  return (
    <Frame onBack={onBack}>
      <ProgressStrip idx={idx} counts={counts} />

      <div className="q-card">
        {q.cat && <div className="q-tag">{q.cat}</div>}
        <div className="q-text">{questionText}</div>
      </div>

      {isMcq && Array.isArray(q.o) && (
        <div className="opts">
          {q.o.map((opt, i) => (
            <div key={i} className={`opt${i === q.a ? ' correct' : ''}`} style={{cursor:'default'}}>
              <span className="opt-l">{i === q.a ? '✓' : ['A','B','C','D'][i]}</span>{opt}
            </div>
          ))}
        </div>
      )}

      {isTf && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8}}>
          {[true, false].map(val => {
            const isCorrect = val === (q.a === true || q.a === 1);
            return (
              <div key={String(val)} style={{
                padding:'20px 8px', fontSize:17, fontWeight:800, borderRadius:16, textAlign:'center',
                background: isCorrect ? 'var(--green)' : 'var(--s2)',
                border: '2px solid ' + (isCorrect ? 'var(--green)' : 'var(--border)'),
                color: isCorrect ? '#fff' : 'var(--t3)',
                opacity: isCorrect ? 1 : 0.55,
              }}>
                {isCorrect ? '✓ ' : ''}{val ? 'TRUE' : 'FALSE'}
              </div>
            );
          })}
        </div>
      )}

      <MetadataStrip q={q} source={item.source} />

      <StatusBadge status={currentStatus} />

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:12}}>
        <ActionBtn kind="green"  kbd="A" onClick={() => decide(STATUS.APPROVED)}>✓ Approve</ActionBtn>
        <ActionBtn kind="red"    kbd="R" onClick={() => decide(STATUS.REJECTED)}>✗ Reject</ActionBtn>
        <ActionBtn kind="gold"   kbd="F" onClick={() => decide(STATUS.FLAGGED)}>⚑ Flag</ActionBtn>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:8, marginBottom:24}}>
        <ActionBtn kind="neutral" kbd="J" onClick={back}>← Prev</ActionBtn>
        <ActionBtn kind="neutral" kbd="K" onClick={advance}>Next →</ActionBtn>
        <ActionBtn kind="accent"  kbd="/" onClick={jumpNextPending}>Skip→pending</ActionBtn>
      </div>

      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:700,
          background: toast.kind === 'err' ? 'var(--red)' : 'var(--s1)',
          color: toast.kind === 'err' ? '#fff' : 'var(--t1)',
          border: '1px solid ' + (toast.kind === 'err' ? 'var(--red)' : 'var(--border)'),
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 1000, maxWidth: 'calc(100vw - 32px)',
        }}>
          {toast.msg}
        </div>
      )}
    </Frame>
  );
}

function Frame({ onBack, children }) {
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Review</div>
      </div>
      {children}
    </div>
  );
}

function ProgressStrip({ idx, counts }) {
  return (
    <div style={{padding:'2px 0 14px', fontSize:12, color:'var(--t2)', fontFamily:"'Inter',sans-serif"}}>
      <div style={{
        fontSize:13, fontWeight:800, color:'var(--t1)', marginBottom:6,
        fontFamily:"'JetBrains Mono','SF Mono',monospace", fontVariantNumeric:'tabular-nums',
      }}>
        {idx + 1} / {TOTAL}
      </div>
      <div style={{display:'flex', flexWrap:'wrap', gap:'4px 14px', fontVariantNumeric:'tabular-nums'}}>
        <span style={{color:'#8AE042'}}>✓ {counts.approved}</span>
        <span style={{color:'#FF8080'}}>✗ {counts.rejected}</span>
        <span style={{color:'#FFD24A'}}>⚑ {counts.flagged}</span>
        <span>· {counts.pending} pending</span>
      </div>
    </div>
  );
}

function MetadataStrip({ q, source }) {
  return (
    <div style={{
      marginTop: 14, padding: '12px 14px',
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12,
      fontSize: 12, color: 'var(--t2)',
      fontFamily: "'JetBrains Mono','SF Mono',monospace", lineHeight: 1.6, wordBreak: 'break-word',
    }}>
      <div>
        <Field k="id" v={q.id} /> · <Field k="src" v={source} />
      </div>
      <div>
        <Field k="cat" v={q.cat || '—'} />
        {q.tag != null  && <> · <Field k="tag"  v={q.tag} /></>}
        {q.type != null && <> · <Field k="type" v={q.type} /></>}
        {q.diff != null && <> · <Field k="diff" v={q.diff} /></>}
        {q.v != null    && <> · <Field k="v"    v={q.v} /></>}
      </div>
      {q.hint && (
        <div style={{marginTop:6}}>
          <Field k="hint" v={q.hint} />
        </div>
      )}
    </div>
  );
}

function Field({ k, v }) {
  return (
    <>
      <strong style={{color:'var(--t1)'}}>{k}:</strong> {String(v)}
    </>
  );
}

function StatusBadge({ status }) {
  const style = {
    marginTop: 12, padding: '10px 14px', borderRadius: 12, textAlign: 'center',
    fontSize: 13, fontWeight: 700, fontFamily: "'Inter',sans-serif",
    ...(status === STATUS.APPROVED ? { background: 'rgba(88,204,2,0.15)',  color: '#8AE042', border: '1px solid rgba(88,204,2,0.4)' }
      : status === STATUS.REJECTED ? { background: 'rgba(255,59,48,0.15)', color: '#FF8080', border: '1px solid rgba(255,59,48,0.4)' }
      : status === STATUS.FLAGGED  ? { background: 'rgba(255,193,7,0.15)', color: '#FFD24A', border: '1px solid rgba(255,193,7,0.4)' }
      :                              { background: 'var(--s1)',            color: 'var(--t3)', border: '1px solid var(--border)' }),
  };
  const label =
    status === STATUS.APPROVED ? '✓ Approved' :
    status === STATUS.REJECTED ? '✗ Rejected' :
    status === STATUS.FLAGGED  ? '⚑ Flagged'  :
                                 'Pending review';
  return <div style={style}>{label}</div>;
}

function ActionBtn({ kind, kbd, onClick, children }) {
  const palette = {
    green:   { bg: 'rgba(88,204,2,0.15)',  color: '#8AE042', border: 'rgba(88,204,2,0.4)' },
    red:     { bg: 'rgba(255,59,48,0.15)', color: '#FF8080', border: 'rgba(255,59,48,0.4)' },
    gold:    { bg: 'rgba(255,193,7,0.15)', color: '#FFD24A', border: 'rgba(255,193,7,0.4)' },
    accent:  { bg: 'var(--accent)',        color: '#0a1a00', border: 'var(--accent)' },
    neutral: { bg: 'var(--s1)',            color: 'var(--t1)', border: 'var(--border)' },
  }[kind];
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 6px', fontSize: 13, fontWeight: 800, borderRadius: 12,
        background: palette.bg, color: palette.color, border: '1px solid ' + palette.border,
        cursor: 'pointer', fontFamily: "'Inter',sans-serif", letterSpacing: 0.2,
        display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center',
        minHeight: 56,
      }}
    >
      <span>{children}</span>
      <span style={{fontSize:10, opacity:0.7, fontFamily:"'JetBrains Mono','SF Mono',monospace"}}>{kbd}</span>
    </button>
  );
}

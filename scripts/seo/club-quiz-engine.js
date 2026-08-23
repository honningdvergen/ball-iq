// Club-quiz engine — the inline script shipped on ~140 /quiz/ pages.
//
// ⚠️ THIS FILE EXISTS SO ESLINT CAN SEE IT. It used to live inside a template
// literal in gen-seo-pages.mjs, where every line was a STRING as far as tooling
// was concerned: no no-undef, no no-redeclare, no shadowing check. It is the
// largest body of JavaScript we ship and it was the only one nothing parsed.
//
// That cost a real defect on 2026-08-23. A gesture gate declared a variable
// named "off", colliding with the module-level pagination offset four hundred
// lines up. var is function-scoped, so it shadowed the offset across the whole
// of start(): the handler threw "off is not a function" and clubq-start fired
// on every tap (30.5 per visitor against 1.1), AND the real offset never
// reached module scope, so "Keep going" restarted from question zero. A
// gameplay regression caused by a measurement change, invisible to the build.
// no-redeclare would have caught it in a second.
//
// ⚠️ TWO PLACEHOLDERS are substituted at generation time. They are not valid
// values here and must stay exactly as written. Search for them if you need
// to know what they become.
// Everything else is plain browser JavaScript. Edit it HERE, never in the
// generator, which now only reads this file.

/* ---- ENGINE START (everything above is file documentation) ---- */
(function(){
var root=document.querySelector('.bq[data-total]');if(!root)return;
var list=root.querySelector('.bq-list');if(!list)return;
var qs=[].slice.call(list.querySelectorAll('.bq-q'));if(!qs.length)return;
var total=qs.length,name=root.getAttribute('data-name')||'this club';
var tiers=(root.getAttribute('data-tiers')||'').split('|');
var store=root.getAttribute('data-store')||'#',more=+(root.getAttribute('data-more')||0),badge=root.getAttribute('data-badge')||'';
var play=root.getAttribute('data-play')||'/play';
var cslug=root.getAttribute('data-slug')||'',ccol=root.getAttribute('data-color')||'';
var BANDS=[0,25,45,65,85,100];
function grade(sc,n){var pct=n?Math.round(sc/n*100):0,i=0;for(var g=0;g<BANDS.length;g++){if(pct>=BANDS[g])i=g}
if(pct>=100)i=BANDS.length-1;var iq=[46,54,63,74,88,99][i];return{iq:iq,tier:tiers[i]||'Fan',pct:pct}}
/* ── TODAY'S SET ──────────────────────────────────────────────────────────
   The page ships every question server-rendered in a fixed difficulty arc, and
   that must not change: it is the crawlable text, and it is what a reader with
   JS off gets. What changes is the ORDER a human plays them in.
   WHY: 94.6% of sessions view exactly one page, so 95% of our visitors will
   never see the app, the hub, or another club. A reason to come back has to
   live on THIS page or it does not exist — and a page that is byte-identical
   on every visit offers none. Re-deriving the order per day turns 86 static
   URLs into 86 recurring ones at the cost of a few hundred bytes.
   HOW: xorshift32 seeded on (club name, day number), then the build's
   difficulty arc re-applied so the set still opens easy — momentum matters
   more than novelty on question one.
   ⚠️ Integer bitwise only. This is the same algorithm as seededShuffle in
   src/lib/quiz.js, for the same reason: a Math.sin-seeded sort differs between
   JavaScriptCore and V8 on 137 of 3000 values, which once handed iOS and
   Android players different questions on the same date. */
function bqhash(s){var h=2166136261,i;for(i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*16777619)>>>0}return h>>>0}
function bqday(){var d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)}
/* ── RETURN STREAK ────────────────────────────────────────────────────────
   Lever 1 gives a returning reader a fresh set. Nothing told them it was
   fresh, or gave them a reason to care that it was. A streak does: it is the
   whole engine behind Footle, which is our most-played mode, and it works for
   the 95% who will never create an account because it is one localStorage key
   and nothing else.
   GLOBAL, not per club. A reader who plays Liverpool today and Arsenal
   tomorrow has kept a habit; a per-club streak would call that a miss and
   reset them to zero for doing exactly what we want.
   Advances once per day, on a genuine finish only — landing on the page is
   not a play. Every storage call is wrapped: Safari private mode throws on
   setItem, and a thrown streak must never take the quiz down with it. */
var BQ_SKEY='biq.quiz.streak';
function readStreak(){try{var v=JSON.parse(localStorage.getItem(BQ_SKEY)||'null');
return (v&&typeof v.n==='number'&&typeof v.d==='number')?v:null}catch(e){return null}}
function bumpStreak(){var t=bqday(),c=readStreak();
if(c&&c.d===t)return c.n;
var n=(c&&c.d===t-1)?c.n+1:1;
try{localStorage.setItem(BQ_SKEY,JSON.stringify({n:n,d:t}))}catch(e){}
return n}
function bqshuf(arr,seed){var s=seed>>>0,a=arr.slice(),i,j,t;
function r(){s^=s<<13;s^=s>>17;s^=s<<5;return (s>>>0)/4294967296}
for(i=a.length-1;i>0;i--){j=Math.floor(r()*(i+1));t=a[i];a[i]=a[j];a[j]=t}return a}
function bqarc(a){
var by={easy:[],medium:[],hard:[]},out=[],i,k;
for(i=0;i<a.length;i++){var d=a[i].getAttribute('data-diff');(by[d]||by.medium).push(a[i])}
var want=function(n){return n<2?'easy':['medium','medium','hard'][(n-2)%3]};
var ord={easy:['easy','medium','hard'],medium:['medium','easy','hard'],hard:['hard','medium','easy']};
for(i=0;i<a.length;i++){var o=ord[want(i)],r=null;
for(k=0;k<3;k++){if(by[o[k]].length){r=by[o[k]].shift();break}}
if(!r)break;out.push(r)}
return out}
qs=bqarc(bqshuf(qs,(bqhash(name)^(bqday()*2654435761))>>>0));
for(var dz=0;dz<qs.length;dz++)list.appendChild(qs[dz]);
var run=[],at=0,off=0,served=0,sc=0,streak=0,best=0,rounds=0,started=0,len=Math.min(10,total);
var head=root.querySelector('.bq-head'),meter=root.querySelector('.bq-meter'),sbadge=root.querySelector('.bq-streak');
var res=root.querySelector('.bq-res');
var lenwrap=root.querySelector('.bq-lenwrap');
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* Until 2026-08-13 this engine emitted NOTHING. Clarity was loaded on all 302
   pages and the club quiz — the thing 60% of our traffic actually arrives for —
   fired zero events, so "does anyone finish a quiz" was unanswerable. That is
   how the result screen shipped for two months built around a guess.
   ev() is deliberately total: if clarity is absent (blocked, or the native
   bundle where the loader is guarded off) every call is a no-op, so this adds
   no requests and no native exposure. */
/* bqev now writes to BOTH sinks, and this is not a nicety.
   Until 2026-08-21 these pages reported ONLY into Clarity. That was already
   half-blind (Clarity's export API returns only its own auto-detected smart
   events, so a query for clubq-play comes back empty). Then Clarity became
   consent-gated in Europe on the same day — so for every European visitor who
   declines, the surface carrying roughly 39 percent of all play went
   completely dark. funnel_events is first-party and consent-exempt, so it
   keeps working regardless of the answer, which is exactly why the honest
   design gates the third party and owns the number.
   The visitor id deliberately reuses the app's biq_vid key, so a visitor who
   plays a club page and then opens the app is ONE journey rather than two
   strangers. That crossing is a question nobody has been able to answer.
   Synthetic traffic is refused, matching loopEvent in App.jsx. On 2026-08-21
   the Playwright suite put 767 fake rows into funnel_events in three hours
   against a real DAU of 13 to 17, because localhost reads the production
   Supabase credentials. Robots must not vote. */
function bqSynthetic(){try{
if(navigator.webdriver===true)return true;
var h=location.hostname;
return h==='localhost'||h==='127.0.0.1';
}catch(e){return false}}
function bqVid(){try{
var v=localStorage.getItem('biq_vid');
if(!v){v=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():null;
if(!v)return null;localStorage.setItem('biq_vid',v)}
return (v&&v.length===36)?v:null;
}catch(e){return null}}
/* ⚠️ EVERY ROW USED TO SAY {"surface":"club-page"} AND NOTHING ELSE.
   Checked the distinct set on 2026-08-23: ONE value across all 258 rows, with
   the club slug null on every one — while data-slug sits in the very element
   this function's own siblings already read (see cslug at :1066). So the only
   funnel that reaches anybody could not answer which of 140 pages converts,
   could not compare Liverpool against Wrexham, and could not tell the English
   pages from the localised ones — the split that matters most, since /es/
   River Plate is measured at 134 clicks against 8 for its English twin.
   Every page-level question about this surface was unanswerable by
   construction, and the answer was one line away the whole time. */
function bqev(n){
if(bqSynthetic())return;
try{if(window.clarity)window.clarity('event',n)}catch(e){}
var meta={surface:'club-page'};
try{
  var r=document.querySelector('[data-slug]');
  var s=r&&r.getAttribute('data-slug');if(s)meta.slug=s;
  /* Language identifies the localised layer without needing a second flag:
     the English pages are lang="en", the 42 localised ones carry their own. */
  var lg=document.documentElement.getAttribute('lang');if(lg)meta.lang=lg;
}catch(e){}
try{fetch(BQ_SB+'/rest/v1/rpc/record_funnel_event',{method:'POST',keepalive:true,
headers:{'content-type':'application/json','apikey':BQ_PK,'authorization':'Bearer '+BQ_PK},
body:JSON.stringify({p_event:n,p_meta:meta,p_visitor:bqVid()})}).catch(function(){})}catch(e){}}
function tag(k,v){try{if(window.clarity)window.clarity('set',k,String(v))}catch(e){}}
/* ── OWNING THE MEASUREMENT ──────────────────────────────────────────────────
   Clarity RECORDS these rounds but will not report them by name: custom API
   events aggregate into an unnamed "Other" bucket, so the score distribution
   that gates lever 4 is unreadable. Verified 2026-08-14 that this is not our
   bug — the loader is present, the emit code is correct, 12 clubq- occurrences
   are in the shipped HTML, and 9 distinct events sits well under Clarity's cap
   of 20. It is their reporting model, not our instrumentation.

   So we record it ourselves. One row per FINISHED round, correct/total split by
   DIFFICULTY BAND — which is precisely the lever-4 question: if questions
   labelled "hard" are answered right at roughly the "medium" rate, the label is
   wrong. Band-level rather than per-question because these pages render
   data-diff but carry no stable question id, and the band split already
   answers it.

   NO PERSONAL DATA. No user id, no session id, no free text. A row says
   "someone finished a Liverpool round, 7 of 10, hard 1 of 3" and is not
   joinable to a person. The table grants anon NOTHING — prod's standing
   invariant is zero anon table grants and this keeps it. The only way in is
   log_club_quiz(), SECURITY DEFINER with silent throttles, the same pattern the
   anonymous question-reporter has used since launch.

   The key below is the PUBLISHABLE key, already public in the app bundle. It
   carries no privilege beyond calling that one function.

   ⚠️ The slug is whatever /quiz/<slug>/ holds, so this also captures player and
   category quizzes, not only clubs. That is deliberate — more of the same
   question — but it means the "club" column is really "page slug".

   NOTE FOR EDITORS: this whole block lives inside a template literal. A
   backtick, or a dollar sign immediately followed by a brace, terminates or
   interpolates the string — and every backslash is consumed before it reaches
   the page. Both bit me writing this: a backticked word killed the build, and
   an escaped-slash regex would have emitted as a line comment, silently
   disabling the beacon. The slug is parsed with split() to avoid backslashes
   entirely. Prefer plain words over punctuation in here.

   keepalive:true so a result screen that gets closed still reports. Totally
   failure-tolerant: any throw and the quiz carries on unaffected. */
var BQ_SB='__BQ_SUPABASE_URL__';
var BQ_PK='__BQ_PUBLISHABLE_KEY__';
function logRound(score,rows,rnds){try{
var seg=location.pathname.split('/').filter(Boolean);
if(seg[0]!=='quiz'||!seg[1])return;
var b={easy:[0,0],medium:[0,0],hard:[0,0]},i,d;
for(i=0;i<rows.length;i++){d=String(rows[i].el.getAttribute('data-diff')||'medium').toLowerCase();if(!b[d])d='medium';b[d][1]++;if(rows[i].got===1)b[d][0]++}
fetch(BQ_SB+'/rest/v1/rpc/log_club_quiz',{method:'POST',keepalive:true,
headers:{'content-type':'application/json','apikey':BQ_PK,'authorization':'Bearer '+BQ_PK},
body:JSON.stringify({p_club:seg[1],p_total:rows.length,p_correct:score,p_rounds:rnds,
p_easy_c:b.easy[0],p_easy_t:b.easy[1],p_med_c:b.medium[0],p_med_t:b.medium[1],
p_hard_c:b.hard[0],p_hard_t:b.hard[1]})}).catch(function(){})
}catch(e){}}
function paintMeter(){if(!meter)return;var h='';for(var i=0;i<run.length;i++){var st=run[i].got;h+='<i class="'+(st===1?'ok':st===0?'no':'')+'"></i>'}meter.innerHTML=h}
function show(){
for(var i=0;i<qs.length;i++)qs[i].hidden=true;
if(at>=run.length){return finish()}
var q=run[at].el;q.hidden=false;
var n=q.querySelector('.bq-qn');if(n)n.textContent='Question '+(at+1)+' of '+run.length+(q.getAttribute('data-diff')?' · '+q.getAttribute('data-diff'):'');
if(sbadge)sbadge.hidden=streak<2,sbadge.textContent='▲ '+streak+' streak';
paintMeter()}
function answer(q,rec,k){
var a=+q.getAttribute('data-a'),os=q.querySelectorAll('.bq-o');
for(var b=0;b<os.length;b++){os[b].disabled=true;
if(b===a){os[b].className='bq-o ok';os[b].setAttribute('aria-label','Correct answer: '+os[b].querySelector('.tt').textContent);var kc=os[b].querySelector('.k');if(kc)kc.textContent='✓'}
else if(b===k){os[b].className='bq-o no';os[b].setAttribute('aria-label','Your answer, incorrect: '+os[b].querySelector('.tt').textContent);var kw=os[b].querySelector('.k');if(kw)kw.textContent='✗'}
else os[b].className='bq-o dim'}
/* WCAG 1.4.1 + 4.1.3 on the busiest game surface in the product. Right and
   wrong used to be carried by colour ALONE — the letter chip still read "A"
   and "D" after answering, and under deuteranopia the two chip backgrounds
   simulate to #B4B41C vs #9D9D3A, a luminance ratio of 1.30. Effectively the
   same olive, i.e. no signal at all for roughly 1 in 12 male football fans,
   which is a costly slice of THIS audience specifically. The chip now becomes
   a tick or a cross, so the glyph carries the meaning and the colour merely
   reinforces it. The live region is the screen-reader half: nothing announced
   the outcome at all, so a blind player pressed a button and heard silence. */
var lr=q.querySelector('.bq-sr');
if(lr)lr.textContent=(k===a?'Correct. ':'Incorrect. The answer is ')+os[a].querySelector('.tt').textContent+'.';
var w=q.querySelector('.bq-why');if(w)w.hidden=false;
/* Fired once per round, on the first answer. The gap between clubq-start and
   clubq-play is the honest engagement number: started the quiz vs actually
   answered something. */
if(at===0&&rec.got===-1)bqev('clubq-play');
if(k===a){sc++;streak++;if(streak>best)best=streak;rec.got=1}else{streak=0;rec.got=0}
if(sbadge)sbadge.hidden=streak<2,sbadge.textContent='▲ '+streak+' streak';
paintMeter();
var nx=q.querySelector('.bq-next');if(nx){nx.hidden=false;nx.textContent=(at+1>=run.length)?'See your result →':'Next question →'}}
function finish(){
rounds++;var G=grade(sc,run.length);
bqev('clubq-finish');tag('clubq-rounds',rounds);
var sday=bumpStreak();tag('clubq-streak',sday);if(sday>=2)bqev('clubq-returned');tag('clubq-score',G.pct>=85?'85+':G.pct>=65?'65-84':G.pct>=45?'45-64':'under-45');
logRound(sc,run,rounds);
/* ⚠️ THE PRIMARY ACTION MUST KEEP THEM ON THIS PAGE — but NOT for the reason
   originally written here, which was wrong.

   The original claim: "488 of 516 sessions viewed exactly ONE page — 94.6% …
   nobody navigates onward, ever." Re-measured 2026-08-14 and that figure is
   substantially an instrumentation artifact. Clarity starts a NEW session on
   the club-page → /play navigation: 60 of 202 single-page sessions (30%) carry
   an INTERNAL balliq.app referrer, and sampled recordings show /play sessions
   whose referrerUrl is /quiz/cruyff/ and /quiz/atletico-madrid/, each logged as
   pagesCount:1. Someone who reads a club page and then opens the app is counted
   as TWO one-page sessions. Per journey, onward navigation is roughly 40%.

   The DECISION still stands, on better evidence. Session recordings show
   6m40s/94 clicks and 13m18s/57 clicks on /quiz/cruyff/, both playing multiple
   rounds and using the length picker. People stay because staying is good, not
   because leaving is impossible — so keep the staying action primary, and stop
   treating the app crossing as a rounding error.
   So the club page IS the product for almost every visitor, and the old result
   screen was built for the other 5%: the green primary button was "Play the
   full quiz", which NAVIGATES AWAY, while "Keep going" — the one action that
   works where the reader already is — was secondary and capped at two rounds
   before being swapped for an app-store link.
   Inverted. While questions remain, keeping going is the primary action and the
   cap is gone; a reader who wants a third round should get one. The full-quiz
   link stays, demoted. The app link only appears once we have actually run out
   of questions, which is the first moment it is a genuine next step rather than
   an interruption. */
served=off+run.length;var hasMore=total>served;
/* ⚠️ THE APP LINK NOW SHOWS ON EVERY FINISHED ROUND, not only once the club's
   questions run out. The old gate was a deliberate call — hold the app link
   back until it is "a genuine next step rather than an interruption" — but
   measurement on 2026-08-22 showed what it cost: the median club carries 40
   hint-bearing questions against a 10-question round, 68 of 88 clubs need
   three or more rounds, and only 2 could be exhausted in one sitting. So the
   link was not weak, it was unreachable: clubq-out-store recorded ZERO clicks
   because it had rendered to essentially nobody.
   The intent survives intact. Finishing a round is itself the proof of
   interest the gate was waiting for, and "Keep going" remains the primary
   action, so staying on the page is still what the layout pushes hardest.
   Ordering is deliberate: stay here, then play on the web, then install. */
var appLink='<a href="'+store+'" rel="noopener">Get the app — a new one daily →</a>';
var cont=(hasMore
?'<a class="bq-go" href="#quiz" data-more="1">Keep going — '+(total-served+more)+' more →</a>'
+'<a class="bq-cross" href="'+play+'">Play the full '+esc(name)+' quiz →</a>'
+appLink
:'<a class="bq-go" href="'+play+'">Play the full '+esc(name)+' quiz →</a>'
+appLink);
res.innerHTML=(badge?'<div class="bq-crest">'+esc(badge)+'</div>':'')+'<div class="bq-rank">Your '+esc(name)+' IQ</div><div class="bq-big">'+G.iq+'</div>'
+'<span class="bq-tier">'+esc(G.tier)+'</span>'
+'<div class="bq-sub">'+sc+' of '+run.length+' · best streak '+best+'</div>'
+(sday>=2?'<div class="bq-days">'+sday+' days in a row</div>':'')
+'<div class="bq-row">'+cont+'<button class="ghost" data-again="1">Play again</button></div>'
/* Share sits BELOW the green row, not above it. Keeping the reader on the page
   is still the primary action (that decision came from the 94.6% single-page
   measurement); share is the authority lever and gets full width and the club's
   colour, but it does not outrank staying. */
+'<button class="bq-share" data-share="1">Share your '+esc(name)+' IQ</button>'
+(!hasMore?'<p class="bq-note">That is every '+esc(name)+' question we have here. There is a new daily game in the app, plus your streak.</p>':'');
res.hidden=false;if(head)head.hidden=true;
var m=res.querySelector('[data-more]');if(m)m.addEventListener('click',function(e){e.preventDefault();bqev('clubq-more');start(len,served)});
var ag=res.querySelector('[data-again]');if(ag)ag.addEventListener('click',function(){bqev('clubq-again');start(len,off)});
/* The two ways OFF the page. Tracked so that choosing to optimise for staying
   cannot quietly kill the app funnel without us noticing — the guardrail on
   the whole rebuild. */
var outs=res.querySelectorAll('a[href]');
for(var oi=0;oi<outs.length;oi++)(function(el){el.addEventListener('click',function(){
if(el.hasAttribute('data-more'))return;bqev(el.getAttribute('href')===play?'clubq-out-play':'clubq-out-store')})})(outs[oi]);
var sh=res.querySelector('[data-share]');if(sh)sh.addEventListener('click',function(){bqev('clubq-share');
/* THE AUTHORITY LEVER. Our ranking ceiling is links, not pages — 11 referral
   sessions in the week to 2026-08-13 — and a score is the one thing a football
   fan will voluntarily paste into a group chat. Sharing location.href unfurled
   the club's generic card, identical whether you scored 2 or 10, so there was
   nothing in the preview worth pasting.
   /iq/<slug>.<iq>.<score>.<total> is an edge-rendered card carrying the club's
   colour, the number and the club's own word for it. Humans who tap it land on
   the CLUB PAGE, not the app — so the loop can produce another share. */
var u=location.href.split('#')[0].split('?')[0];
if(cslug){var t=cslug+'.'+G.iq+'.'+sc+'.'+run.length;
var qp='?n='+encodeURIComponent(name)+'&r='+encodeURIComponent(G.tier);
if(badge)qp+='&b='+encodeURIComponent(badge);
if(ccol)qp+='&c='+encodeURIComponent(ccol.replace('#',''));
u=location.origin+'/iq/'+t+qp}
var txt='My '+name+' IQ is '+G.iq+' — '+G.tier+' ('+sc+'/'+run.length+'). Beat that.';
if(navigator.share){navigator.share({title:name+' quiz',text:txt,url:u})['catch'](function(){})}
else if(navigator.clipboard){navigator.clipboard.writeText(txt+' '+u).then(function(){sh.textContent='Copied ✓'})}
else{window.prompt('Copy your score',txt+' '+u)}})
/* Lever 3: the length picker moves OUT of the pre-quiz position and appears
   here instead. Meeting "How many questions?" before a single question is
   spending the highest-attention moment of the session on admin — they typed
   "liverpool quiz" into Google and had already decided. After a round it stops
   being a toll and becomes an offer to someone who now knows if they like it. */
if(lenwrap)lenwrap.hidden=false}
function start(n,from){
/* Only the FIRST start counts as a start. "Play again" and "Keep going" have
   their own events, so clubq-start stays a clean session-level denominator:
   clubq-play/clubq-start = did they engage, clubq-finish/clubq-start = did
   they get to the end. */
if(!rounds&&!started){started=1;tag('clubq-len',n);
/* ⚠️ THE EVENT WAITS FOR A HUMAN; THE QUIZ DOES NOT.
   start() runs unconditionally at the end of this script (see the bq-live
   line), so emitting here counted every JS-executing render as a session —
   including Googlebot's renderer and, verified in the table on 2026-08-21,
   two PageSpeed Insights runs. bqSynthetic() cannot help: it refuses
   navigator.webdriver and localhost, and a crawler's headless Chrome is
   neither. No user-agent blocklist catches a real browser either.
   A gesture does. Rendering stays immediate so the reader sees the quiz at
   once; only the MEASUREMENT waits for evidence that a person is present,
   which makes the denominator robot-proof by construction rather than by
   enumeration. Same shape the taster uses. */
/* ⚠️ bqFire/bqOff, NOT fire/off. The first version of this declared a
   variable named "off" — which is ALREADY module state four hundred lines up,
   the pagination offset in: var run=[],at=0,off=0,...
   var is function-scoped, not block-scoped, so it shadowed the offset across
   the whole of start(), and start() assigns off=from further down. One name,
   two failures:
     - off became a number, so the handler threw "off is not a function", the
       listener never detached, and clubq-start fired on EVERY tap: 30.5
       events per visitor against 1.1 before the change meant to REDUCE
       over-counting.
     - The real offset never reached module scope, so Play again restarted
       from question 0 instead of serving the next batch. A gameplay
       regression, caused by a measurement change.
   Neither showed up in the build: this lives inside a template literal, so
   ESLint never parses it. Found by reading the numbers the instrument
   produced, then catching the TypeError in the live page.
   Prefix anything declared in here. */
var bqFire=function(){bqev('clubq-start');bqOff()};
var bqOff=function(){
try{root.removeEventListener('pointerdown',bqFire);root.removeEventListener('keydown',bqFire);
root.removeEventListener('touchstart',bqFire)}catch(e){}};
try{root.addEventListener('pointerdown',bqFire,{once:false});
root.addEventListener('keydown',bqFire,{once:false});
root.addEventListener('touchstart',bqFire,{once:false,passive:true})}catch(e){}}
/* ⚠️ NO BACKTICKS OR DOLLAR-BRACES ANYWHERE IN THIS BLOCK — it lives inside a
   template literal, so either one ends the string and the build dies with a
   syntax error pointing at the comment rather than the code.
   The offset parameter is why start() takes two arguments. "Keep going — 30
   more" used to
   call start(20), and start always filled from qs[0] — so a reader who had just
   answered ten questions was handed those same ten again, followed by ten new
   ones. The button promised new material and delivered a replay, which is
   corrosive in exactly the place we are asking someone to stay.
   Now: "Keep going" advances past what has been served, "Play again" replays
   the round just finished (same offset), and a fresh length pick restarts. */
if(from==null)from=0;
off=from;
len=n;res.hidden=true;if(head)head.hidden=false;if(lenwrap)lenwrap.hidden=true;
run=[];sc=0;at=0;streak=0;best=0;
for(var i=from;i<qs.length&&run.length<n;i++){
var q=qs[i];run.push({el:q,got:-1});
var os=q.querySelectorAll('.bq-o');
/* Restore the LETTER on replay. answer() overwrites the chip with a tick or a
   cross, so resetting the class alone would leave a board of ticks on the
   second run through. */
for(var b=0;b<os.length;b++){os[b].disabled=false;os[b].className='bq-o';os[b].removeAttribute('aria-label');var kr=os[b].querySelector('.k');if(kr)kr.textContent='ABCD'.charAt(b)}
var sr=q.querySelector('.bq-sr');if(sr)sr.textContent='';
var w=q.querySelector('.bq-why');if(w)w.hidden=true;
var nx=q.querySelector('.bq-next');if(nx)nx.hidden=true}
show()}
list.addEventListener('click',function(ev){
var o=ev.target.closest?ev.target.closest('.bq-o'):null;
if(o&&!o.disabled){var q=o.closest('.bq-q');answer(q,run[at],+o.getAttribute('data-i'));return}
var nx=ev.target.closest?ev.target.closest('.bq-next'):null;
if(nx){at++;show();
/* ⚠️ ALWAYS BRING THE NEW QUESTION INTO VIEW. This used to scroll only when the
   card had already left the top of the viewport (top<0), which is precisely
   backwards. "Next question →" sits at the BOTTOM of the answered question, so
   the reader is looking at the foot of the card when they click; the next
   question then renders ABOVE that point and, with the card still nominally in
   view, nothing moved. The click appeared to do nothing.
   Clarity scored it exactly that way: "Next question →" is the single most
   dead-clicked element on the club pages by a wide margin, ahead of everything
   else combined. Not a broken handler — a handler that worked invisibly.
   Scrolling unconditionally costs a little motion when the card is already
   framed, and removes an interaction that reads as a dead button. */
var c=root.querySelector('.bq-card');
if(c&&c.scrollIntoView){try{c.scrollIntoView({block:'start',behavior:'smooth'})}catch(e){c.scrollIntoView(true)}}}});
var lens=root.querySelectorAll('.bq-len button');
for(var i=0;i<lens.length;i++)lens[i].addEventListener('click',function(e){
var v=+e.currentTarget.getAttribute('data-n');
for(var j=0;j<lens.length;j++)lens[j].setAttribute('aria-pressed',lens[j]===e.currentTarget?'true':'false');
start(v,served>=total?0:served)});
var dl=root.querySelector('.bq-daily');
if(dl&&total>=24){var dtx=dl.querySelector('.bq-dtx');
if(dtx){var dd=new Date();
dtx.appendChild(document.createElement('b')).textContent='Today\u2019s '+name+' set';
dtx.appendChild(document.createTextNode(' \u00b7 '+dd.toLocaleDateString(undefined,{day:'numeric',month:'long'})+' \u2014 a fresh order every day'));
dl.hidden=false}}
/* The ribbon carries its own base text only on 24+ question clubs. On a thin
   one it is empty, so appending " · day 4" produced a dangling fragment
   reading "· day 4 ✓". When there is nothing to append to, the
   streak becomes the ribbon's own label instead. */
var sv=readStreak(),td=bqday();
if(dl&&sv&&sv.n>=2&&(sv.d===td||sv.d===td-1)){var dx=dl.querySelector('.bq-dtx');
if(dx){var msg=sv.d===td?'day '+sv.n+' ✓':'day '+sv.n+' — keep it going';
if(dx.textContent){dx.appendChild(document.createTextNode(' · '+msg))}
else{dx.appendChild(document.createElement('b')).textContent='Your streak';
dx.appendChild(document.createTextNode(' '+msg))}}
dl.hidden=false}
root.classList.add('bq-live');start(Math.min(10,total));
})();
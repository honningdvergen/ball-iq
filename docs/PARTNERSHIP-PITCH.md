# The weekly-quiz partnership — pitch kit

**Status: Alex-executable. Nothing here gets sent by anyone but Alex.**

Written 2026-08-03, off the back of the competitor analysis. This is the only
lever we found that raises the whole domain rather than one page at a time.
Everything else on the SEO list redistributes the ~20,200 impressions we
already have; this is what adds a zero to them.

---

## Why this works — the mechanic, copied from a competitor who is beating us

`fcquiz.app` is a Norwegian operation at roughly 27K visits/month, and it
appears in the "football quiz" SERP we are stuck on page 4 of. It did not get
there with better pages. It got there like this:

> **FotMob publishes a "Premier League Quiz" every Friday, built by fcQuiz.**
> Each article carries **two dofollow links** back to fcquiz.app. The article
> is syndicated across FotMob's locale tree — the same article ID appears at
> `/hi/`, `/ko/`, `/fa/`, `/ja/`, `/pt-BR/` and root.

One weekly quiz → **a dozen-plus linking URLs from a top-tier football domain,
every single week, forever, for free.** Plus a co-branded hub on fcQuiz's own
domain (`fcquiz.app/clubs/fotmob`) that FotMob links into.

The publisher's side of the trade is the important half: **they get free
recurring content their audience loves and they do zero work.** Football media
wants quizzes — Planet Football ships them daily, FourFourTwo has an archive,
Squawka runs a quiz section. What they lack is a question bank and the tooling.
We have both.

## ⭐ The angle that makes this a strong pitch instead of a beg

**FotMob is taken. Its direct competitors are not — and they are now visibly
behind on a feature.** Sofascore, OneFootball and Flashscore all compete with
FotMob for the same score-app audience, and none of them ships a weekly quiz.

That reframes the email completely. It is not "please link to me." It is
"your biggest rival launched a weekly quiz feature; I will build and run yours
for free, starting Friday." Same reason FotMob said yes, with added urgency.

**Alex is Norwegian, and so are FotMob and fcQuiz.** Norwegian football media
(Josimar, NRK Sport, TV2, Nettavisen, VG) is a warm door that an English or
American solo dev does not have. Use it — a Norwegian-language pitch to a
Norwegian outlet has a far higher hit rate than a cold English one to 90min.

---

## What we can truthfully claim (all verified 2026-08-03 — do not inflate)

- **A large, checked question bank.** ⚠️ NEVER print the exact count — not
  even here. The rule is binding and I already talked myself past it once by
  deciding a B2B pitch was an exception. It is not. "Thousands of questions,
  every one checked" says the same thing and cannot go stale.
- **72 club packs** and 17 categories, so a partner can have any club or
  competition angle they want, on request.
- **81% of questions carry an explanation.** Say "most", never "every" — the
  App Store copy was corrected for exactly that overclaim.
- **194 live pages**, iOS and Android both shipping, plus two daily games
  (Footle, a football Wordle; Transfer Trail, a career-path guessing game).
- **20,200 Google impressions in 90 days**, growing. Honest framing: small but
  real and rising. Do not imply scale we do not have — a publisher can check.

---

## Tier 1 targets — score apps with a competitive gap (best odds)

| Target | Why them | Angle |
|---|---|---|
| **Sofascore** | FotMob's biggest direct rival; huge audience; no quiz feature | The competitive-gap pitch, verbatim |
| **OneFootball** | Editorial-heavy, publishes constantly, no quiz engine | Free weekly content for a content-hungry newsroom |
| **Flashscore** | Enormous reach, thin editorial | Cheapest possible way to add engagement content |

## Tier 2 — football editorial that already publishes quizzes

Squawka · Football365 · The Football Faithful · These Football Times ·
Breaking The Lines · Tribuna · 90min. They *want* quizzes and mostly hand-make
them. Offer to take the work off them.

## Tier 3 — Norwegian warm door (highest personal hit rate)

Josimar · NRK Sport · TV2 Sporten · Nettavisen · VG. Pitch in Norwegian. A
Norwegian solo developer offering a free weekly quiz to Norwegian football
media is a far easier yes than any cold English email.

## Tier 4 — club fanzines and podcasts

Per-club, and we have a pack for all 72. Small individually, but they compound
and they link generously.

---

## The email — Tier 1 version

> **Subject: A weekly football quiz for [Outlet] — I build it, you publish it**
>
> Hi [name],
>
> I build Ball IQ, a football quiz app with thousands of checked
> questions across 72 clubs.
>
> FotMob runs a Premier League quiz every Friday, built by an outside partner.
> As far as I can tell [Outlet] doesn't have an equivalent — so here's an offer.
>
> I'll build [Outlet] a branded weekly quiz. Ten questions, on the week's
> football, ready to publish every Thursday, with an embed or a plain-HTML
> version, whichever suits your CMS. It's free and it stays free. You do no
> work beyond hitting publish.
>
> What I'd want in return is a credit line and a link back to the quiz on my
> site — the same arrangement FotMob has with theirs.
>
> If it's useful I'll send the first one this week with no commitment, and you
> can decide once you've seen it. Want me to?
>
> Alex
> balliq.app

**Why it is shaped this way:** leads with their gap not our need · names the
competitor as proof the format works · removes all effort from their side ·
asks for a link explicitly and honestly rather than sneaking it in · ends with
a yes/no that costs them nothing. **Send the first quiz free even if they do
not reply** — a finished artefact converts far better than a proposal.

## Tier 3 version (Norwegian, shorter, warmer)

> **Emne: Ukentlig fotballquiz til [Outlet] — jeg lager den, dere publiserer**
>
> Hei [navn],
>
> Jeg lager Ball IQ, en fotballquiz-app med tusenvis av
> kvalitetssikrede spørsmål fordelt på 72 klubber. Norsk, laget på fritiden.
>
> FotMob har en ukentlig quiz laget av en ekstern partner. Jeg tilbyr [Outlet]
> det samme, gratis: ti spørsmål om ukas fotball, ferdig til publisering hver
> torsdag. Dere gjør ingenting utover å trykke publiser.
>
> Til gjengjeld vil jeg ha en kreditering med lenke tilbake.
>
> Jeg sender gjerne den første nå i uka, helt uforpliktende — så kan dere se
> an. Skal jeg det?
>
> Alex — balliq.app

---

## What we must build before the first yes

1. **A co-branded hub page**, `balliq.app/partners/<outlet>/` — this is where
   their link points and where the quiz archive lives. fcQuiz has exactly this
   at `/clubs/fotmob` and `/series/fotmobs-premier-league-quiz`. **A partner
   link is worth far more pointing at a live branded hub than at our homepage.**
2. **An embeddable quiz** (iframe + a plain-HTML fallback for strict CMSes).
   This doubles as the aggregator-embed play — playfootball.games gets mirrored
   across five-plus Wordle aggregators through exactly this mechanism.
3. **A repeatable weekly build path** so producing each quiz is an hour, not a
   day. The bank and the generator already exist; this is packaging.

⚠️ Do not pitch before item 1 exists. The first reply will be "send an example",
and the example needs somewhere to live.

## Cadence

Send 3–5 at a time, not 30. Follow up **once**, after 7 days, with the finished
first quiz attached rather than a reminder. One yes is the entire objective —
this is not a numbers game, it is a single recurring relationship.

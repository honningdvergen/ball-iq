export const meta = {
  name: 'wave-o-topup-b1',
  description: 'Top up the 6 thinnest club packs to 30 medium+hard, ZERO ERROR bar',
  whenToUse: 'Ball IQ club DEPTH wave — existing packs that give a fan only one fresh play',
  phases: [
    { title: 'Generate', detail: 'two lenses per club, avoiding every stem already in the pack' },
    { title: 'Examine', detail: 'fact-check every question, stem claims included' },
    { title: 'Skeptic', detail: 'adversarial second pass — reject when uncertain' },
  ],
};

// TOP-UP, not a new pack. Every one of these 6 clubs already has a live SEO
// page and 15-16 questions, of which only 11-12 are medium+hard — and club
// quizzes drop 'easy' entirely, so a fan gets ONE fresh 10-question round and
// then repeats forever. We are buying the third and fourth round, not the page.
//
// Consequences of it being a top-up:
//   - no prose phase; the pages exist and their copy is already live
//   - every generator gets the pack's EXISTING stems and must not restate them
//   - 'easy' is banned outright: an easy question does not raise noEasy, so it
//     would cost a slot and buy nothing.
const CLUBS = [
  {
    "key": "SheffieldWednesday",
    "name": "Sheffield Wednesday",
    "need": 19,
    "gen": 16,
    "facts": "Founded 1867, one of the world's oldest professional clubs; Hillsborough; nicknamed the Owls; League Cup winners 1991 beating Manchester United 1-0 (John Sheridan); both FA Cup and League Cup finalists 1993, losing both to Arsenal; Premier League founder member, relegated 2000; the 1990s side of Chris Waddle, David Hirst, Mark Bright, Des Walker, Chris Woods; managers Ron Atkinson, Trevor Francis, David Pleat; long spells in the third tier; 2023 League One play-off final win over Barnsley after overturning a 4-0 first-leg deficit to Peterborough.",
    "avoid": [
      "Sheffield Wednesday took their unusual name from what?",
      "By what nickname are Sheffield Wednesday known?",
      "Which stadium has been Sheffield Wednesday's home since 1899?",
      "Sheffield Wednesday's fierce rivalry, the Steel City derby, is with which club?",
      "How many English league titles have Sheffield Wednesday won?",
      "Sheffield Wednesday won the League Cup in 1991 by beating which club in the final?",
      "Who scored Sheffield Wednesday's winning goal in the 1991 League Cup final?",
      "Which manager led Sheffield Wednesday to the 1991 League Cup?",
      "In 1993 Sheffield Wednesday lost both domestic cup finals to which club?",
      "Which winger, famous for his time at Marseille and for England, joined Sheffield Wednesday in 1992?",
      "How many FA Cups have Sheffield Wednesday won?",
      "Sheffield Wednesday were founded in 1867, making them one of the oldest what?",
      "Which England striker spent most of his career at Sheffield Wednesday in the 1990s?",
      "Which England defender, known for playing without shin pads, joined Sheffield Wednesday in 1993?",
      "What colours do Sheffield Wednesday traditionally wear at home?"
    ]
  },
  {
    "key": "NorwichCity",
    "name": "Norwich City",
    "need": 19,
    "gen": 16,
    "facts": "Founded 1902; Carrow Road; the Canaries; yellow and green; League Cup winners 1962 and 1985; third in the inaugural Premier League 1992-93 and beat Bayern Munich in the 1993-94 UEFA Cup at the Olympiastadion (Jeremy Goss); Delia Smith as majority shareholder; repeated promotion-relegation yo-yo; Championship title 2019 and 2021 under Daniel Farke; players Chris Sutton, Darren Huckerby, Grant Holt, Teemu Pukki, Emiliano Buendia, Todd Cantwell; managers Mike Walker, Nigel Worthington, Paul Lambert.",
    "avoid": [
      "By what nickname are Norwich City known?",
      "Which ground has been Norwich City's home since 1935?",
      "Norwich City's rivalry, the East Anglian derby, is with which club?",
      "Norwich City have won which major trophy, and twice?",
      "In 1993 Norwich City became the first English club to win at which famous stadium?",
      "Where did Norwich City finish in the inaugural Premier League season of 1992-93?",
      "Which celebrity chef became Norwich City's majority shareholder?",
      "Justin Fashanu, who began at Norwich City, is remembered for a famous 1980 goal against which club?",
      "What colours do Norwich City wear at home?",
      "Which Finnish striker was Norwich City's leading scorer during their Championship title win of 2018-19?",
      "Norwich City were founded in which year?",
      "Which manager led Norwich City to their 1985 League Cup win?",
      "Which manager took Norwich City to third place and a UEFA Cup run in the early 1990s?",
      "Norwich City are known in recent decades for which pattern?",
      "Which striker captained Norwich City through their rise from League One to the Premier League around 2010?",
      "Norwich City's academy is best known in recent years for producing which England international?"
    ]
  },
  {
    "key": "BirminghamCity",
    "name": "Birmingham City",
    "need": 18,
    "gen": 15,
    "facts": "Founded 1875 as Small Heath Alliance; St Andrew's; the Blues; League Cup winners 2011 beating Arsenal 2-1 with Obafemi Martins scoring, then relegated the same season; also League Cup winners 1963 over Aston Villa; the Second City derby with Aston Villa; players Trevor Francis (Britain's first million-pound player), Christophe Dugarry, Sebastian Larsson, Jude Bellingham who debuted at 16 and had his number 22 retired on his 2020 move to Borussia Dortmund; managers Steve Bruce, Alex McLeish; Tom Brady became a minority owner in 2023.",
    "avoid": [
      "Birmingham City were founded in 1875 under what name?",
      "By what nickname are Birmingham City known?",
      "Which ground has been Birmingham City's home since 1906?",
      "Birmingham City's fierce rivalry, the Second City derby, is with which club?",
      "Birmingham City won the League Cup in 2011 by beating which club in the final?",
      "Who scored Birmingham City's winning goal in the 2011 League Cup final?",
      "What happened to Birmingham City in the same season they won the 2011 League Cup?",
      "Which manager led Birmingham City to the 2011 League Cup?",
      "Birmingham City also won the League Cup in 1963, beating which club over two legs?",
      "Which England midfielder came through Birmingham City's academy before joining Borussia Dortmund in 2020?",
      "Trevor Francis, a Birmingham City academy product, became famous in 1979 as English football's first what?",
      "Karren Brady became Birmingham City's managing director in 1993 at what notable age?",
      "Which goalkeeper holds Birmingham City's record for appearances?",
      "Birmingham City reached two consecutive European finals in the late 1950s and early 1960s in which competition?",
      "Who is Birmingham City's record goalscorer?",
      "Which colourful manager, known for his rapid-fire press conferences, took charge of Birmingham City in 1993?"
    ]
  },
  {
    "key": "Wrexham",
    "name": "Wrexham",
    "need": 18,
    "gen": 15,
    "facts": "Founded 1864, the oldest club in Wales and third-oldest professional club in the world; the Racecourse Ground, the world's oldest international stadium still hosting internationals; Welsh Cup winners a record number of times; famous 2-1 FA Cup third-round win over reigning champions Arsenal in January 1992 (Mickey Thomas free kick, Steve Watkin winner); European Cup Winners' Cup quarter-final 1976; relegated from the Football League in 2008 and spent 15 seasons in the National League; bought by Ryan Reynolds and Rob McElhenney in 2021; the Welcome to Wrexham documentary; promoted as National League champions 2023 with Paul Mullin scoring heavily, then successive promotions under Phil Parkinson.",
    "avoid": [
      "Wrexham were founded in 1864, making them the oldest football club in which country?",
      "Which two Hollywood actors bought Wrexham in 2021?",
      "What is the name of Wrexham's home ground?",
      "Wrexham ended a 15-year absence from the English Football League by winning which division in 2023?",
      "In one of the FA Cup's great upsets in 1992, Wrexham beat which reigning league champions?",
      "Which veteran Wrexham player scored the famous free-kick in that 1992 cup upset?",
      "By what nickname are Wrexham known?",
      "As of 2026, Wrexham hold the record for winning which competition the most times?",
      "Which striker became the face of Wrexham's rise, scoring prolifically in the promotion seasons?",
      "What is the name of the documentary series following Wrexham's Hollywood era?",
      "Despite being a Welsh club, Wrexham compete in which league system?",
      "In 1976 Wrexham reached the quarter-finals of which European competition?",
      "What colour shirts do Wrexham traditionally wear at home?",
      "Wrexham's famous 1992 FA Cup win over the reigning champions came in which round?",
      "Before the 2021 takeover, Wrexham had been owned since 2011 by whom?",
      "Wrexham's ground has hosted home matches for which national team?"
    ]
  },
  {
    "key": "CardiffCity",
    "name": "Cardiff City",
    "need": 18,
    "gen": 15,
    "facts": "Founded 1899; Cardiff City Stadium, previously Ninian Park; the Bluebirds; the only club from outside England to win the FA Cup, beating Arsenal 1-0 in 1927 (Hughie Ferguson); FA Cup finalists again 2008 losing to Portsmouth; League Cup finalists 2012 losing to Liverpool on penalties; promoted to the Premier League 2013 under Malky Mackay and 2018 under Neil Warnock; the controversial red-kit rebrand under Vincent Tan, reversed in 2015; the South Wales derby with Swansea; Emiliano Sala died in a plane crash in January 2019 days after signing.",
    "avoid": [
      "By what nickname are Cardiff City known?",
      "Cardiff City achieved something in 1927 that no other club has managed. What was it?",
      "Cardiff City's rivalry, the South Wales derby, is with which club?",
      "Which ground did Cardiff City leave in 2009 after 99 years?",
      "In 2012 Cardiff City's owner controversially changed the home shirt from blue to what colour?",
      "Cardiff City lost the 2008 FA Cup final to which club?",
      "Cardiff City were founded in 1899 under what name?",
      "Like Wrexham and Swansea, Cardiff City are a Welsh club competing in which league system?",
      "In which year did Cardiff City first reach the Premier League?",
      "What colour do Cardiff City traditionally wear at home?",
      "Cardiff City have won the Welsh Cup how many times, approximately?",
      "Which manager led Cardiff City to promotion to the Premier League in 2013?",
      "Cardiff City's 1927 FA Cup winning goal was scored against which goalkeeper's error?",
      "Which manager, known for his outspoken style, led Cardiff City back to the Premier League in 2018?",
      "Cardiff City reached the League Cup final in 2012, losing on penalties to which club?",
      "Cardiff City's 1927 FA Cup win came against which club?"
    ]
  },
  {
    "key": "SwanseaCity",
    "name": "Swansea City",
    "need": 18,
    "gen": 15,
    "facts": "Founded 1912; the Liberty/Swansea.com Stadium, previously the Vetch Field; the Swans; came within a game of relegation from the Football League in 2003 before a final-day survival; promoted to the Premier League in 2011 via the play-off final, the first Welsh club in the Premier League; League Cup winners 2013 beating Bradford City 5-0 with a Nathan Dyer double and Michu; the passing style under Roberto Martinez, Brendan Rodgers and Michael Laudrup; players Michu, Gylfi Sigurdsson, Wilfried Bony, Ashley Williams, Leon Britton, Joe Allen; relegated 2018; the South Wales derby with Cardiff.",
    "avoid": [
      "By what nickname are Swansea City known?",
      "In 2011 Swansea City became the first Welsh club to do what?",
      "Swansea City won the League Cup in 2013, beating which club in the final?",
      "Swansea City's rivalry, the South Wales derby, is with which club?",
      "Which ground did Swansea City leave in 2005 after 93 years?",
      "Which manager led Swansea City into the Premier League in 2011?",
      "Which Danish former Barcelona and Real Madrid player managed Swansea City to the 2013 League Cup?",
      "Which Spanish striker, signed for a small fee in 2012, scored 22 goals in his first Swansea City season?",
      "Which Welsh former Liverpool striker managed Swansea City to four promotions from 1978?",
      "What colours do Swansea City wear at home?",
      "Like Cardiff and Wrexham, Swansea City are a Welsh club competing in which league system?",
      "What is the name of Swansea City's home ground, opened in 2005?",
      "Swansea City's supporters' trust is notable for what?",
      "Which Ivorian striker did Swansea City sell to Manchester City in 2015 after a prolific spell?",
      "Which Spaniard managed Swansea City from 2007, later winning the FA Cup with Wigan?",
      "Swansea City were founded in which year?"
    ]
  }
];

const LENSES = [
  { key: 'heritage', brief: 'the club before its modern peak — grounds, promotions and relegations, cup runs, cult players, the managers who built the identity, derbies and rivalries' },
  { key: 'modern',   brief: 'roughly 1990 onward, weighted to 2000-2024 — league campaigns, play-off finals, cup shocks, transfers in and out, the squads fans alive today actually watched' },
];

const GEN = {
  type: 'object',
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['q', 'o', 'a', 'diff', 'hint'],
        properties: {
          q: { type: 'string', description: 'The question stem. Every factual claim inside it must be true.' },
          o: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
          a: { type: 'integer', minimum: 0, maximum: 3, description: 'INDEX into o of the correct option — not the answer text.' },
          diff: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          hint: { type: 'string', description: 'One or two sentences of explanation shown after answering. Required — a question with no hint is ineligible for the SEO page.' },
        },
      },
    },
  },
};


const VERDICT = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['keep', 'reject', 'fix'] },
    reason: { type: 'string' },
    // Only read when verdict === 'fix'. A corrected stem/options/index.
    fixed: {
      type: 'object',
      properties: {
        q: { type: 'string' },
        o: { type: 'array', items: { type: 'string' } },
        a: { type: 'integer' },
        hint: { type: 'string' },
      },
    },
  },
};


const BAR = `
BALL IQ ZERO ERROR BAR — these are not style preferences, they are ship gates.

1. \`a\` IS AN INDEX INTO \`o\`, NOT THE ANSWER TEXT. Off-by-one produces a
   fluent, confident, wrong answer. Resolve o[a] and check the RESOLVED STRING.
2. EVERY CLAIM THE STEM MAKES MUST BE TRUE, not just the answer it asks for.
   This is the single most common defect: the question asks the right thing,
   the keyed answer is right, and the stem asserts something untrue on the way
   there. Superlatives ("only", "first", "record", "biggest") and temporal
   clauses ("before joining", "since X") are where they hide.
3. NO SELF-ANSWERING QUESTIONS. If it can be answered from the stem alone with
   no football knowledge, reject it. These are not wrong, they are pointless,
   and they make the app feel cheap. They cannot be corrected, only replaced.
4. DISTRACTORS ARE DELETION-GRADE. Every wrong option must satisfy the stem's
   own qualifier while being verifiably wrong. No near-name twins of the
   answer, no players who were not alive/active in the era the stem names.
5. NO OPEN-ENDED PRESENT CLAIMS. "Who holds the record for X" goes silently
   false the day the record falls. Anchor it — "As of 2026, who holds…" — or
   state the figure, or name the season.
6. TARGET ERA 1990-2020, weighted to what fans alive today watched. Pre-1950
   trivia is not wanted.
7. REJECT WHEN UNCERTAIN. A false "this is wrong" that flips a correct answer
   is worse than dropping a good question. If a fact is genuinely contested or
   you cannot verify it, drop it. There is no volume target worth a wrong
   answer — 25k football obsessives read these under the app's name.
`;

phase('Generate');
const raw = await parallel(
  CLUBS.flatMap((c) => LENSES.map((l) => () =>
    agent(
      `Write ${c.gen} multiple-choice football trivia questions about ${c.name}.\n\n`
      + `LENS: ${l.brief}\n\n`
      + `Reference facts (not exhaustive, and do NOT assume they are complete or perfectly `
      + `worded — verify anything you use):\n${c.facts}\n\n`
      + `⚠️ THIS PACK ALREADY EXISTS. These stems are already in it. Do not ask any of `
      + `these facts again, in any wording — a near-duplicate is as useless to us as a `
      + `repeat, because the whole point of this wave is giving a fan a THIRD fresh round:\n`
      + c.avoid.map((s) => '  - ' + s).join('\n') + '\n\n'
      + BAR
      + `\n⚠️ NO EASY QUESTIONS. Club quizzes drop 'easy' entirely, so an easy question `
      + `buys us nothing. Every question must be diff 'medium' or 'hard'. Aim ~60% medium, `
      + `40% hard. 'Hard' must mean a devoted supporter has to think — NOT that the `
      + `distractors are obscure.\n`
      + `Every question needs a hint: one or two sentences giving the story behind the answer.`,
      { schema: GEN, phase: 'Generate', label: `gen:${c.key}:${l.key}` },
    ).then((r) => ({ club: c.key, questions: (r?.questions || []).filter((q) => q.diff !== 'easy') })),
  )),
);

const STOP = new Set('the a an of in on at to for and or which what who whose when did was were is are club season year first most with by from his their'.split(' '));
const toks = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
const overlap = (a, b) => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
};

const byClub = new Map(CLUBS.map((c) => [c.key, []]));
for (const r of raw.filter(Boolean)) {
  const c = CLUBS.find((x) => x.key === r.club);
  const kept = byClub.get(r.club);
  for (const q of r.questions) {
    if (!q?.q || !Array.isArray(q.o) || q.o.length !== 4) continue;
    // Against the two lenses AND against what is already in the live pack.
    if (kept.some((k) => overlap(k.q, q.q) > 0.6 && String(k.o[k.a]) === String(q.o[q.a]))) continue;
    if (c.avoid.some((s) => overlap(s, q.q) > 0.7)) continue;
    kept.push(q);
  }
}
for (const [k, v] of byClub) log(k + ': ' + v.length + ' generated after dedupe (need ' + CLUBS.find((c) => c.key === k).need + ')');

phase('Examine');
const flat = [...byClub].flatMap(([club, qs]) => qs.map((q, i) => ({ club, i, q })));
log(flat.length + ' questions into verification (' + (flat.length * 2) + ' agents)');

// ⚠️ A DEAD AGENT IS NOT A REJECTION — the lesson of run wf_a39f8d84-625.
//
// That run reported "rejected by examiner/skeptic" 84 times and returned zero
// survivors, which reads exactly like a catastrophic content-quality failure.
// It was not. The agents returned 27 keep, 15 fix and **zero rejects**; all 84
// lines were this pipeline throwing on a null return from an agent killed by an
// API 529 or the session limit. The failure log actively lied about the content.
//
// So: retry a judgement that never came back, and when it still never comes
// back, say INFRA — never "rejected". Only a real `verdict: "reject"` is a
// content decision. Retries vary the prompt so they cannot collide with the
// first attempt's cache entry on a resume.
const judge = async (basePrompt, opts) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const prompt = attempt === 0 ? basePrompt
      : basePrompt + '\n\n(Attempt ' + (attempt + 1) + ' — an earlier attempt did not complete for '
        + 'infrastructure reasons, not because of anything about this question. Judge it fresh.)';
    const opt = attempt === 0 ? opts : { ...opts, label: opts.label + '~r' + attempt };
    const v = await agent(prompt, opt);
    if (v && v.verdict) return v;
  }
  return null;
};

const judged = await pipeline(
  flat,
  (item) => judge(
    `You are the EXAMINER. Fact-check this Ball IQ question about `
    + CLUBS.find((c) => c.key === item.club).name + '.\n\n'
    + JSON.stringify(item.q, null, 2)
    + '\n\nThe keyed answer resolves to: ' + JSON.stringify(item.q.o[item.q.a]) + '\n\n'
    + BAR
    + `\nCheck, in order: (a) is the resolved answer factually correct; (b) is EVERY claim `
    + `in the stem true; (c) is it self-answering; (d) does every distractor satisfy the `
    + `stem's qualifier while being verifiably wrong; (e) is the hint true.\n\n`
    + `Return "keep" if it ships as-is, "fix" with a corrected version if a specific `
    + `wording or option is wrong, "reject" if the underlying fact is wrong, contested, `
    + `unverifiable, or the question is self-answering.`,
    { schema: VERDICT, phase: 'Examine', label: 'exam:' + item.club + ':' + item.i, effort: 'high' },
  ).then((v) => {
    if (!v) throw new Error('INFRA: examiner never returned a verdict after retries — NOT a content rejection');
    if (v.verdict === 'reject') throw new Error('CONTENT: examiner rejected — ' + v.reason);
    const q = v.verdict === 'fix' && v.fixed ? { ...item.q, ...v.fixed } : item.q;
    return { ...item, q, examReason: v.reason };
  }),
  (item) => judge(
    `You are the SKEPTIC. Your job is to REFUTE this Ball IQ question about `
    + CLUBS.find((c) => c.key === item.club).name
    + ', which has already passed one fact-check. Assume the examiner missed something.\n\n'
    + JSON.stringify(item.q, null, 2)
    + '\n\nThe keyed answer resolves to: ' + JSON.stringify(item.q.o[item.q.a]) + '\n'
    + 'The examiner said: ' + item.examReason + '\n\n'
    + BAR
    + `\nThe examiner's most likely miss is a FALSE PREMISE IN THE STEM with a correct `
    + `key — two thirds of real defects are that. Attack the stem's assertions, not just `
    + `the answer. Also check whether a SECOND option could also be defended as correct.\n\n`
    + `Default to "reject" when you are not certain. Only return "keep" if you tried to `
    + `break it and could not.`,
    { schema: VERDICT, phase: 'Skeptic', label: 'skep:' + item.club + ':' + item.i, effort: 'high' },
  ).then((v) => {
    if (!v) throw new Error('INFRA: skeptic never returned a verdict after retries — NOT a content rejection');
    if (v.verdict !== 'keep') throw new Error('CONTENT: skeptic rejected — ' + v.reason);
    return item;
  }),
);

const survivors = new Map(CLUBS.map((c) => [c.key, []]));
for (const s of judged.filter(Boolean)) survivors.get(s.club).push(s.q);
for (const [k, v] of survivors) {
  const c = CLUBS.find((x) => x.key === k);
  const gen = byClub.get(k).length;
  log(k + ': ' + v.length + '/' + gen + ' survived (need ' + c.need + ') ' + (v.length >= c.need ? 'TARGET MET' : 'SHORT by ' + (c.need - v.length)));
}

return CLUBS.map((c) => ({
  club: c.key, name: c.name, need: c.need,
  full: byClub.get(c.key).length,
  count: survivors.get(c.key).length,
  survivors: survivors.get(c.key),
}));

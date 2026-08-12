// Football quotes — WHAT THEY ACTUALLY SAID.
//
// ⚠️ THE PAGE NEEDS A REASON TO EXIST, not just a keyword. There are ten
// thousand "best football quotes" listicles and they copy each other, which is
// how the same wrong wording ends up everywhere. Two of the most famous lines
// in the sport prove it:
//   · Shankly never said football was "much more important than life and
//     death". That sentence does not exist. What he said was a REPLY, on
//     Granada's Live at Two on 20 May 1981, and his biographer records it as
//     tongue-in-cheek regret at what the job cost his family.
//   · Cantona's seagulls line is treated as spontaneous philosophy. The BBC
//     reported in 2003 that it was ASSEMBLED in a London hotel room — United's
//     head of security was asked for another word for fishing boat (trawler)
//     and what small fish were called (sardines).
//
// So this is not a quote list. It is quotes WITH THE RECORD STRAIGHT: who said
// it, when, in what circumstance, and — where it matters — what the popular
// version gets wrong. A scraper cannot copy that, and it is the same
// discipline that made /fun-facts/ worth having.
//
// ⚠️ RULES FOR ADDING ONE:
//   · Short. A quotation, not a passage.
//   · Attributed to a person, with the setting where it is known.
//   · `note` carries what makes it worth reading — for a misquote, what the
//     popular version gets wrong.
//   · `src` is where it was checked. No source, no entry.
//   · If the wording is genuinely disputed and cannot be settled, LEAVE IT
//     OUT. A quotes page that hedges is worse than a shorter one.
//   · No inspirational-poster filler. If it would fit on a gym wall with the
//     name swapped out, it is not a football quote.
const WQ = 'https://en.wikiquote.org/wiki/';

export const QUOTES = [
  {
    theme: 'The ones everybody gets wrong',
    items: [
      { q: 'Somebody said that football’s a matter of life and death to you. I said, “Listen, it’s more important than that.”',
        who: 'Bill Shankly', when: 'Granada TV, 1981',
        note: 'The version everyone prints — "much more important than life and death" — is not a sentence Shankly ever said. This is the real one, and it was a reply, delivered seven years after he retired. His biographer John Keith records it as tongue-in-cheek, born of regret at what the job cost his family rather than bravado.',
        src: `${WQ}Bill_Shankly` },
      { q: 'When the seagulls follow the trawler, it is because they think sardines will be thrown into the sea. Thank you very much.',
        who: 'Eric Cantona', when: 'press conference, 1995',
        note: 'Said once, slowly, after his sentencing for the kick at Selhurst Park — then he stood up and left, and a generation read it as mystical philosophy. The BBC reported in 2003 that it had been assembled beforehand in a London hotel room: United’s head of security was asked for another word for a fishing boat, and what small fish were called.',
        src: 'http://news.bbc.co.uk/2/hi/europe/3221471.stm' },
      { q: 'I prefer not to speak. If I speak, I am in big trouble.',
        who: 'José Mourinho', when: '',
        note: 'Delivered to a press pack, at length, on the subject of not speaking. The joke is that he then kept talking — and it entered the language well enough to be quoted back at him for two decades.',
        src: `${WQ}Jos%C3%A9_Mourinho` },
      { q: 'Football is a simple game. Twenty-two men chase a ball for ninety minutes and at the end, the Germans always win.',
        who: 'Gary Lineker', when: 'after England–West Germany, 1990',
        note: 'Said after England went out on penalties in the World Cup semi-final. The part nobody quotes: Lineker updated it himself in 2018, when Germany were knocked out in the group stage — "the Germans somehow win" no longer applied, and he said so.',
        src: `${WQ}Gary_Lineker` },
    ],
  },
  {
    theme: 'Managers with a microphone',
    items: [
      { q: 'I wouldn’t say I was the best manager in the business. But I was in the top one.',
        who: 'Brian Clough', when: '',
        note: 'The most quoted piece of self-assessment in English football, and one of the few that survives every retelling word for word.',
        src: `${WQ}Brian_Clough` },
      { q: 'If God had wanted us to play football in the clouds, he’d have put grass up there.',
        who: 'Brian Clough', when: 'on long-ball football',
        note: 'Clough on the route-one game that ruled English football in the 1980s — the argument he spent a career on the other side of.',
        src: `${WQ}Brian_Clough` },
      { q: 'Rome wasn’t built in a day. But I wasn’t on that particular job.',
        who: 'Brian Clough', when: '',
        note: 'Offered as an explanation for how quickly he turned clubs around. He took Derby and Nottingham Forest from the second tier to the league title, and Forest to two European Cups.',
        src: `${WQ}Brian_Clough` },
      { q: 'At a football club, there’s a holy trinity — the players, the manager and the supporters. Directors don’t come into it. They are only there to sign the cheques.',
        who: 'Bill Shankly', when: '',
        note: 'Shankly’s view of who a club actually belongs to. Quoted at every fan protest since, usually by people who were not born when he said it.',
        src: `${WQ}Bill_Shankly` },
      { q: 'He’s worse than the rain in Manchester. At least the rain in Manchester stops occasionally.',
        who: 'Bill Shankly', when: 'on Brian Clough',
        note: 'One of the game’s great talkers, on the record about another.',
        src: `${WQ}Bill_Shankly` },
      { q: 'Football is an art, like dancing is an art — but only when it’s well done does it become an art.',
        who: 'Arsène Wenger', when: '',
        note: 'Wenger’s standing defence of how his teams played, from a manager who arrived in England in 1996 to a press corps that had never heard a coach talk like this.',
        src: `${WQ}Ars%C3%A8ne_Wenger` },
      { q: 'A football team is like a piano. You need eight men to carry it and three who can play the damn thing.',
        who: 'Bill Shankly', when: '',
        note: 'Shankly on squad building, decades before anyone used the phrase. The ratio has not really changed.',
        src: `${WQ}Bill_Shankly` },
      { q: 'Please don’t call me arrogant, but I’m European champion and I think I’m a special one.',
        who: 'José Mourinho', when: 'Chelsea unveiling, 2004',
        note: 'His first day in English football. He had just won the Champions League with Porto, so it was a statement of fact wearing the costume of a boast — and it named him for the rest of his career.',
        src: `${WQ}Jos%C3%A9_Mourinho` },
      { q: 'I’m the Normal One.',
        who: 'Jürgen Klopp', when: 'Liverpool unveiling, 2015',
        note: 'A deliberate answer to Mourinho’s line eleven years earlier, delivered at the same kind of unveiling. Klopp had just won two Bundesliga titles and reached a Champions League final.',
        src: `${WQ}J%C3%BCrgen_Klopp` },
      { q: 'Football, bloody hell.',
        who: 'Alex Ferguson', when: 'Champions League final, 1999',
        note: 'His entire post-match reaction to winning the European Cup with two goals in stoppage time. Three words, and nobody has ever needed them explained.',
        src: `${WQ}Alex_Ferguson` },
      { q: 'Football without fans is nothing.',
        who: 'Jock Stein', when: '',
        note: 'From the manager who built the Lisbon Lions — a Celtic side whose entire European Cup–winning eleven was born within about thirty miles of the ground.',
        src: `${WQ}Jock_Stein` },
      { q: 'Whenever possible, give the ball to George.',
        who: 'Matt Busby', when: 'on his team talks',
        note: 'Busby’s account of why George Best was told not to bother attending them. That was the team talk.',
        src: `${WQ}Matt_Busby` },
      { q: 'I will love it if we beat them. Love it!',
        who: 'Kevin Keegan', when: 'live on television, 1996',
        note: 'Newcastle were chasing Manchester United for the title and Ferguson had questioned whether opponents tried as hard against them. Keegan answered live on air; Newcastle did not win the league.',
        src: `${WQ}Kevin_Keegan` },
      { q: 'My greatest challenge was knocking Liverpool right off their perch.',
        who: 'Alex Ferguson', when: '',
        note: 'Said long before it was done. Liverpool had 18 league titles and United seven when he arrived in 1986; he left in 2013 with United on 20.',
        src: `${WQ}Alex_Ferguson` },
    ],
  },
  {
    theme: 'Players',
    items: [
      { q: 'Playing football is very simple, but playing simple football is the hardest thing there is.',
        who: 'Johan Cruyff', when: '',
        note: 'The sentence that underwrites most of modern coaching. Cruyff said versions of it for forty years, as player, manager and critic.',
        src: `${WQ}Johan_Cruyff` },
      { q: 'Every disadvantage has its advantage.',
        who: 'Johan Cruyff', when: '',
        note: 'The most famous of the Cruyffisms — mangled Dutch that turned out to be exactly right. He used it about injuries, about smaller squads, about being outspent.',
        src: `${WQ}Johan_Cruyff` },
      { q: 'Quality without results is pointless. Results without quality is boring.',
        who: 'Johan Cruyff', when: '',
        note: 'Cruyff refusing the choice everyone else accepts. Both halves of that sentence have been used against him by people who only read one of them.',
        src: `${WQ}Johan_Cruyff` },
      { q: 'Whoever makes the fewest mistakes wins.',
        who: 'Johan Cruyff', when: '',
        note: 'Cruyff’s whole philosophy compressed into five words — and a useful corrective to the idea that he cared only about beauty.',
        src: `${WQ}Johan_Cruyff` },
      { q: 'In my teams, the goalie is the first attacker, and the striker is the first defender.',
        who: 'Johan Cruyff', when: '',
        note: 'Written off as a paradox at the time. It is now simply how the best teams are coached.',
        src: `${WQ}Johan_Cruyff` },
      { q: 'To see the ball, to run after it, makes me the happiest man in the world.',
        who: 'Diego Maradona', when: '',
        note: 'From a career that contained everything else football can contain, the thing he chose to say about it was this.',
        src: `${WQ}Diego_Maradona` },
      { q: 'I was born for soccer, as Beethoven was born for music.',
        who: 'Pelé', when: '',
        note: 'From the only man to win three World Cups. Read as arrogance by people who did not watch him; read as a plain description by people who did.',
        src: `${WQ}Pel%C3%A9` },
      { q: 'It is better to fail aiming high than to succeed aiming low.',
        who: 'Bill Nicholson', when: '',
        note: 'The manager who made Tottenham the first English club of the twentieth century to win the Double, in 1961. The club still quotes it; the standard it sets is not a comfortable one.',
        src: `${WQ}Bill_Nicholson` },
      { q: 'If you are first you are first. If you are second, you are nothing.',
        who: 'Bill Shankly', when: '',
        note: 'The other side of Shankly, and a useful corrective to the cuddly version of him that gets quoted at anniversaries.',
        src: `${WQ}Bill_Shankly` },
      { q: 'The great fallacy is that the game is first and last about winning. It is nothing of the kind. The game is about glory.',
        who: 'Danny Blanchflower', when: '',
        note: 'The Tottenham captain who won the Double in 1961, arguing for how a team should play rather than what it should collect. Still quoted at Spurs, sometimes ruefully.',
        src: `${WQ}Danny_Blanchflower` },
      { q: 'What is a club in any case? It’s the noise, the passion, the feeling of belonging.',
        who: 'Bobby Robson', when: '',
        note: 'Robson managed England, Barcelona, Porto and PSV, and this is what he said a club actually is. It is engraved outside Newcastle’s ground.',
        src: `${WQ}Bobby_Robson` },
      { q: 'I have my confidence and I believe in myself. People call it arrogant, I call it confidence.',
        who: 'Zlatan Ibrahimović', when: '',
        note: 'Ibrahimović has never once accepted the premise of a question about his ego.',
        src: `${WQ}Zlatan_Ibrahimovi%C4%87` },
    ],
  },
];

// ⚠️ HELD BACK ON PURPOSE — DO NOT PROMOTE WITHOUT A REAL SOURCE.
// These circulate constantly and none of them survived a check:
//   · "I once cried because I had no shoes to play football, until I met a man
//     who had no feet." Attributed to Zidane everywhere. It is a much older
//     proverb with no connection to him.
//   · "First I went left, he did too. Then I went right, he did too. Then I
//     went left again, and he went to buy a hot dog." Attributed to Zlatan
//     about a defender; also told about half a dozen other players, with no
//     primary source for any version.
//   · "Winning isn't everything, it's the only thing." American football, and
//     Red Sanders said it before Lombardi got the credit.
// The whole point of the page is that we do not print these.
export const REJECTED_QUOTES = [
  'Zidane — "no shoes / no feet" (older proverb, not his)',
  'Ibrahimović — "went to buy a hot dog" (no primary source)',
  'Lombardi — "winning isn\'t everything" (Red Sanders, and not soccer)',
];

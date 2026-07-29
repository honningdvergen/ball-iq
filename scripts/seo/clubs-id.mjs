// Indonesian club pages — first member of the MANCHESTER UNITED language cluster.
//
// WHY THIS FILE EXISTS, AND WHY IT IS MAN UNITED RATHER THAN A LOCAL CLUB
//
// The Spanish, Portuguese and Turkish pilots all follow one shape: a DOMESTIC
// club written in its own country's language (Boca in Spanish, Flamengo in
// Portuguese, Galatasaray in Turkish). This is the other shape, and Alex's
// point: a GLOBAL club has enormous fanbases in countries whose language is
// nothing like the club's own. There are millions of Manchester United
// supporters in Indonesia, and every page we own about United is in English.
//
// That makes United the right hub for a MULTI-LANGUAGE cluster rather than a
// one-off. Two reasons, and the second is the one that changed my mind:
//
//   1. Holding the CLUB constant across languages means any difference between
//      the Indonesian and Japanese pages is attributable to the market, not the
//      badge. Cleaner than spreading one language each across different clubs.
//   2. An hreflang cluster with several members is stronger than the same
//      number of isolated pages — the members reinforce one another and Google
//      can serve the right one per locale. Concentrating languages on one
//      high-value club builds a real cluster instead of a handful of orphans.
//
// WHY INDONESIAN FIRST, ahead of the languages people actually name:
//
//   - Enormous Premier League following, and United's is among the largest.
//   - Google-dominant (unlike mainland China, where Baidu rules and an ICP
//     licence effectively gates ranking — see the note in clubs-tr.mjs about
//     testing markets rather than badges).
//   - An extremely thin Indonesian football-quiz SERP.
//   - Unlike India — where football fans overwhelmingly search in ENGLISH, so
//     the audience is real but the LANGUAGE GAP is not — Indonesian searchers
//     genuinely use Indonesian.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as the other clubs-<lang>.mjs files: every entry carries the
// `id` of the English original in src/questions.js, and gen-seo-pages.mjs fails
// the build if an id stops resolving or if the answer keys stop agreeing.
// Translated prose answers declare the exact English string via `en`.
//
// Indonesian register: the vocabulary Indonesian football media actually uses —
// "Setan Merah" for United (universal there, and a phrase no machine translation
// would reach for), plus kiper, bek, gelandang, penyerang, pelatih, gol
// kemenangan. Written in standard Indonesian rather than Malay: close languages,
// different audiences, and Indonesia is the bigger of the two here.

export const CLUBS_ID = [
  {
    club: 'Manchester United',     // must match the `club` field in src/questions.js
    slug: 'manchester-united',     // shared with the English page
    lang: 'id',
    name: 'Manchester United',
    h1: 'Kuis Manchester United',
    title: 'Kuis Manchester United — Tebak Setan Merah | Ball IQ',
    description:
      'Kuis Manchester United gratis dengan jawaban berpenjelasan: treble 1999, Sir Alex Ferguson, Cantona, Ronaldo, dan Old Trafford.',
    kind: 'Kuis klub',
    statLine: 'Gratis · 42 soal Manchester United · tanpa daftar',
    playLabel: 'Mulai kuis',
    intro: [
      'Setan Merah punya pendukung di seluruh dunia, dan Indonesia adalah salah satu basis terbesarnya. Kuis gratis ini menelusuri seluruh perjalanan klub: dari Newton Heath dan tragedi Munich 1958, era Sir Matt Busby yang berujung trofi Eropa 1968, 26 tahun Sir Alex Ferguson, treble 1999 dengan gol Solskjaer di masa tambahan, sampai Cantona, Beckham, Ronaldo, dan Rooney.',
      'Soalnya benar-benar naik tingkat. Ketika sejarah klub masih diperdebatkan, kami memilih tidak menerbitkan soal itu daripada memihak satu versi. Yang terbit adalah yang bisa diverifikasi.',
      'Setiap jawaban di set Manchester United punya penjelasan tertulis, jadi salah menjawab pun tetap mengajarkan sesuatu tentang bagaimana United meraih apa yang mereka raih.',
    ],
    faq: [
      {
        q: 'Apakah kuis Manchester United ini gratis?',
        a: 'Gratis. Bisa langsung dimainkan di browser, tanpa daftar dan tanpa mengunduh apa pun. Semua soal di halaman ini bebas diakses.',
      },
      {
        q: 'Apa saja yang dibahas dalam kuis ini?',
        a: 'Sejarah klub, tragedi Munich, era Busby dan trofi Eropa 1968, 26 tahun Sir Alex Ferguson, treble 1999, final Liga Champions 2008 di Moskow, Cantona, Beckham, Ronaldo, Rooney, rekor klub, dan Old Trafford. Tingkat kesulitannya naik dari mudah sampai benar-benar sulit.',
      },
      {
        q: 'Dari mana soal-soal ini berasal?',
        a: 'Semuanya ditulis dan diperiksa manual, tidak pernah dibuat otomatis. Setiap fakta melewati dua pemeriksaan independen sebelum diterbitkan, dan kalau ada yang tidak bisa dipastikan, soalnya tidak kami terbitkan.',
      },
      {
        // The honest disclosure, same as every other localised page.
        q: 'Apakah aplikasi Ball IQ tersedia dalam bahasa Indonesia?',
        a: 'Belum: halaman ini berbahasa Indonesia, tetapi aplikasinya masih berbahasa Inggris. Kami sedang mengukur minat sebelum menerjemahkannya — kalau kamu sampai di sini, kamu sudah membantu kami memutuskan.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_288abe', q: 'Apa nama stadion markas Manchester United?', o: ['Anfield', 'Old Trafford', 'Elland Road', 'Etihad Stadium'], a: 1, hint: 'Dibuka pada 1910 dan dijuluki “Theatre of Dreams” oleh Bobby Charlton.' },
      { id: 'q_6d4ed6', en: 'The Red Devils', q: 'Manchester United paling dikenal dengan julukan apa?', o: ['The Red Devils', 'The Citizens', 'The Blues', 'The Hammers'], a: 0, hint: 'Julukan ini diambil pada era Matt Busby; di Indonesia dikenal sebagai Setan Merah.' },
      { id: 'q_bbf4e8', q: 'Pelatih mana yang memimpin Manchester United lebih dari 26 tahun sebelum pensiun pada 2013?', o: ['Sir Alex Ferguson', 'Sir Matt Busby', 'Ron Atkinson', 'David Moyes'], a: 0, hint: 'Ia datang dari Aberdeen pada 1986 dan pergi setelah memenangi gelar liga terakhirnya.' },
      { id: 'q_15548d', q: 'Di final Liga Champions 1999, siapa yang mencetak gol kemenangan United di masa tambahan melawan Bayern Munich untuk melengkapi treble?', o: ['Teddy Sheringham', 'Dwight Yorke', 'Ole Gunnar Solskjaer', 'Andy Cole'], a: 2, hint: 'Ia masuk sebagai pemain pengganti dan mencetak gol setelah Sheringham menyamakan kedudukan.' },
      { id: 'q_afec62', q: 'Cristiano Ronaldo pertama kali bergabung dengan Manchester United pada 2003 dari klub mana?', o: ['Benfica', 'Porto', 'Sporting CP', 'Real Madrid'], a: 2, hint: 'Ferguson memutuskan merekrutnya setelah laga persahabatan melawan klub Lisbon itu.' },
      { id: 'q_42a3cd', q: 'Manchester United merekrut Wayne Rooney yang masih remaja pada 2004 dari klub mana?', o: ['Liverpool', 'Newcastle United', 'Aston Villa', 'Everton'], a: 3, hint: 'Ia sudah terkenal di klub Merseyside itu sejak golnya ke gawang Arsenal pada usia 16 tahun.' },
      { id: 'q_5749fd', q: 'Pemain mana yang memegang rekor penampilan terbanyak untuk Manchester United dengan 963 laga?', o: ['Bobby Charlton', 'Paul Scholes', 'Ryan Giggs', 'Gary Neville'], a: 2, hint: 'Gelandang sayap Wales ini bermain untuk satu klub saja selama 23 musim.' },
      { id: 'q_533a6b', q: 'Manchester United mengalahkan klub Inggris mana lewat adu penalti di final Liga Champions 2008 di Moskow?', o: ['Arsenal', 'Liverpool', 'Chelsea', 'Tottenham'], a: 2, hint: 'John Terry gagal pada kesempatan yang bisa menentukan gelar, lalu Anelka gagal juga.' },
      { id: 'q_825e9a', q: 'Kiper mana, yang dijuluki “The Great Dane”, menjadi tulang punggung Manchester United di era gelar 1990-an?', o: ['Edwin van der Sar', 'Fabien Barthez', 'Mark Bosnich', 'Peter Schmeichel'], a: 3, hint: 'Ia juga juara Piala Eropa 1992 bersama negaranya dan menjadi kapten pada malam treble.' },
      { id: 'q_3723f9', en: 'The Munich air disaster', q: 'Bencana pada 6 Februari 1958 yang menewaskan delapan pemain “Busby Babes” dikenal sebagai apa?', o: ['Tragedi udara Munich', 'Tragedi Hillsborough', 'Tragedi Heysel', 'Kebakaran Bradford'], a: 0, hint: 'Pesawat yang membawa tim gagal lepas landas saat pulang dari laga Piala Eropa di Beograd.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_80e5cb', q: 'Dengan nama apa Manchester United pertama kali didirikan pada 1878, sebelum memakai nama sekarang pada 1902?', o: ['Newton Heath LYR', 'Manchester Central', 'Heaton Park Rovers', 'Ardwick FC'], a: 0, hint: 'Klub ini awalnya dibentuk oleh para pekerja depot kereta api di Newton Heath.' },
      { id: 'q_9d23bf', q: 'Siapa pelatih pertama yang membawa Manchester United menjuarai Piala Eropa, pada 1968?', o: ['Sir Matt Busby', 'Tommy Docherty', 'Sir Alex Ferguson', 'Wilf McGuinness'], a: 0, hint: 'Sepuluh tahun setelah tragedi Munich, ia membawa klub menjadi tim Inggris pertama yang menjuarai kompetisi itu.' },
      { id: 'q_8eb32d', q: 'Manchester United memenangi gelar Premier League yang pertama pada musim apa?', o: ['1991-92', '1992-93', '1993-94', '1994-95'], a: 1, hint: 'Itu gelar liga pertama klub setelah penantian 26 tahun, dan musim pertama kompetisi dengan format baru.' },
      { id: 'q_fe34a1', q: 'Eric Cantona datang ke United pada 1992 lewat transfer mengejutkan dari rival mana, yang baru saja ia bantu menjadi juara?', o: ['Leeds United', 'Sheffield Wednesday', 'Aston Villa', 'Nottingham Forest'], a: 0, hint: 'Kesepakatan itu hanya bernilai sekitar satu juta pound dan sering disebut transfer paling menguntungkan dalam sejarah liga.' },
      { id: 'q_c3fcce', en: 'A kung-fu kick', q: 'Pada 25 Januari 1995, Eric Cantona dihukum larangan bermain delapan bulan karena melakukan apa terhadap suporter Crystal Palace di Selhurst Park?', o: ['Tendangan kung-fu', 'Melempar sepatunya', 'Meludahinya', 'Menanduk petugas keamanan'], a: 0, hint: 'Kejadian itu terjadi tepat setelah ia menerima kartu merah dan berjalan ke arah tribun.' },
      { id: 'q_eb8687', q: 'Pemain sayap mana yang mencetak gol langsung dari garis tengah melawan Wimbledon pada 1996?', o: ['Ryan Giggs', 'David Beckham', 'Lee Sharpe', 'Andrei Kanchelskis'], a: 1, hint: 'Gol itu terjadi di laga pembuka musim dan langsung membuat namanya dikenal di seluruh Inggris.' },
      { id: 'q_89d02c', en: 'A booking ruled him out of the final', q: 'Roy Keane tampil luar biasa sebagai kapten di semifinal Liga Champions 1999 di Juventus, padahal ia tahu apa?', o: ['Ia akan dijual musim panas itu', 'Kartu kuning membuatnya absen di final', 'Kakinya patah', 'Ferguson akan mencadangkannya'], a: 1, hint: 'Ia tetap menggerakkan tim sepanjang laga meski sudah pasti tidak bisa ikut malam terbesar klub.' },
      { id: 'q_50030f', q: 'Rekor siapa yang dilewati Wayne Rooney pada 2017 sehingga ia menjadi pencetak gol terbanyak sepanjang sejarah United?', o: ['Denis Law', 'Bobby Charlton', 'Jack Rowley', 'Ruud van Nistelrooy'], a: 1, hint: 'Pemegang rekor sebelumnya adalah juara dunia 1966 yang juga selamat dari tragedi Munich.' },
      { id: 'q_96ffa8', q: 'Sampai 2025, berapa total gelar liga tertinggi Inggris yang dimenangi Manchester United, sama dengan Liverpool di puncak daftar sepanjang masa?', o: ['18', '19', '20', '22'], a: 2, hint: 'Gelar terakhir datang pada musim terakhir Sir Alex Ferguson, 2012-13.' },
      { id: 'q_b53ba7', q: 'Manchester United memecahkan rekor transfer dunia pada 2016 untuk memulangkan gelandang mana dari Juventus?', o: ['Ander Herrera', 'Nemanja Matic', 'Paul Pogba', 'Marouane Fellaini'], a: 2, hint: 'Ia pernah meninggalkan Old Trafford secara gratis empat tahun sebelumnya, yang membuat transfer ini makin dibicarakan.' },
      { id: 'q_709115', q: 'Penyerang mana yang direkrut dari Arsenal pada 2012 dan membawa Manchester United ke gelar liga terakhir Sir Alex Ferguson?', o: ['Robin van Persie', 'Dimitar Berbatov', 'Radamel Falcao', 'Zlatan Ibrahimovic'], a: 0, hint: 'Ia menjadi pencetak gol terbanyak liga musim itu, termasuk voli terkenal ke gawang Aston Villa.' },
      { id: 'q_42d3ad', q: 'Kapten bertipe petarung mana, direkrut dari West Brom pada 1981, yang dikenal sebagai “Captain Marvel” sepanjang 1980-an?', o: ['Steve Bruce', 'Bryan Robson', 'Roy Keane', 'Norman Whiteside'], a: 1, hint: 'Ia menjadi kapten klub dan tim nasional Inggris, dan terkenal terus bermain meski cedera.' },
    ],
    copy: {
      tasterEyebrow: 'Contoh gratis · Tanpa daftar',
      tasterH: 'Seberapa paham kamu soal Manchester United?',
      tasterPh: 'Sepuluh soal cepat untuk mengukur Ball IQ Setan Merah kamu.',
      tasterNote: 'Ini hanya contoh soal — kuis lengkapnya jauh lebih banyak.',
      playSection: 'Mainkan kuis Manchester United',
      playSub: 'Ketuk salah satu jawaban untuk memeriksanya — langsung benar/salah, plus cerita di belakangnya.',
      faqH: 'Kuis Manchester United — Pertanyaan umum',
      aboutQ: 'Tentang kuis Manchester United ini',
      bandH: 'Merasa paling paham Setan Merah? Buktikan di aplikasinya.',
      bandP: 'Rentetan harian, 1v1 langsung, rating sampai 99 — semua kuis dalam satu aplikasi. Aplikasinya berbahasa Inggris.',
      alsoH: 'Halaman yang sama dalam bahasa Inggris',
      alsoP: 'Ini versi bahasa Indonesia dari kuis Manchester United kami. Versi aslinya, dengan 42 soal, ada di sini:',
      alsoLink: 'Manchester United quiz (English)',
      statsLine: (n, e, m, h) => `Ball IQ punya ${n} soal Manchester United — ${e} mudah, ${m} sedang, dan ${h} sulit.`,
    },
  },
  // ── Arsenal ────────────────────────────────────────────────────────────────
  // Added SECOND and for a measured reason, not a hunch. Google Trends,
  // Indonesia, past 12 months, average search interest:
  //
  //     Arsenal 24 · Liverpool 18 · Chelsea 17 · Manchester United 9
  //
  // United — the club this file opened with, on my assumption — came LAST by
  // 2.7x. Alex asked for research before more pages and he was right to.
  //
  // ⚠️ The caveat travels with the number: those are raw search TERMS, and three
  // of the four are homonyms in Indonesia ("arsenal" is a common noun,
  // "Liverpool" a city, and "Chelsea" a very common Indonesian given name), so
  // only United's 9 is clean. Re-running with unambiguous forms ("Arsenal FC")
  // returned too little volume to chart — which says Indonesian searchers use
  // the PLAIN club name, so the raw comparison is closer to the real query set
  // than the confound implies. Arsenal is the better bet on the evidence we
  // have; United stays as the control.
  {
    club: 'Arsenal',
    slug: 'arsenal',
    lang: 'id',
    name: 'Arsenal',
    h1: 'Kuis Arsenal',
    title: 'Kuis Arsenal — Tebak Meriam London | Ball IQ',
    description:
      'Kuis Arsenal gratis dengan jawaban berpenjelasan: The Invincibles, Wenger, Henry, Bergkamp, dan rekor Piala FA.',
    kind: 'Kuis klub',
    statLine: 'Gratis · 67 soal Arsenal · tanpa daftar',
    playLabel: 'Mulai kuis',
    intro: [
      'Meriam London punya salah satu basis pendukung terbesar di Indonesia. Kuis gratis ini menelusuri seluruh sejarah klub: dari Dial Square dan para pekerja pabrik amunisi pada 1886, lini belakang legendaris era 1990-an, 22 tahun Arsène Wenger, Thierry Henry dan Dennis Bergkamp, sampai rekor Piala FA yang tidak tersentuh klub lain.',
      'Soalnya benar-benar naik tingkat. Ketika sejarah klub masih diperdebatkan, kami memilih tidak menerbitkan soal itu daripada memihak satu versi. Yang terbit adalah yang bisa diverifikasi.',
      'Setiap jawaban di set Arsenal punya penjelasan tertulis, jadi salah menjawab pun tetap mengajarkan sesuatu tentang bagaimana Arsenal meraih apa yang mereka raih.',
    ],
    faq: [
      { q: 'Apakah kuis Arsenal ini gratis?', a: 'Gratis. Bisa langsung dimainkan di browser, tanpa daftar dan tanpa mengunduh apa pun. Semua soal di halaman ini bebas diakses.' },
      { q: 'Apa saja yang dibahas dalam kuis ini?', a: 'Sejarah klub sejak 1886, era Wenger, Henry, Bergkamp, Vieira dan lini belakang 1990-an, final-final Piala FA, transfer besar, sampai era Saka dan gelar Liga Primer. Tingkat kesulitannya naik dari mudah sampai benar-benar sulit.' },
      { q: 'Dari mana soal-soal ini berasal?', a: 'Semuanya ditulis dan diperiksa manual, tidak pernah dibuat otomatis. Setiap fakta melewati dua pemeriksaan independen sebelum diterbitkan, dan kalau ada yang tidak bisa dipastikan, soalnya tidak kami terbitkan.' },
      { q: 'Apakah aplikasi Ball IQ tersedia dalam bahasa Indonesia?', a: 'Belum: halaman ini berbahasa Indonesia, tetapi aplikasinya masih berbahasa Inggris. Kami sedang mengukur minat sebelum menerjemahkannya — kalau kamu sampai di sini, kamu sudah membantu kami memutuskan.' },
    ],
    taster: [
      { id: 'q_fa63f7', q: 'Siapa pencetak gol terbanyak sepanjang sejarah Arsenal?', o: ['Ian Wright', 'Dennis Bergkamp', 'Thierry Henry', 'Robin van Persie'], a: 2, hint: 'Ia mencetak 228 gol untuk klub dan patungnya berdiri di depan Emirates Stadium.' },
      // `en` because Indonesian localises the competition name ("Piala FA"),
      // so the strings share no letters — the guard is right to demand it.
      { id: 'q_c46593', en: 'FA Cup', q: 'Arsenal memegang rekor juara terbanyak di kompetisi Inggris yang mana?', o: ['Piala Liga', 'Piala FA', 'Community Shield', 'Divisi Satu/Liga Primer'], a: 1, hint: 'Kompetisi piala tertua di dunia, dan Arsenal punya lebih banyak trofinya daripada klub mana pun.' },
      { id: 'q_178706', q: 'Berapa Piala FA yang dimenangkan Arsène Wenger bersama Arsenal?', o: ['5', '6', '7', '8'], a: 2, hint: 'Jumlah itu menjadikannya manajer tersukses dalam sejarah kompetisi tersebut.' },
      { id: 'q_4d67bb', q: 'Thierry Henry bergabung dengan Arsenal pada Agustus 1999 seharga £11 juta — dari klub Italia mana?', o: ['Juventus', 'AC Milan', 'Inter', 'Parma'], a: 0, hint: 'Di Italia ia dimainkan sebagai pemain sayap; Wenger yang memindahkannya ke posisi penyerang tengah.' },
      { id: 'q_a52765', q: 'Setelah menunggu 22 tahun dan tiga kali finis runner-up berturut-turut, Arsenal akhirnya menjadi juara Liga Primer pada musim apa?', o: ['2024-25', '2025-26', '2023-24', '2022-23'], a: 1, hint: 'Gelar liga sebelumnya datang pada musim tak terkalahkan 2003-04.' },
      { id: 'q_f49ff1', q: 'Klub mana yang mengakhiri dominasi Manchester United atas gelar Liga Primer pada 2001-02?', o: ['Liverpool', 'Chelsea', 'Leeds United', 'Arsenal'], a: 3, hint: 'Gelar itu dipastikan justru di Old Trafford, di kandang lawan langsung mereka.' },
      { id: 'q_18aa78', q: 'Apa nama paling awal klub yang kemudian menjadi Arsenal, saat didirikan para pekerja pabrik amunisi pada 1886?', o: ['Royal Arsenal', 'Woolwich United', 'Dial Square', 'Plumstead Rovers'], a: 2, hint: 'Namanya diambil dari salah satu bengkel di kompleks persenjataan Woolwich tempat para pendirinya bekerja.' },
      { id: 'q_a7b699', q: 'Remaja Spanyol mana yang meninggalkan akademi La Masia Barcelona pada usia 16 tahun di September 2003 untuk bergabung dengan Arsenal?', o: ['Cesc Fàbregas', 'Gerard Piqué', 'Lionel Messi', 'Xavi'], a: 0, hint: 'Ia langsung menjadi pemain tim utama termuda dalam sejarah klub saat itu.' },
      { id: 'q_2d59e9', q: 'Lini belakang terkenal Arsenal era 1990-an berisi Adams, Bould, Dixon — siapa yang melengkapinya?', o: ['Ashley Cole', 'Nigel Winterburn', 'Martin Keown', 'Kenny Sansom'], a: 1, hint: 'Bek kiri ini bermain lebih dari 400 laga untuk klub dan menjadi bagian dari dua gelar liga.' },
      { id: 'q_1607cb', q: 'Siapa pencetak gol terbanyak Arsenal di Liga Primer 2023-24 dengan 16 gol?', o: ['Martinelli', 'Havertz', 'Saka', 'Jesus'], a: 2, hint: 'Pemain sayap kanan produk akademi Hale End ini juga memimpin daftar assist klub musim itu.' },
    ],
    sample: [
      { id: 'q_0f2de2', q: 'Nomor punggung berapa yang dipakai Patrick Vieira di Arsenal sepanjang hampir seluruh kariernya (1996-2005)?', o: ['4', '5', '6', '8'], a: 0, hint: 'Nomor itu diwarisi dari tradisi gelandang bertahan klub dan kemudian dipakai Fàbregas.' },
      { id: 'q_95ee06', en: 'A three-touch turn and finish', q: 'Dennis Bergkamp mencetak hat-trick melawan Leicester pada Agustus 1997, dan gol ketiganya dianggap ikonik — apa yang membuatnya begitu diingat?', o: ['Tendangan sepeda', 'Tiga sentuhan: kontrol, putar, dan selesaikan', 'Lob dari 37 meter', 'Voli kaki kiri'], a: 1, hint: 'Gol itu terpilih sebagai gol terbaik Liga Primer sepanjang masa dalam beberapa jajak pendapat.' },
      { id: 'q_9bfa7a', q: 'Siapa yang memberi assist untuk tendangan scorpion Olivier Giroud melawan Crystal Palace pada 1 Januari 2017?', o: ['Sánchez', 'Özil', 'Iwobi', 'Bellerín'], a: 0, hint: 'Umpan silangnya datang dari sisi kiri dan gol itu memenangi Puskás Award tahun tersebut.' },
      { id: 'q_0160ac', q: 'Siapa yang mencetak penalti penentu bagi Arsenal di final Piala FA 2005 melawan Manchester United?', o: ['Henry', 'Pires', 'Vieira', 'Bergkamp'], a: 2, hint: 'Itu menjadi sentuhan terakhirnya untuk klub — ia pindah ke Juventus musim panas itu.' },
      { id: 'q_e115f8', q: 'Siapa yang mencetak gol kemenangan Arsenal di masa tambahan final Piala FA 2014, melengkapi kebangkitan dari ketertinggalan 2-0 melawan Hull City?', o: ['Giroud', 'Ramsey', 'Özil', 'Walcott'], a: 1, hint: 'Gol itu mengakhiri sembilan tahun tanpa trofi bagi klub.' },
      { id: 'q_9fbb3b', q: 'Pemain sayap Belanda mana yang dijual Arsenal ke Barcelona pada 2000 seharga £25 juta?', o: ['Boudewijn Zenden', 'Marc Overmars', 'Arjen Robben', 'Ryan Babel'], a: 1, hint: 'Ia bagian dari tim ganda juara 1998 dan transfernya menjadi rekor untuk pemain Belanda saat itu.' },
      { id: 'q_a302d8', q: 'Pada musim apa Tottenham pertama kali finis di atas Arsenal di Liga Primer era Arsène Wenger?', o: ['2016-17', '1998-99', '1999-2000', '2000-01'], a: 0, hint: 'Itu mengakhiri rentetan 20 tahun yang oleh pendukung Arsenal dijuluki “St Totteringham’s Day”.' },
      { id: 'q_8a6b9b', en: 'Three (1980s, 1990s, 2000s)', q: 'Tony Adams, yang hanya bermain untuk Arsenal sepanjang kariernya, menjadi kapten tim juara liga di berapa dekade berbeda?', o: ['Tiga (1980-an, 1990-an, 2000-an)', 'Dua (1980-an, 1990-an)', 'Empat (1980-an sampai 2010-an)', 'Dua (1990-an, 2000-an)'], a: 0, hint: 'Ia mengangkat trofi liga pada 1989, 1991, 1998 dan 2002.' },
      { id: 'q_d42b8a', q: 'Siapa yang mencetak gol kemenangan di menit terakhir saat Arsenal mengalahkan Manchester United 3-2 di final Piala FA 1979, yang dijuluki “Final Lima Menit”?', o: ['Stapleton', 'Brady', 'Price', 'Sunderland'], a: 3, hint: 'Arsenal memimpin 2-0 sebelum United menyamakan dalam dua menit — lalu gol ini datang.' },
      { id: 'q_ba8366', q: 'Penyerang Arsenal mana yang mencetak kedua gol di final Piala Liga 1987, trofi Piala Liga pertama klub, saat menang 2-1 atas Liverpool?', o: ['Ian Allinson', 'Nicholas', 'Niall Quinn', 'Paul Davis'], a: 1, hint: 'Gol keduanya datang di menit-menit akhir dan menjadi trofi pertama era George Graham.' },
      { id: 'q_d4df55', q: 'Berapa klub yang pernah ditangani Arsène Wenger sebelum Arsenal?', o: ['1', '2', '4', '3'], a: 3, hint: 'Ia melatih di Prancis dan Jepang sebelum tiba di London pada 1996.' },
      { id: 'q_7a6a33', q: 'Insiden “Pizzagate” di Old Trafford pada Oktober 2004 melibatkan pemain Arsenal berusia 17 tahun yang melempar sepotong pizza dan mengenai Sir Alex Ferguson. Siapa dia?', o: ['Cesc Fàbregas', 'Patrick Vieira', 'José Antonio Reyes', 'Henry'], a: 0, hint: 'Kejadian itu terjadi setelah laga yang mengakhiri rekor 49 pertandingan tanpa kalah Arsenal.' },
    ],
    copy: {
      tasterEyebrow: 'Contoh gratis · Tanpa daftar',
      tasterH: 'Seberapa paham kamu soal Arsenal?',
      tasterPh: 'Sepuluh soal cepat untuk mengukur Ball IQ Meriam London kamu.',
      tasterNote: 'Ini hanya contoh soal — kuis lengkapnya jauh lebih banyak.',
      playSection: 'Mainkan kuis Arsenal',
      playSub: 'Ketuk salah satu jawaban untuk memeriksanya — langsung benar/salah, plus cerita di belakangnya.',
      faqH: 'Kuis Arsenal — Pertanyaan umum',
      aboutQ: 'Tentang kuis Arsenal ini',
      bandH: 'Merasa paling paham Meriam London? Buktikan di aplikasinya.',
      bandP: 'Rentetan harian, 1v1 langsung, rating sampai 99 — semua kuis dalam satu aplikasi. Aplikasinya berbahasa Inggris.',
      alsoH: 'Halaman yang sama dalam bahasa Inggris',
      alsoP: 'Ini versi bahasa Indonesia dari kuis Arsenal kami. Versi aslinya, dengan 67 soal, ada di sini:',
      alsoLink: 'Arsenal quiz (English)',
      statsLine: (n, e, m, h) => `Ball IQ punya ${n} soal Arsenal — ${e} mudah, ${m} sedang, dan ${h} sulit.`,
    },
  },
];

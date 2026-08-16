// Localised QUIZ HUBS — /<lang>/quiz/, the head term in each language.
//
// ⚠️ WHY THIS FILE EXISTS. We shipped sixteen localised CLUB pages and nothing
// above them. So `quiz de river plate` ranks 8.6 and `quiz del barcelona` 6.6,
// while the head term every one of those searchers also types — "quiz de
// fútbol" — had no page at all. This is the same gap the App Store
// localisation just closed: the long tail was built and the head was empty.
//
// ⚠️ A HUB ONLY EXISTS FOR A LANGUAGE THAT HAS CLUBS UNDER IT. A head-term page
// with nothing beneath it is a thin page competing for a hard term, which is
// precisely the /lists mistake — 47% of impressions, 4% of clicks. Italian,
// German and French hubs land WITH their club waves, not before them.
//
// ⚠️ THE TASTER COSTS NOTHING. It is drawn from questions ALREADY translated in
// clubs-<lang>.mjs and already validated against the bank by gen-seo-pages. A
// playable hub matters: our own Clarity read is that playable pages out-hold
// readable ones, and lists without a taster got 2.3 seconds.
//
// ⚠️ THE APP IS ENGLISH AND WE SAY SO. Every localised page carries that line
// already ("Uygulama İngilizce"). Keep it. Sending a Turkish reader to an
// English app without warning is how you earn a one-star review.

// Language names IN THEIR OWN LANGUAGE — a Spanish speaker scanning an English
// page recognises "Español", not "Spanish". Used for the English→localised links
// that keep the localised layer from being orphaned.
export const LANG_LABEL = {
  es: 'Español',
  pt: 'Português',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
};

export const HUBS_INTL = [
  {
    lang: 'es',
    title: 'Quiz de Fútbol — Pon a prueba lo que sabes | Ball IQ',
    description: 'Quiz de fútbol escrito y verificado por aficionados. Elige tu club, responde y descubre cuánto sabes de verdad. Gratis y sin registro.',
    h1: 'Quiz de Fútbol',
    kind: 'Quiz de fútbol',
    intro: [
      'Un quiz de fútbol para quien ve fútbol de verdad. Cada pregunta está escrita y contrastada por aficionados: nunca copiada, nunca generada automáticamente.',
      'Elige el club al que animas y responde diez preguntas. La mayoría trae una explicación breve, así que terminas sabiendo algo que no sabías al empezar.',
    ],
    tasterEyebrow: 'Prueba gratis · Sin registro',
    tasterH: '¿Cuánto sabes de fútbol?',
    tasterPh: 'Unas preguntas rápidas para medir tu Ball IQ.',
    tasterNote: 'Preguntas de muestra — cada club tiene muchas más.',
    playLabel: 'Jugar',
    clubsH: 'Elige tu club',
    clubsSub: 'Un quiz propio y verificado para cada uno.',
    bandH: '¿Crees que sabes de fútbol? Demuéstralo.',
    bandP: 'Rachas, 1v1 en directo y una puntuación sobre 99. La aplicación está en inglés.',
    alsoH: 'La misma página en inglés',
  },
  {
    lang: 'pt',
    title: 'Quiz de Futebol — Teste o que você sabe | Ball IQ',
    description: 'Quiz de futebol escrito e conferido por torcedores. Escolha seu clube, responda e descubra o quanto você realmente sabe. Grátis, sem cadastro.',
    h1: 'Quiz de Futebol',
    kind: 'Quiz de futebol',
    intro: [
      'Um quiz de futebol para quem assiste futebol de verdade. Cada pergunta é escrita e conferida por torcedores: nunca copiada, nunca gerada automaticamente.',
      'Escolha o clube que você torce e responda dez perguntas. A maioria vem com uma explicação curta, então você termina sabendo algo que não sabia.',
    ],
    tasterEyebrow: 'Teste grátis · Sem cadastro',
    tasterH: 'Quanto você sabe de futebol?',
    tasterPh: 'Algumas perguntas rápidas para medir o seu Ball IQ.',
    tasterNote: 'Perguntas de amostra — cada clube tem muitas mais.',
    playLabel: 'Jogar',
    clubsH: 'Escolha o seu clube',
    clubsSub: 'Um quiz próprio e conferido para cada um.',
    bandH: 'Acha que sabe de futebol? Prove.',
    bandP: 'Sequências, 1v1 ao vivo e uma nota de 0 a 99. O aplicativo está em inglês.',
    alsoH: 'A mesma página em inglês',
  },
  {
    lang: 'tr',
    title: 'Futbol Quiz — Bilgini test et | Ball IQ',
    description: 'Futbolseverlerin yazdığı ve doğruladığı futbol quizi. Kulübünü seç, soruları yanıtla ve gerçekte ne kadar bildiğini gör. Ücretsiz, kayıt yok.',
    h1: 'Futbol Quiz',
    kind: 'Futbol quizi',
    intro: [
      'Gerçekten futbol izleyenler için bir futbol quizi. Buradaki her soru futbolseverler tarafından yazılır ve doğrulanır: hiçbiri kopyalanmaz, hiçbiri otomatik üretilmez.',
      'Tuttuğun kulübü seç ve on soruyu yanıtla. Cevapların çoğunda kısa bir açıklama var; başladığında bilmediğin bir şeyi öğrenerek bitiriyorsun.',
    ],
    tasterEyebrow: 'Ücretsiz deneme · Kayıt yok',
    tasterH: 'Futbolu ne kadar iyi biliyorsun?',
    tasterPh: 'Ball IQ’nu ölçmek için birkaç hızlı soru.',
    tasterNote: 'Örnek sorular — her kulüpte çok daha fazlası var.',
    playLabel: 'Oyna',
    clubsH: 'Kulübünü seç',
    clubsSub: 'Her biri için ayrı, doğrulanmış bir quiz.',
    bandH: 'Futbolu bildiğini mi düşünüyorsun? Kanıtla.',
    bandP: 'Seriler, canlı 1v1 ve 99 üzerinden bir puan. Uygulama İngilizce.',
    alsoH: 'Aynı sayfanın İngilizcesi',
  },
  {
    lang: 'it',
    title: 'Quiz di Calcio — Metti alla prova quello che sai | Ball IQ',
    description: 'Quiz di calcio scritto e verificato da tifosi. Scegli la tua squadra, rispondi e scopri quanto sai davvero. Gratis, senza registrazione.',
    h1: 'Quiz di Calcio',
    kind: 'Quiz di calcio',
    intro: [
      'Un quiz di calcio per chi il calcio lo guarda davvero. Ogni domanda è scritta e verificata da tifosi: mai copiata, mai generata automaticamente.',
      'Scegli la squadra per cui tifi e rispondi a dieci domande. Quasi tutte hanno una spiegazione breve, così alla fine sai qualcosa che non sapevi quando hai iniziato.',
    ],
    tasterEyebrow: 'Prova gratis · Senza registrazione',
    tasterH: 'Quanto ne sai di calcio?',
    tasterPh: 'Qualche domanda veloce per misurare il tuo Ball IQ.',
    tasterNote: 'Domande di esempio — ogni squadra ne ha molte altre.',
    playLabel: 'Gioca',
    clubsH: 'Scegli la tua squadra',
    clubsSub: 'Un quiz dedicato e verificato per ciascuna.',
    bandH: 'Pensi di sapere tutto di calcio? Dimostralo.',
    bandP: 'Serie di vittorie, 1v1 dal vivo e un punteggio su 99. L’app è in inglese.',
    alsoH: 'La stessa pagina in inglese',
  },
  {
    lang: 'id',
    title: 'Kuis Sepak Bola — Uji pengetahuanmu | Ball IQ',
    description: 'Kuis sepak bola yang ditulis dan diperiksa oleh penggemar. Pilih klubmu, jawab pertanyaannya, dan lihat seberapa banyak yang kamu tahu. Gratis, tanpa daftar.',
    h1: 'Kuis Sepak Bola',
    kind: 'Kuis sepak bola',
    intro: [
      'Kuis sepak bola untuk orang yang benar-benar menonton sepak bola. Setiap pertanyaan ditulis dan diperiksa oleh penggemar: tidak pernah disalin, tidak pernah dibuat otomatis.',
      'Pilih klub yang kamu dukung dan jawab sepuluh pertanyaan. Sebagian besar jawaban disertai penjelasan singkat, jadi kamu selesai dengan tahu sesuatu yang baru.',
    ],
    tasterEyebrow: 'Coba gratis · Tanpa daftar',
    tasterH: 'Seberapa paham kamu soal sepak bola?',
    tasterPh: 'Beberapa pertanyaan cepat untuk mengukur Ball IQ-mu.',
    tasterNote: 'Contoh pertanyaan — tiap klub punya jauh lebih banyak.',
    playLabel: 'Main',
    clubsH: 'Pilih klubmu',
    clubsSub: 'Kuis khusus dan terverifikasi untuk masing-masing.',
    bandH: 'Merasa paham sepak bola? Buktikan.',
    bandP: 'Rentetan, 1v1 langsung, dan skor dari 99. Aplikasinya berbahasa Inggris.',
    alsoH: 'Halaman yang sama dalam bahasa Inggris',
  },
];

/* Taster CHROME per language — the widget's own words, not the questions.
   ⚠️ Sixteen localised club pages shipped hand-written Spanish, Portuguese and
   Turkish questions wrapped in English furniture: "Question 1 / 6", "correct",
   "Your Ball IQ", "Play again". The questions were localised and the game around
   them was not. TASTER_JS now reads these off the card, and English pages pass
   nothing and keep the defaults. */
// ⚠️ `correct1` IS THE SINGULAR, and it exists because the counter starts at
// zero and passes through one on the way up — so "1 correctas" is on screen for
// every reader who gets the first question right. English needs no such key
// ("1 correct"), which is exactly why the plural-only shape looked finished.
// Turkish and Indonesian do not inflect the adjective after a number, so they
// legitimately have no entry and fall back to the plural.
export const TASTER_I18N = {
  es: { question: 'Pregunta', correct: 'correctas', correct1: 'correcta', next: 'Siguiente →', seeScore: 'Ver tu resultado →', yourIq: 'Tu Ball IQ', scored: 'Acertaste', playFull: 'Jugar el quiz completo', getApp: 'Descargar la app', again: 'Jugar otra vez' },
  it: { question: 'Domanda', correct: 'giuste', correct1: 'giusta', next: 'Avanti →', seeScore: 'Vedi il tuo risultato →', yourIq: 'Il tuo Ball IQ', scored: 'Hai indovinato', playFull: 'Gioca il quiz completo', getApp: 'Scarica l’app', again: 'Gioca ancora' },
  pt: { question: 'Pergunta', correct: 'certas', correct1: 'certa', next: 'Próxima →', seeScore: 'Ver seu resultado →', yourIq: 'Seu Ball IQ', scored: 'Você acertou', playFull: 'Jogar o quiz completo', getApp: 'Baixar o app', again: 'Jogar de novo' },
  tr: { question: 'Soru', correct: 'doğru', next: 'Sonraki →', seeScore: 'Sonucunu gör →', yourIq: 'Ball IQ’n', scored: 'Doğru sayın', playFull: 'Quizin tamamını oyna', getApp: 'Uygulamayı indir', again: 'Tekrar oyna' },
  id: { question: 'Pertanyaan', correct: 'benar', next: 'Berikutnya →', seeScore: 'Lihat skormu →', yourIq: 'Ball IQ kamu', scored: 'Kamu benar', playFull: 'Main kuis lengkapnya', getApp: 'Unduh aplikasinya', again: 'Main lagi' },
};

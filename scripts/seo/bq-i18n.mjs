// The .bq quiz widget's UI strings in the eight languages the localised club
// pages ship in (es, de, nl, fr, it, pt, tr, id). English is NOT here: it is
// the engine's built-in default (every string sits in the engine as
// T('key','English text')), so a missing key can never blank a label — it
// falls back to English. renderQuizSet({ lang }) serialises the language's
// table into data-i18n; the engine reads it once at boot.
//
// {placeholders} are substituted by the engine's fmt(): {name} club, {n} total,
// {sc} score, {pct} percent, {best} best streak, {more} questions left, {iq},
// {tier}, {d} days, {date}. Keep every placeholder a template carries in
// English — bq-i18n.test.js checks that per language.
//
// `tiers` are the six generic fan tiers (the club-specific English ones such as
// "Boot Room" or "Aguerooo" are culture-bound and stay English-only).
//
// ⚠️ DRAFTED 2026-09-05 FOR ALEX'S REVIEW (es/de/nl/pt especially) before the
// 46 localised pages switch from the old taster to this widget. Reviewed
// languages get a `reviewed: true` flag; the switch waits for it.
export const BQ_I18N_KEYS = [
  'question', 'of', 'next', 'seeResult', 'srCorrect', 'srWrong', 'ariaCorrect', 'ariaWrong', 'why', 'streakWord',
  'yourIq', 'right', 'daysRow', 'keepGoing', 'playAgain', 'share', 'allDone', 'appLine',
  'footleTitle', 'footleLine', 'play', 'namePrompt', 'copied', 'copyPrompt', 'shareTxt', 'quizTitle',
  'lenLabel', 'fullSet', 'quick', 'standard', 'todaySet', 'freshOrder', 'yourStreak', 'dayOk', 'dayKeep', 'youPlayed', 'earlier',
  'diff_easy', 'diff_medium', 'diff_hard', 'tiers',
];

export const BQ_I18N = {
  es: {
    question: 'Pregunta', of: 'de', next: 'Siguiente →', seeResult: 'Ver tu resultado →',
    srCorrect: 'Correcto. ', srWrong: 'Incorrecto. La respuesta es ', ariaCorrect: 'Respuesta correcta: ', ariaWrong: 'Tu respuesta, incorrecta: ',
    why: 'Por qué', streakWord: 'seguidas', yourIq: 'Tu Ball IQ de {name}', right: '{sc} de {n} correctas · {pct}% · mejor racha {best}',
    daysRow: '{d} días seguidos', keepGoing: 'Seguir — {more} más →', playAgain: 'Jugar otra vez', share: 'Compartir tu Ball IQ de {name}',
    allDone: 'Esas son todas las preguntas de {name} que tenemos aquí — mañana, en otro orden.', appLine: 'También en la app — rachas, recordatorios y 1v1 en directo →',
    footleTitle: 'El Footle de hoy', footleLine: 'Adivina el futbolista en seis. Un nombre nuevo a medianoche, el mismo para todos.', play: 'Jugar →',
    namePrompt: '¿Añadir tu nombre a la tarjeta de puntuación? (opcional)', copied: 'Copiado ✓', copyPrompt: 'Copia tu puntuación',
    shareTxt: 'Mi Ball IQ de {name} es {iq} — {tier} ({sc}/{n}). Supéralo.', quizTitle: 'Quiz de {name}',
    lenLabel: 'Cambiar la longitud', fullSet: 'Todas', quick: '{n} rápidas', standard: '{n} estándar',
    todaySet: 'Set de {name} de hoy', freshOrder: ' · {date} — un orden nuevo cada día', yourStreak: 'Tu racha', dayOk: 'día {n} ✓', dayKeep: 'día {n} — no la pierdas',
    youPlayed: 'Ya jugaste', earlier: 'hoy antes {sc} de {n}, IQ {iq}',
    diff_easy: 'fácil', diff_medium: 'media', diff_hard: 'difícil',
    tiers: ['De paso', 'Aficionado', 'Abonado', 'Local y visitante', 'Historiador del club', 'Leyenda del club'],
  },
  de: {
    question: 'Frage', of: 'von', next: 'Weiter →', seeResult: 'Ergebnis ansehen →',
    srCorrect: 'Richtig. ', srWrong: 'Falsch. Die Antwort ist ', ariaCorrect: 'Richtige Antwort: ', ariaWrong: 'Deine Antwort, falsch: ',
    why: 'Warum', streakWord: 'in Folge', yourIq: 'Dein {name}-Ball IQ', right: '{sc} von {n} richtig · {pct}% · beste Serie {best}',
    daysRow: '{d} Tage in Folge', keepGoing: 'Weitermachen — noch {more} →', playAgain: 'Nochmal spielen', share: 'Deinen {name}-Ball IQ teilen',
    allDone: 'Das waren alle {name}-Fragen, die wir hier haben — morgen in neuer Reihenfolge.', appLine: 'Auch in der App — Serien, Erinnerungen und Live-1v1 →',
    footleTitle: 'Das Footle von heute', footleLine: 'Errate den Fußballer in sechs Versuchen. Um Mitternacht ein neuer Name, für alle derselbe.', play: 'Spielen →',
    namePrompt: 'Vornamen auf die Ergebniskarte setzen? (optional)', copied: 'Kopiert ✓', copyPrompt: 'Kopiere dein Ergebnis',
    shareTxt: 'Mein {name}-Ball IQ ist {iq} — {tier} ({sc}/{n}). Schlag das.', quizTitle: '{name}-Quiz',
    lenLabel: 'Länge ändern', fullSet: 'Alle', quick: '{n} kurz', standard: '{n} standard',
    todaySet: 'Das {name}-Set von heute', freshOrder: ' · {date} — jeden Tag eine neue Reihenfolge', yourStreak: 'Deine Serie', dayOk: 'Tag {n} ✓', dayKeep: 'Tag {n} — halt sie am Leben',
    youPlayed: 'Du hast gespielt', earlier: 'heute schon {sc} von {n}, IQ {iq}',
    diff_easy: 'leicht', diff_medium: 'mittel', diff_hard: 'schwer',
    tiers: ['Tagesgast', 'Gelegenheitsfan', 'Dauerkarte', 'Heim und Auswärts', 'Vereinshistoriker', 'Vereinslegende'],
  },
  nl: {
    question: 'Vraag', of: 'van', next: 'Volgende →', seeResult: 'Bekijk je score →',
    srCorrect: 'Goed. ', srWrong: 'Fout. Het antwoord is ', ariaCorrect: 'Juiste antwoord: ', ariaWrong: 'Jouw antwoord, fout: ',
    why: 'Waarom', streakWord: 'op rij', yourIq: 'Jouw {name} Ball IQ', right: '{sc} van {n} goed · {pct}% · beste reeks {best}',
    daysRow: '{d} dagen op rij', keepGoing: 'Doorgaan — nog {more} →', playAgain: 'Nog een keer', share: 'Deel je {name} Ball IQ',
    allDone: 'Dat waren alle {name}-vragen die we hier hebben — morgen in een nieuwe volgorde.', appLine: 'Ook in de app — reeksen, herinneringen en live 1v1 →',
    footleTitle: 'De Footle van vandaag', footleLine: 'Raad de voetballer in zes beurten. Om middernacht een nieuwe naam, dezelfde voor iedereen.', play: 'Spelen →',
    namePrompt: 'Je voornaam op de scorekaart? (optioneel)', copied: 'Gekopieerd ✓', copyPrompt: 'Kopieer je score',
    shareTxt: 'Mijn {name} Ball IQ is {iq} — {tier} ({sc}/{n}). Doe beter.', quizTitle: '{name}-quiz',
    lenLabel: 'Lengte aanpassen', fullSet: 'Alles', quick: '{n} snel', standard: '{n} standaard',
    todaySet: 'De {name}-set van vandaag', freshOrder: ' · {date} — elke dag een nieuwe volgorde', yourStreak: 'Je reeks', dayOk: 'dag {n} ✓', dayKeep: 'dag {n} — houd hem vast',
    youPlayed: 'Je speelde', earlier: 'eerder vandaag {sc} van {n}, IQ {iq}',
    diff_easy: 'makkelijk', diff_medium: 'gemiddeld', diff_hard: 'moeilijk',
    tiers: ['Dagjesmens', 'Gewone fan', 'Seizoenkaart', 'Thuis en uit', 'Clubhistoricus', 'Clublegende'],
  },
  fr: {
    question: 'Question', of: 'sur', next: 'Suivant →', seeResult: 'Voir ton résultat →',
    srCorrect: 'Correct. ', srWrong: 'Faux. La réponse est ', ariaCorrect: 'Bonne réponse : ', ariaWrong: 'Ta réponse, fausse : ',
    why: 'Pourquoi', streakWord: 'd’affilée', yourIq: 'Ton Ball IQ {name}', right: '{sc} sur {n} bonnes · {pct}% · meilleure série {best}',
    daysRow: '{d} jours d’affilée', keepGoing: 'Continuer — encore {more} →', playAgain: 'Rejouer', share: 'Partager ton Ball IQ {name}',
    allDone: 'C’étaient toutes les questions {name} que nous avons ici — un nouvel ordre demain.', appLine: 'Aussi dans l’appli — séries, rappels et 1v1 en direct →',
    footleTitle: 'Le Footle du jour', footleLine: 'Devine le footballeur en six essais. Un nouveau nom à minuit, le même pour tous.', play: 'Jouer →',
    namePrompt: 'Ajouter ton prénom sur la carte de score ? (facultatif)', copied: 'Copié ✓', copyPrompt: 'Copie ton score',
    shareTxt: 'Mon Ball IQ {name} est de {iq} — {tier} ({sc}/{n}). Fais mieux.', quizTitle: 'Quiz {name}',
    lenLabel: 'Changer la longueur', fullSet: 'Toutes', quick: '{n} rapides', standard: '{n} standard',
    todaySet: 'La série {name} du jour', freshOrder: ' · {date} — un nouvel ordre chaque jour', yourStreak: 'Ta série', dayOk: 'jour {n} ✓', dayKeep: 'jour {n} — ne la lâche pas',
    youPlayed: 'Tu as joué', earlier: 'plus tôt aujourd’hui {sc} sur {n}, IQ {iq}',
    diff_easy: 'facile', diff_medium: 'moyen', diff_hard: 'difficile',
    tiers: ['De passage', 'Supporter occasionnel', 'Abonné', 'Domicile et extérieur', 'Historien du club', 'Légende du club'],
  },
  it: {
    question: 'Domanda', of: 'di', next: 'Avanti →', seeResult: 'Vedi il tuo risultato →',
    srCorrect: 'Giusto. ', srWrong: 'Sbagliato. La risposta è ', ariaCorrect: 'Risposta giusta: ', ariaWrong: 'La tua risposta, sbagliata: ',
    why: 'Perché', streakWord: 'di fila', yourIq: 'Il tuo Ball IQ {name}', right: '{sc} su {n} giuste · {pct}% · miglior serie {best}',
    daysRow: '{d} giorni di fila', keepGoing: 'Continua — altre {more} →', playAgain: 'Gioca ancora', share: 'Condividi il tuo Ball IQ {name}',
    allDone: 'Erano tutte le domande su {name} che abbiamo qui — domani in un nuovo ordine.', appLine: 'Anche nell’app — serie, promemoria e 1v1 dal vivo →',
    footleTitle: 'Il Footle di oggi', footleLine: 'Indovina il calciatore in sei tentativi. Un nome nuovo a mezzanotte, lo stesso per tutti.', play: 'Gioca →',
    namePrompt: 'Aggiungere il tuo nome alla card del punteggio? (facoltativo)', copied: 'Copiato ✓', copyPrompt: 'Copia il tuo punteggio',
    shareTxt: 'Il mio Ball IQ {name} è {iq} — {tier} ({sc}/{n}). Battilo.', quizTitle: 'Quiz {name}',
    lenLabel: 'Cambia la lunghezza', fullSet: 'Tutte', quick: '{n} veloci', standard: '{n} standard',
    todaySet: 'Il set {name} di oggi', freshOrder: ' · {date} — un ordine nuovo ogni giorno', yourStreak: 'La tua serie', dayOk: 'giorno {n} ✓', dayKeep: 'giorno {n} — non fermarti',
    youPlayed: 'Hai giocato', earlier: 'prima oggi {sc} su {n}, IQ {iq}',
    diff_easy: 'facile', diff_medium: 'media', diff_hard: 'difficile',
    tiers: ['Di passaggio', 'Tifoso occasionale', 'Abbonato', 'Casa e trasferta', 'Storico del club', 'Leggenda del club'],
  },
  pt: {
    question: 'Pergunta', of: 'de', next: 'Próxima →', seeResult: 'Ver seu resultado →',
    srCorrect: 'Certo. ', srWrong: 'Errado. A resposta é ', ariaCorrect: 'Resposta certa: ', ariaWrong: 'Sua resposta, errada: ',
    why: 'Por quê', streakWord: 'seguidas', yourIq: 'Seu Ball IQ do {name}', right: '{sc} de {n} certas · {pct}% · melhor sequência {best}',
    daysRow: '{d} dias seguidos', keepGoing: 'Continuar — mais {more} →', playAgain: 'Jogar de novo', share: 'Compartilhar seu Ball IQ do {name}',
    allDone: 'Essas são todas as perguntas do {name} que temos aqui — amanhã, em outra ordem.', appLine: 'Também no app — sequências, lembretes e 1v1 ao vivo →',
    footleTitle: 'O Footle de hoje', footleLine: 'Adivinhe o jogador em seis tentativas. Um nome novo à meia-noite, o mesmo para todos.', play: 'Jogar →',
    namePrompt: 'Adicionar seu nome ao cartão de pontuação? (opcional)', copied: 'Copiado ✓', copyPrompt: 'Copie sua pontuação',
    shareTxt: 'Meu Ball IQ do {name} é {iq} — {tier} ({sc}/{n}). Supera essa.', quizTitle: 'Quiz do {name}',
    lenLabel: 'Mudar a quantidade', fullSet: 'Todas', quick: '{n} rápidas', standard: '{n} padrão',
    todaySet: 'O set do {name} de hoje', freshOrder: ' · {date} — uma ordem nova todo dia', yourStreak: 'Sua sequência', dayOk: 'dia {n} ✓', dayKeep: 'dia {n} — não perca',
    youPlayed: 'Você jogou', earlier: 'hoje mais cedo {sc} de {n}, IQ {iq}',
    diff_easy: 'fácil', diff_medium: 'média', diff_hard: 'difícil',
    tiers: ['De passagem', 'Torcedor casual', 'Sócio-torcedor', 'Em casa e fora', 'Historiador do clube', 'Lenda do clube'],
  },
  tr: {
    question: 'Soru', of: '/', next: 'Sonraki →', seeResult: 'Sonucunu gör →',
    srCorrect: 'Doğru. ', srWrong: 'Yanlış. Cevap: ', ariaCorrect: 'Doğru cevap: ', ariaWrong: 'Senin cevabın, yanlış: ',
    why: 'Neden', streakWord: 'seri', yourIq: '{name} Ball IQ’n', right: '{n} sorudan {sc} doğru · %{pct} · en iyi seri {best}',
    daysRow: '{d} gün üst üste', keepGoing: 'Devam et — {more} soru daha →', playAgain: 'Tekrar oyna', share: '{name} Ball IQ’ni paylaş',
    allDone: 'Buradaki tüm {name} soruları bunlardı — yarın yeni bir sırayla.', appLine: 'Uygulamada da — seriler, hatırlatmalar ve canlı 1v1 →',
    footleTitle: 'Bugünün Footle’ı', footleLine: 'Futbolcuyu altı denemede tahmin et. Gece yarısı yeni bir isim, herkes için aynı.', play: 'Oyna →',
    namePrompt: 'Skor kartına adını ekleyelim mi? (isteğe bağlı)', copied: 'Kopyalandı ✓', copyPrompt: 'Skorunu kopyala',
    shareTxt: '{name} Ball IQ’m {iq} — {tier} ({sc}/{n}). Geç bakalım.', quizTitle: '{name} quizi',
    lenLabel: 'Uzunluğu değiştir', fullSet: 'Hepsi', quick: '{n} hızlı', standard: '{n} standart',
    todaySet: 'Bugünün {name} seti', freshOrder: ' · {date} — her gün yeni bir sıra', yourStreak: 'Serin', dayOk: '{n}. gün ✓', dayKeep: '{n}. gün — devam et',
    youPlayed: 'Oynadın', earlier: 'bugün daha önce {n} sorudan {sc}, IQ {iq}',
    diff_easy: 'kolay', diff_medium: 'orta', diff_hard: 'zor',
    tiers: ['Günübirlik', 'Sıradan taraftar', 'Kombineli', 'İç saha ve deplasman', 'Kulüp tarihçisi', 'Kulüp efsanesi'],
  },
  id: {
    question: 'Pertanyaan', of: 'dari', next: 'Berikutnya →', seeResult: 'Lihat skormu →',
    srCorrect: 'Benar. ', srWrong: 'Salah. Jawabannya adalah ', ariaCorrect: 'Jawaban benar: ', ariaWrong: 'Jawabanmu, salah: ',
    why: 'Kenapa', streakWord: 'berturut-turut', yourIq: 'Ball IQ {name} kamu', right: '{sc} dari {n} benar · {pct}% · rentetan terbaik {best}',
    daysRow: '{d} hari berturut-turut', keepGoing: 'Lanjut — {more} lagi →', playAgain: 'Main lagi', share: 'Bagikan Ball IQ {name} kamu',
    allDone: 'Itu semua pertanyaan {name} yang kami punya di sini — besok dengan urutan baru.', appLine: 'Juga di aplikasi — rentetan, pengingat, dan 1v1 langsung →',
    footleTitle: 'Footle hari ini', footleLine: 'Tebak pesepakbolanya dalam enam percobaan. Nama baru tiap tengah malam, sama untuk semua.', play: 'Main →',
    namePrompt: 'Tambahkan namamu ke kartu skor? (opsional)', copied: 'Tersalin ✓', copyPrompt: 'Salin skormu',
    shareTxt: 'Ball IQ {name} saya {iq} — {tier} ({sc}/{n}). Kalahkan itu.', quizTitle: 'Kuis {name}',
    lenLabel: 'Ubah jumlah soal', fullSet: 'Semua', quick: '{n} cepat', standard: '{n} standar',
    todaySet: 'Set {name} hari ini', freshOrder: ' · {date} — urutan baru setiap hari', yourStreak: 'Rentetanmu', dayOk: 'hari ke-{n} ✓', dayKeep: 'hari ke-{n} — jangan putus',
    youPlayed: 'Kamu sudah main', earlier: 'tadi {sc} dari {n}, IQ {iq}',
    diff_easy: 'mudah', diff_medium: 'sedang', diff_hard: 'sulit',
    tiers: ['Sekali lewat', 'Fan santai', 'Pemegang tiket musiman', 'Kandang dan tandang', 'Sejarawan klub', 'Legenda klub'],
  },
};

/** Which languages Alex has signed off — the localised pages switch per language. */
export const BQ_I18N_REVIEWED = new Set([]);

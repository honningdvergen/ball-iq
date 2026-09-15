// Shell chrome, per locale — the header, the finder and the footer furniture.
//
// ⚠️ WHY THIS EXISTS. Until 2026-09-15 every one of the 49 localised pages
// rendered an ENGLISH shell: "Today / Football games / Clubs / Quizzes / Lists /
// Sign in", a search box saying "Find your club or league", English footer
// headings. shellHeader() and shellFooter() took no locale at all, and
// gen-seo-pages precomputed ONE header for every page. Same defect class as the
// localised taster chrome fixed in August: the content was translated and the
// furniture around it was not, and every check read the content.
//
// ⚠️ SCOPE, deliberately narrow. Product names (Footle, Daily 7, Transfer
// Trail), league names, store badge brands, and the TITLES of English-only
// destination pages in the footer stay as they are: a translated title that
// lands on an English page is a bait-and-switch. What is translated is chrome
// describing the site's own sections and controls.
//
// `en` is the source of truth and must match the literals shell.mjs shipped
// with, character for character — English pages are required to stay
// byte-identical when this table is introduced.

export const SHELL_STRINGS = {
  en: {
    skipToContent: 'Skip to content',
    homeLabel: 'Ball IQ home',
    sectionsLabel: 'Sections',
    navToday: 'Today',
    navGames: 'Football games',
    navClubs: 'Clubs',
    navQuizzes: 'Quizzes',
    navLists: 'Lists',
    signIn: 'Sign in',
    findPlaceholder: 'Find your club or league',
    findResultsLabel: 'Clubs and leagues',
    menuLabel: 'Menu',
    colGames: 'Games',
    colDiscover: 'Discover',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    disclaimer: "An independent football quiz, made by one person. Not affiliated with, endorsed by, or associated with FIFA, UEFA, the Premier League, La Liga, Serie A, the Bundesliga, or any club; names are used to identify the quizzes' subjects.",
    findLeagueSub: 'League quiz',
    findPlay: 'Play',
    findEmptyPre: 'Nothing on file called',
    findEmptyPost: 'yet.',
    findSeeAll: 'See every club',
  },

  // ── translated 2026-09-15 · one agent per locale, then an adversarial checker
  // per locale whose corrections were applied. Findings worth keeping in mind
  // before anyone "improves" these:
  //   it  navLists is "Liste", NOT "Classifiche" — on a football site that reads
  //       first as league TABLES.
  //   id  navLists is "Rekor", NOT "Daftar" — beside "Masuk" (Sign in), Indonesian
  //       sites use "Daftar" for SIGN UP.
  //   es  navQuizzes stays "Quizzes": "Trivias" is Rioplatense and "Tests" is
  //       peninsular, and the /es/ layer serves both. Every es string avoids a
  //       second-person form for the same reason (Busca vs Buscá).
  //   de  navGames is "Spiele": "Fußballspiele" reads as football MATCHES.
  //   pt  Brazilian where the two diverge (Contato, Seções) — 4 of 7 /pt/ clubs
  //       are Brazilian. Portugal would write Contacto and Secções.
  //   *   Three disclaimers had quietly added "only" ("solo", "apenas"), making the
  //       legal notice claim MORE than the English. All removed.
  es: {
    skipToContent: "Ir al contenido",
    homeLabel: "Inicio de Ball IQ",
    sectionsLabel: "Secciones",
    navToday: "Hoy",
    navGames: "Juegos de fútbol",
    navClubs: "Clubes",
    navQuizzes: "Quizzes",
    navLists: "Listas",
    signIn: "Entrar",
    findPlaceholder: "Buscar club o liga",
    findResultsLabel: "Clubes y ligas",
    menuLabel: "Menú",
    colGames: "Juegos",
    colDiscover: "Descubrir",
    about: "Acerca de",
    contact: "Contacto",
    privacy: "Privacidad",
    terms: "Términos",
    disclaimer: "Un quiz de fútbol independiente, hecho por una sola persona. No tiene afiliación ni relación con la FIFA, la UEFA, la Premier League, La Liga, la Serie A, la Bundesliga ni ningún club, ni cuenta con su respaldo; los nombres se usan para identificar los temas de los quizzes.",
    findLeagueSub: "Quiz de la liga",
    findPlay: "Jugar",
    findEmptyPre: "Aún no tenemos nada llamado",
    findEmptyPost: ".",
    findSeeAll: "Ver todos los clubes",
  },
  pt: {
    skipToContent: "Ir para o conteúdo",
    homeLabel: "Página inicial do Ball IQ",
    sectionsLabel: "Seções",
    navToday: "Hoje",
    navGames: "Jogos de futebol",
    navClubs: "Clubes",
    navQuizzes: "Quizzes",
    navLists: "Listas",
    signIn: "Entrar",
    findPlaceholder: "Encontre o seu clube ou liga",
    findResultsLabel: "Clubes e ligas",
    menuLabel: "Menu",
    colGames: "Jogos",
    colDiscover: "Descubra",
    about: "Sobre",
    contact: "Contato",
    privacy: "Privacidade",
    terms: "Termos",
    disclaimer: "Um quiz de futebol independente, feito por uma só pessoa. Não é afiliado, endossado nem associado à FIFA, à UEFA, à Premier League, à La Liga, à Serie A, à Bundesliga ou a qualquer clube; os nomes são usados para identificar os temas dos quizzes.",
    findLeagueSub: "Quiz da liga",
    findPlay: "Jogar",
    findEmptyPre: "Ainda não temos nada chamado",
    findEmptyPost: ".",
    findSeeAll: "Veja todos os clubes",
  },
  it: {
    skipToContent: "Vai al contenuto",
    homeLabel: "Home di Ball IQ",
    sectionsLabel: "Sezioni",
    navToday: "Oggi",
    navGames: "Giochi di calcio",
    navClubs: "Squadre",
    navQuizzes: "Quiz",
    navLists: "Liste",
    signIn: "Accedi",
    findPlaceholder: "Cerca squadra o campionato",
    findResultsLabel: "Squadre e campionati",
    menuLabel: "Menu",
    colGames: "Giochi",
    colDiscover: "Scopri",
    about: "Informazioni",
    contact: "Contatti",
    privacy: "Privacy",
    terms: "Termini",
    disclaimer: "Un quiz di calcio indipendente, realizzato da una sola persona. Nessuna affiliazione, approvazione o associazione con FIFA, UEFA, Premier League, La Liga, Serie A, Bundesliga o qualsiasi club; i nomi servono a identificare gli argomenti dei quiz.",
    findLeagueSub: "Quiz sul campionato",
    findPlay: "Gioca",
    findEmptyPre: "Non abbiamo ancora nulla su",
    findEmptyPost: ".",
    findSeeAll: "Vedi tutte le squadre",
  },
  de: {
    skipToContent: "Zum Inhalt springen",
    homeLabel: "Startseite von Ball IQ",
    sectionsLabel: "Bereiche",
    navToday: "Heute",
    navGames: "Spiele",
    navClubs: "Vereine",
    navQuizzes: "Quizze",
    navLists: "Listen",
    signIn: "Anmelden",
    findPlaceholder: "Verein oder Liga suchen",
    findResultsLabel: "Vereine und Ligen",
    menuLabel: "Menü",
    colGames: "Spiele",
    colDiscover: "Entdecken",
    about: "Über Ball IQ",
    contact: "Kontakt",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    disclaimer: "Ein unabhängiges Fußball-Quiz, von einer einzigen Person gemacht. Es besteht keine Verbindung zu FIFA, UEFA, der Premier League, La Liga, der Serie A, der Bundesliga oder einem Verein, und keine dieser Organisationen unterstützt dieses Angebot; Namen werden nur verwendet, um die Themen der Quizze zu benennen.",
    findLeagueSub: "Liga-Quiz",
    findPlay: "Spielen",
    findEmptyPre: "Zu",
    findEmptyPost: "gibt es noch nichts.",
    findSeeAll: "Alle Vereine ansehen",
  },
  fr: {
    skipToContent: "Aller au contenu",
    homeLabel: "Accueil de Ball IQ",
    sectionsLabel: "Rubriques",
    navToday: "Aujourd’hui",
    navGames: "Jeux de foot",
    navClubs: "Clubs",
    navQuizzes: "Quiz",
    navLists: "Listes",
    signIn: "Connexion",
    findPlaceholder: "Trouve ton club ou ton championnat",
    findResultsLabel: "Clubs et championnats",
    menuLabel: "Menu",
    colGames: "Jeux",
    colDiscover: "Découvrir",
    about: "À propos",
    contact: "Contact",
    privacy: "Confidentialité",
    terms: "Conditions d’utilisation",
    disclaimer: "Un quiz de foot indépendant, créé par une seule personne. Sans lien avec la FIFA, l’UEFA, la Premier League, la Liga, la Serie A, la Bundesliga ni aucun club, et sans leur approbation ni leur soutien ; les noms servent uniquement à identifier les sujets des quiz.",
    findLeagueSub: "Quiz du championnat",
    findPlay: "Jouer",
    findEmptyPre: "Rien ne correspond à",
    findEmptyPost: "pour l’instant.",
    findSeeAll: "Voir tous les clubs",
  },
  nl: {
    skipToContent: "Ga naar de inhoud",
    homeLabel: "Ball IQ-homepage",
    sectionsLabel: "Rubrieken",
    navToday: "Vandaag",
    navGames: "Voetbalspellen",
    navClubs: "Clubs",
    navQuizzes: "Quizzen",
    navLists: "Lijsten",
    signIn: "Inloggen",
    findPlaceholder: "Zoek je club of competitie",
    findResultsLabel: "Clubs en competities",
    menuLabel: "Menu",
    colGames: "Spellen",
    colDiscover: "Ontdek",
    about: "Over Ball IQ",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Voorwaarden",
    disclaimer: "Een onafhankelijke voetbalquiz, gemaakt door één persoon. Niet verbonden aan, goedgekeurd door of geassocieerd met FIFA, UEFA, de Premier League, La Liga, de Serie A, de Bundesliga of welke club dan ook; namen worden gebruikt om aan te geven waar de quizzen over gaan.",
    findLeagueSub: "Competitiequiz",
    findPlay: "Spelen",
    findEmptyPre: "Nog niets met de naam",
    findEmptyPost: "gevonden.",
    findSeeAll: "Bekijk alle clubs",
  },
  tr: {
    skipToContent: "İçeriğe geç",
    homeLabel: "Ball IQ ana sayfası",
    sectionsLabel: "Bölümler",
    navToday: "Bugün",
    navGames: "Futbol oyunları",
    navClubs: "Kulüpler",
    navQuizzes: "Quizler",
    navLists: "Listeler",
    signIn: "Giriş yap",
    findPlaceholder: "Kulübünü veya ligini bul",
    findResultsLabel: "Kulüpler ve ligler",
    menuLabel: "Menü",
    colGames: "Oyunlar",
    colDiscover: "Keşfet",
    about: "Hakkında",
    contact: "İletişim",
    privacy: "Gizlilik",
    terms: "Kullanım koşulları",
    disclaimer: "Tek bir kişinin hazırladığı bağımsız bir futbol quizi. FIFA, UEFA, Premier League, La Liga, Serie A, Bundesliga ya da herhangi bir kulüple bağlantısı yoktur; bu kuruluşlar tarafından onaylanmamış ve desteklenmemiştir. İsimler yalnızca quizlerin konusunu belirtmek için kullanılmaktadır.",
    findLeagueSub: "Lig quizi",
    findPlay: "Oyna",
    findEmptyPre: "Henüz kayıtlarımızda",
    findEmptyPost: "adında bir şey yok.",
    findSeeAll: "Tüm kulüpleri gör",
  },
  id: {
    skipToContent: "Langsung ke konten",
    homeLabel: "Beranda Ball IQ",
    sectionsLabel: "Bagian situs",
    navToday: "Hari ini",
    navGames: "Game bola",
    navClubs: "Klub",
    navQuizzes: "Kuis",
    navLists: "Rekor",
    signIn: "Masuk",
    findPlaceholder: "Cari klub atau ligamu",
    findResultsLabel: "Klub dan liga",
    menuLabel: "Menu",
    colGames: "Game",
    colDiscover: "Jelajahi",
    about: "Tentang",
    contact: "Kontak",
    privacy: "Privasi",
    terms: "Ketentuan",
    disclaimer: "Kuis sepak bola independen yang dibuat oleh satu orang. Tidak memiliki afiliasi, dukungan, atau hubungan dengan FIFA, UEFA, Premier League, La Liga, Serie A, Bundesliga, atau klub mana pun; nama-nama tersebut digunakan untuk menyebut topik kuis.",
    findLeagueSub: "Kuis liga",
    findPlay: "Main",
    findEmptyPre: "Belum ada klub atau liga bernama",
    findEmptyPost: ".",
    findSeeAll: "Lihat semua klub",
  },
};

export const SHELL_KEYS = Object.keys(SHELL_STRINGS.en);

/**
 * Strings for a locale. A missing locale falls back to English WHOLE — never
 * key by key, because a half-translated shell reads worse than an English one.
 * tests/unit/shell-i18n.test.js asserts every locale that has pages carries
 * every key, so the fallback only ever serves English itself.
 */
export function shellStrings(lang = 'en') {
  const t = SHELL_STRINGS[lang];
  return t && SHELL_KEYS.every((k) => typeof t[k] === 'string' && t[k]) ? t : SHELL_STRINGS.en;
}

// French club pages — WAVE L1, third language.
//
// ⚠️ THE NAMING TRAP FIRED AGAIN WHILE BUILDING THIS FILE. The bank keys these
// clubs as "Olympique Lyonnais" and "AS Monaco", not "Lyon" and "Monaco" — so a
// first inventory query on the short names returned ZERO for both and I nearly
// recorded them as having no questions. They have 39 and 37. This is
// feedback_leagues_short_names_trap for the sixth time: ALWAYS resolve club
// names through the alias layer or read the actual keys, never assume the short
// form. The page SLUGS are the short forms (lyon, monaco) while the bank keys
// are the long ones, which is exactly what makes it easy to miss.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as clubs-it.mjs / clubs-de.mjs / clubs-es.mjs / clubs-pt.mjs /
// clubs-tr.mjs. Every entry carries the id of its English original; the build
// enforces that the id resolves and the answer key still agrees.
//
// ⚠️ OPTION ORDER IS PRESERVED EXACTLY — the build checks the INDEX, not the text.
// ⚠️ FRENCH EXONYMS ARE THE `en` TRAP HERE, and they are sneakier than German's
// because several are near-identical to the English: Barcelone/Barcelona,
// Naples/Napoli, Vienne/Vienna, Étoile Rouge de Belgrade/Red Star Belgrade,
// Munich/Munich (same). Any translated answer declares the bank string via `en`.
//
// French register: what the terraces and L'Équipe actually use — Ligue 1, Coupe
// de France, Le Classique, Les Gones, Les Phocéens, "entraîneur" not "manager",
// "gardien", "attaquant", "milieu". Accents are load-bearing (Étoile, Désiré
// Doué, Grégory Coupet, Éric Abidal) — getting them wrong is the tell of a
// machine translation.

export const CLUBS_FR = [
  // ── PARIS SAINT-GERMAIN ────────────────────────────────────────────────────
  {
    club: 'Paris Saint-Germain',
    slug: 'psg',
    lang: 'fr',
    name: 'Paris Saint-Germain',
    h1: 'Quiz PSG',
    title: 'Quiz PSG — Paris Saint-Germain | Ball IQ',
    description:
      'Quiz PSG gratuit, avec réponses expliquées : la fusion de 1970, Weah, Ronaldinho, la Remontada, Neymar et Mbappé, et enfin la Ligue des champions.',
    kind: 'Quiz de club',
    playLabel: 'Commencer le quiz',
    statLine: 'Gratuit · Questions sur le PSG avec réponses expliquées · sans inscription',
    intro: [
      'Un club né d’une fusion en 1970, devenu la puissance que l’Europe attendait. Ce quiz gratuit traverse toutes les époques parisiennes : le maillot dessiné par Daniel Hechter, George Weah et son Ballon d’Or, Ronaldinho et Okocha, le rachat qatari de 2011, la Remontada, Zlatan, Neymar et Mbappé — et enfin la première Ligue des champions.',
      'Les questions deviennent vraiment difficiles. Là où l’histoire du club est contestée, nous préférons ne pas publier la question plutôt que de prendre parti. Ne sort que ce qui se vérifie.',
      'Chaque réponse du set PSG est accompagnée d’une explication écrite : même en se trompant, on apprend quelque chose.',
    ],
    faq: [
      { q: 'Le quiz PSG est-il gratuit ?', a: 'Oui. Il se joue directement dans le navigateur, sans inscription et sans rien télécharger. Toutes les questions de cette page sont gratuites.' },
      { q: 'Quels sujets couvre le quiz ?', a: 'La fusion fondatrice de 1970, le maillot Hechter, Weah, Okocha et Ronaldinho, la Coupe des coupes 1996, le rachat par QSI, Ibrahimović, Cavani et Verratti, la Remontada, Neymar, Messi et Mbappé, puis les titres européens. On commence facile et on finit très difficile.' },
      { q: 'D’où viennent les questions ?', a: 'Elles sont écrites et vérifiées à la main, jamais générées automatiquement. Chaque information passe deux contrôles indépendants avant publication ; ce qui ne se vérifie pas ne sort pas.' },
      { q: 'L’application Ball IQ est-elle en français ?', a: 'Pas encore : cette page est en français, mais l’application est en anglais. Nous mesurons l’intérêt avant de traduire — être arrivé jusqu’ici nous aide déjà à trancher.' },
    ],
    taster: [
      { id: 'q_5258eb', q: 'Dans quel stade emblématique le Paris Saint-Germain joue-t-il ses matchs à domicile ?', o: ['Le Parc des Princes', 'Le Stade de France', 'Le Stade Vélodrome', 'Le Groupama Stadium'], a: 0, en: 'Parc des Princes', hint: 'Le PSG occupe le Parc des Princes, dans l’ouest de Paris, depuis 1974 ; le Vélodrome appartient au rival marseillais.' },
      { id: 'q_0436e8', q: 'Le PSG est né en 1970 de la fusion du Paris FC avec quel autre club ?', o: ['Le Stade Saint-Germain', 'Le Red Star', 'Le Racing Club de France', 'Le CA Paris'], a: 0, en: 'Stade Saint-Germain', hint: 'La moitié «Saint-Germain» du nom vient de Saint-Germain-en-Laye, la commune à l’ouest de Paris où évoluait le Stade Saint-Germain.' },
      { id: 'q_b6b73f', q: 'Quel créateur de mode est devenu président du PSG dans les années 1970 et passe pour l’auteur du maillot mythique du club ?', o: ['Daniel Hechter', 'Pierre Cardin', 'Yves Saint Laurent', 'Jean-Paul Gaultier'], a: 0, hint: 'Hechter a dessiné la bande rouge centrale bordée de blanc sur fond bleu — le maillot «Hechter» qui définit encore l’identité du club.' },
      { id: 'q_63c503', q: 'La transformation du PSG en superclub mondial commence en 2011, avec son rachat par des investisseurs de quel pays ?', o: ['Le Qatar', 'Les Émirats arabes unis', 'L’Arabie saoudite', 'Les États-Unis'], a: 0, en: 'Qatar', hint: 'Qatar Sports Investments a finalisé le rachat du PSG en 2011, finançant les dépenses qui ont fait de Paris une puissance.' },
      { id: 'q_d6a4c5', q: 'Un futur chef d’État africain a brillé au PSG au milieu des années 1990 et remporté le Ballon d’Or 1995. Qui était-ce ?', o: ['George Weah', 'Jay-Jay Okocha', 'Roger Milla', 'Abedi Pelé'], a: 0, hint: 'Weah est devenu président du Liberia en 2018 — et son Ballon d’Or 1995 reste le seul jamais remporté par un Africain.' },
      { id: 'q_d50e0d', q: 'Qui est devenu le joueur le plus cher du monde en signant au PSG en 2017 pour 222 millions d’euros ?', o: ['Neymar', 'Kylian Mbappé', 'Edinson Cavani', 'Ángel Di María'], a: 0, hint: 'La levée de la clause libératoire du Brésilien au Barça a presque doublé le précédent record mondial, toujours inégalé.' },
      { id: 'q_300ebd', q: 'Le PSG a recruté Kylian Mbappé en 2017 dans quel club français, où il venait d’être champion de France à dix-huit ans ?', o: ['Monaco', 'Lyon', 'Lille', 'Rennes'], a: 0, hint: 'Mbappé est arrivé de Monaco sous forme de prêt assorti d’une obligation d’achat d’environ 180 millions d’euros.' },
      { id: 'q_ef85dc', en: '6-1 to Barcelona', q: 'Lors de l’un des effondrements les plus célèbres du football, le PSG a gagné 4-0 le huitième de finale aller de la Ligue des champions 2017, avant de perdre le retour comment ?', o: ['6-1 contre Barcelone', '4-0 contre le Real Madrid', '5-2 contre le Bayern Munich', '3-0 contre Manchester United'], a: 0, hint: '«La Remontada» — Barcelone a marqué trois fois dans les sept dernières minutes au Camp Nou pour l’emporter 6-1 et passer 6-5 au cumul.' },
      { id: 'q_2f122b', q: 'Le PSG a enfin remporté sa première Ligue des champions en 2025, sur un score record en finale. Comment s’est terminée cette finale ?', o: ['PSG 5-0 Inter Milan', 'PSG 3-1 Inter Milan', 'PSG 2-0 Inter Milan', 'PSG 4-0 Inter Milan'], a: 0, hint: 'C’est le plus large écart jamais vu dans une grande finale européenne masculine de club ; l’Inter ne s’est jamais relevé de l’ouverture précoce de Hakimi.' },
      { id: 'q_542851', q: 'Quel entraîneur a mené le PSG à sa première Ligue des champions en 2025, puis à une deuxième l’année suivante ?', o: ['Luis Enrique', 'Mauricio Pochettino', 'Thomas Tuchel', 'Christophe Galtier'], a: 0, hint: 'L’Espagnol, artisan de la Remontada du Barça contre le PSG en 2017, a bouclé sa rédemption en gagnant avec le club qu’il avait fait chuter.' },
    ],
    sample: [
      { id: 'q_a34533', q: 'Qui a marqué le but qui a offert au PSG la finale de la Coupe des coupes 1996 face au Rapid Vienne ?', o: ['Bruno Ngotty', 'Patrice Loko', 'Youri Djorkaeff', 'Leonardo'], a: 0, hint: 'La frappe du défenseur Ngotty en première période a réglé la finale de Bruxelles 1-0 — l’unique grand trophée européen du PSG jusqu’en 2025.' },
      { id: 'q_985ecd', q: 'Le meneur nigérian Jay-Jay Okocha est devenu une idole du Parc à la fin des années 1990. De quel club le PSG l’a-t-il recruté ?', o: ['Fenerbahçe', 'Bolton Wanderers', 'Eintracht Francfort', 'Ajax Amsterdam'], a: 0, hint: 'Le PSG a payé une somme alors record pour faire venir le dribbleur de Turquie en 1998 ; il est ensuite devenu une légende à Bolton.' },
      { id: 'q_3290e0', en: 'Barcelona', q: 'Le Brésilien Ronaldinho a commencé sa carrière européenne au PSG. Pour quel club l’a-t-il quitté en 2003, avant d’y devenir une icône mondiale ?', o: ['Barcelone', 'AC Milan', 'Real Madrid', 'Manchester United'], a: 0, hint: 'Le PSG n’a jamais vraiment canalisé sa vie hors du terrain ; Barcelone y est parvenu, et il y a remporté le Ballon d’Or en 2005.' },
      { id: 'q_5fa2e4', q: 'Quel attaquant suédois est arrivé au PSG en 2012, a déclaré «je suis venu en roi, je pars en légende» et a réécrit le record de buts du club ?', o: ['Zlatan Ibrahimović', 'Henrik Larsson', 'Ola Toivonen', 'Marcus Berg'], a: 0, hint: 'Il a marqué 156 buts en quatre saisons, battant le record de Pauleta, et ses formules sont entrées dans le folklore parisien.' },
      { id: 'q_11bf00', en: 'Napoli', q: 'Edinson Cavani a rejoint le PSG en 2013 en provenance de quel club italien, où on le surnommait «El Matador» ?', o: ['Naples', 'la Roma', 'la Juventus', 'l’Inter'], a: 0, hint: 'Le PSG a payé une somme alors record en France (environ 64 M€) pour arracher l’Uruguayen à Naples ; il est devenu le meilleur buteur de l’histoire du club.' },
      { id: 'q_d034eb', q: 'Marco Verratti a été le métronome du milieu parisien pendant plus de dix ans. De quel club italien le PSG a-t-il recruté «le petit hibou» en 2012 ?', o: ['Pescara (Serie B)', 'la Roma', 'la Lazio', 'l’Atalanta'], a: 0, hint: 'Le PSG est allé chercher l’adolescent Verratti à Pescara, en deuxième division, avant même qu’il ait joué en Serie A.' },
      { id: 'q_9f9f58', en: 'Six', q: 'Combien de titres de Ligue 1 Kylian Mbappé a-t-il remportés lors de ses sept saisons au PSG (2017-2024) ?', o: ['Six', 'Quatre', 'Sept', 'Trois'], a: 0, hint: 'Mbappé a gagné six des sept titres possibles ; le seul qui lui a échappé est celui de 2020-21, quand Lille a coiffé le PSG.' },
      { id: 'q_a1abe7', en: 'Real Madrid on a free transfer', q: 'Kylian Mbappé a quitté le PSG en 2024 comme meilleur buteur de l’histoire du club. Pour quel club, et à quelles conditions ?', o: ['Le Real Madrid, libre de tout contrat', 'Le Real Madrid, pour 180 M€', 'Liverpool, libre de tout contrat', 'Manchester City, pour 150 M€'], a: 0, hint: 'Après avoir refusé de prolonger, Mbappé est parti libre à l’été 2024 — avec 256 buts, un record parisien.' },
      { id: 'q_ad30d3', q: 'Un joueur de dix-neuf ans a survolé la finale de la Ligue des champions 2025, avec un doublé et une passe décisive. Qui est cette révélation ?', o: ['Désiré Doué', 'Bradley Barcola', 'Warren Zaïre-Emery', 'Senny Mayulu'], a: 0, hint: 'Doué est devenu le plus jeune joueur à marquer deux fois dans une finale de Ligue des champions, et a été élu meilleur jeune de la compétition.' },
      { id: 'q_f3cdc5', en: 'Arsenal, on penalties', q: 'Le PSG a conservé son titre en Ligue des champions en 2026. Qui a-t-il battu en finale, et comment ?', o: ['Arsenal, aux tirs au but', 'Le Bayern Munich, 2-1', 'Manchester City, 3-2', 'Le Real Madrid, aux tirs au but'], a: 0, hint: 'Après l’ouverture du score de Havertz avant la cinquième minute, le penalty de Dembélé a envoyé la finale aux tirs au but.' },
      { id: 'q_3add2c', en: 'Club World Cup', q: 'Quelques semaines après son sacre européen de 2025, le PSG a perdu 3-0 une grande finale. Quel trophée lui a échappé ?', o: ['La Coupe du monde des clubs', 'La Supercoupe de l’UEFA', 'Le Trophée des champions', 'La Coupe de France'], a: 0, hint: 'Chelsea l’a surpris 3-0 en finale, dans le New Jersey, lors de la Coupe du monde des clubs élargie de 2025.' },
      { id: 'q_9ce66b', q: 'Le PSG est devenu en 2024 le club le plus titré de l’histoire du championnat de France, dépassant le record de dix titres de quel club ?', o: ['Saint-Étienne', 'Marseille', 'Nantes', 'Monaco'], a: 0, hint: 'Les dix titres de Saint-Étienne ont constitué le record français jusqu’à ce que le PSG les dépasse en 2024.' },
    ],
    copy: {
      tasterEyebrow: 'Essai gratuit · Sans inscription',
      tasterH: 'Tu connais vraiment le PSG ?',
      tasterPh: 'Dix questions rapides pour mesurer ton Ball IQ parisien.',
      tasterNote: 'Questions d’exemple — le quiz complet en contient bien plus.',
      playSection: 'Jouer au quiz PSG',
      playSub: 'Touche une réponse pour vérifier — résultat immédiat et l’histoire derrière.',
      faqH: 'Quiz PSG — Questions fréquentes',
      aboutQ: 'À propos du quiz PSG',
      bandH: 'Tu penses connaître Paris ? Prouve-le dans l’application.',
      bandP: 'Séries de victoires, 1 contre 1 en direct et une note sur 99 — tous les quiz dans une seule application. L’application est en anglais.',
      alsoH: 'La même page en anglais',
      alsoP: 'Ceci est la version française de notre quiz PSG. Toutes les questions en version originale :',
      alsoLink: 'PSG quiz (English)',
      statsLine: 'Les questions sur le PSG dans Ball IQ couvrent trois niveaux de difficulté — facile, moyen et difficile — toutes avec une explication.',
    },
  },

  // ── OLYMPIQUE DE MARSEILLE ─────────────────────────────────────────────────
  {
    club: 'Marseille',
    slug: 'marseille',
    lang: 'fr',
    name: 'Olympique de Marseille',
    h1: 'Quiz OM',
    title: 'Quiz OM — Olympique de Marseille | Ball IQ',
    description:
      'Quiz OM gratuit, avec réponses expliquées : 1993 et Basile Boli, Tapie, Papin, Waddle, Deschamps, Drogba et Le Classique.',
    kind: 'Quiz de club',
    playLabel: 'Commencer le quiz',
    statLine: 'Gratuit · Questions sur l’OM avec réponses expliquées · sans inscription',
    intro: [
      'Le seul club français à avoir gagné la Coupe d’Europe des clubs champions, et sans doute le plus passionné du pays. Ce quiz gratuit couvre toute l’histoire olympienne : la fondation de 1899 et le nom venu des Phocéens, Skoblar et ses 44 buts, l’ère Tapie, la finale perdue de 1991, la tête de Basile Boli à Munich en 1993, Papin, Waddle, Deschamps et Drogba.',
      'Les questions deviennent vraiment difficiles. Là où l’histoire du club est contestée, nous préférons ne pas publier la question plutôt que de prendre parti. Ne sort que ce qui se vérifie.',
      'Chaque réponse du set OM est accompagnée d’une explication écrite : même en se trompant, on apprend quelque chose.',
    ],
    faq: [
      { q: 'Le quiz OM est-il gratuit ?', a: 'Oui. Il se joue directement dans le navigateur, sans inscription et sans rien télécharger. Toutes les questions de cette page sont gratuites.' },
      { q: 'Quels sujets couvre le quiz ?', a: 'La fondation de 1899, le Vélodrome et les Phocéens, Gunnar Andersson et Josip Skoblar, l’ère Bernard Tapie, la finale de 1991, le sacre européen de 1993, Papin et son Ballon d’Or, Waddle, Cantona, Deschamps entraîneur, Drogba, Ribéry et Mandanda, et Le Classique. On commence facile et on finit très difficile.' },
      { q: 'D’où viennent les questions ?', a: 'Elles sont écrites et vérifiées à la main, jamais générées automatiquement. Chaque information passe deux contrôles indépendants avant publication ; ce qui ne se vérifie pas ne sort pas.' },
      { q: 'L’application Ball IQ est-elle en français ?', a: 'Pas encore : cette page est en français, mais l’application est en anglais. Nous mesurons l’intérêt avant de traduire — être arrivé jusqu’ici nous aide déjà à trancher.' },
    ],
    taster: [
      { id: 'q_74322a', q: 'Dans quelle ville française l’Olympique de Marseille est-il basé ?', o: ['Lyon', 'Marseille', 'Lille', 'Nantes'], a: 1, hint: 'Le club est basé à Marseille, deuxième ville de France et principal port méditerranéen du pays.' },
      { id: 'q_414dc9', q: 'En quelle année l’Olympique de Marseille a-t-il été fondé ?', o: ['1919', '1899', '1932', '1902'], a: 1, hint: 'L’OM a été fondé le 31 août 1899 par René Dufaure de Montmirail, son nom renvoyant aux Jeux olympiques antiques.' },
      { id: 'q_339a0a', q: 'Dans quel stade l’OM joue-t-il ses matchs à domicile ?', o: ['Le Parc des Princes', 'Le Stade de France', 'Le Stade Vélodrome', 'Le Stade Geoffroy-Guichard'], a: 2, en: 'Stade Vélodrome', hint: 'L’OM s’est installé au Stade Vélodrome en 1937 ; il accueille aujourd’hui environ 67 000 spectateurs.' },
      { id: 'q_3f3b82', en: 'White', q: 'De quelle couleur est le maillot domicile traditionnel de l’OM ?', o: ['Rouge', 'Blanc', 'Noir', 'Vert'], a: 1, hint: 'L’OM joue essentiellement en blanc rehaussé de bleu ciel, les couleurs reprises du drapeau de la ville.' },
      { id: 'q_dc2c68', en: 'The ancient Greeks who founded the city', q: 'Le surnom «Les Phocéens» fait référence à quoi ?', o: ['À un fleuve local', 'Au premier président du club', 'Aux Grecs de l’Antiquité qui ont fondé la ville', 'À un chantier naval célèbre'], a: 2, hint: 'La ville a été fondée vers 600 av. J.-C. par des colons grecs venus de Phocée, d’où le surnom de Phocéens.' },
      { id: 'q_f6e64f', q: 'La rivalité la plus féroce de l’OM, «Le Classique», l’oppose à quel club ?', o: ['Lyon', 'Monaco', 'le PSG', 'Saint-Étienne'], a: 2, en: 'PSG', hint: 'Marseille contre Paris Saint-Germain est présenté comme la province contre la capitale, le sud contre le nord.' },
      { id: 'q_c4537d', q: 'En quelle année l’OM est-il devenu le premier club français à remporter la Coupe d’Europe des clubs champions ?', o: ['1991', '1993', '1985', '1999'], a: 1, hint: 'Marseille a battu l’AC Milan 1-0 en finale en 1993 ; le PSG est devenu le deuxième vainqueur français en 2025.' },
      { id: 'q_40fe6e', q: 'Quel club l’OM a-t-il battu en finale de la Ligue des champions 1993 ?', o: ['AC Milan', 'Real Madrid', 'Ajax Amsterdam', 'Barcelone'], a: 0, hint: 'Une tête de Basile Boli a offert à Marseille une victoire 1-0 sur l’AC Milan à Munich.' },
      { id: 'q_f2a94d', q: 'Qui a inscrit l’unique but de la finale victorieuse de 1993 ?', o: ['Jean-Pierre Papin', 'Rudi Völler', 'Basile Boli', 'Abedi Pelé'], a: 2, hint: 'Le défenseur Basile Boli a marqué de la tête juste avant la mi-temps face à l’AC Milan, à Munich.' },
      { id: 'q_9a8b66', q: 'Qui entraînait l’OM lors du sacre en Ligue des champions 1993 ?', o: ['Raymond Goethals', 'Arsène Wenger', 'Franz Beckenbauer', 'Gérard Houllier'], a: 0, hint: 'Le technicien belge Raymond Goethals, surnommé «Raymond-la-Science», a fait tomber l’AC Milan à Munich.' },
    ],
    sample: [
      { id: 'q_800006', q: 'Quel homme d’affaires flamboyant présidait l’OM lors de sa période dominante du début des années 1990 ?', o: ['Bernard Tapie', 'Frank McCourt', 'Jean-Michel Aulas', 'Nasser Al-Khelaïfi'], a: 0, hint: 'Bernard Tapie a financé l’âge d’or de l’OM avant que le scandale des matchs truqués de 1993 n’y mette fin.' },
      { id: 'q_e792cc', en: 'Red Star Belgrade', q: 'L’OM a perdu la finale de la Coupe d’Europe 1991 contre quel club ?', o: ['Le Steaua Bucarest', 'Benfica', 'le PSV Eindhoven', 'l’Étoile Rouge de Belgrade'], a: 3, hint: 'L’Étoile Rouge de Belgrade a battu Marseille aux tirs au but après un 0-0 à Bari.' },
      { id: 'q_952502', en: 'A penalty shoot-out after 0-0', q: 'Comment s’est décidée la finale 1991 entre l’OM et l’Étoile Rouge de Belgrade ?', o: ['Aux tirs au but après un 0-0', 'Sur un but à la dernière minute', 'Sur un 3-1', 'Sur un but en or'], a: 0, hint: 'Après 120 minutes sans but à Bari, l’Étoile Rouge a gagné la séance 5-3 ; Manuel Amoros a manqué son tir pour Marseille.' },
      { id: 'q_d67491', q: 'Quel attaquant de l’OM a remporté le Ballon d’Or 1991 ?', o: ['Rudi Völler', 'Jean-Pierre Papin', 'Chris Waddle', 'Abedi Pelé'], a: 1, hint: 'Jean-Pierre Papin est devenu en 1991 le premier joueur évoluant en France à remporter le Ballon d’Or.' },
      { id: 'q_df3e7a', q: 'Josip Skoblar a établi le record de buts sur une saison de Ligue 1 avec l’OM en 1970-71. Combien ?', o: ['44', '30', '38', '52'], a: 0, hint: 'Les 44 buts de Skoblar en 1970-71 lui ont valu le Soulier d’or européen et restent un record en Ligue 1.' },
      { id: 'q_a48421', q: 'Qui est le meilleur buteur de l’histoire de l’OM, avec 194 buts ?', o: ['Jean-Pierre Papin', 'Josip Skoblar', 'Didier Drogba', 'Gunnar Andersson'], a: 3, hint: 'L’attaquant suédois Gunnar Andersson a marqué 194 buts dans les années 1950, devant Papin et Skoblar.' },
      { id: 'q_d27bf0', q: 'Quel gardien détient le record de matchs disputés sous le maillot de l’OM ?', o: ['Fabien Barthez', 'Steve Mandanda', 'Gaëtan Huard', 'Jérôme Alonzo'], a: 1, hint: 'Steve Mandanda a dépassé les 600 matchs en deux passages, effaçant le vieux record de Roger Scotti.' },
      { id: 'q_2ef736', q: 'Qui était capitaine de l’OM lors du sacre européen de 1993, avant d’entraîner le club vers le titre de champion en 2010 ?', o: ['Didier Deschamps', 'Marcel Desailly', 'Basile Boli', 'Jean-Pierre Papin'], a: 0, hint: 'Didier Deschamps a soulevé le trophée en 1993 comme capitaine, puis est revenu comme entraîneur pour gagner la Ligue 1 en 2010.' },
      { id: 'q_1b34e5', q: 'Le titre de champion 2010 a mis fin à une disette de combien d’années ?', o: ['5', '10', '18', '25'], a: 2, hint: 'Le titre de 2010 sous Didier Deschamps était le premier de l’OM depuis 1992 — dix-huit ans.' },
      { id: 'q_25f5f2', q: 'Quel ailier anglais l’OM a-t-il recruté à Tottenham en 1989 ?', o: ['Chris Waddle', 'Glenn Hoddle', 'Gary Lineker', 'Paul Gascoigne'], a: 0, hint: 'Chris Waddle a rejoint Marseille depuis Tottenham en 1989 pour environ 4,5 M£ et est devenu une idole du Vélodrome.' },
      { id: 'q_4c483c', q: 'Quel club Éric Cantona a-t-il rejoint en 1988 pour un transfert alors record en France ?', o: ['Marseille', 'Nîmes', 'Leeds United', 'Nice'], a: 0, hint: 'Cantona a signé à Marseille en 1988, avant une série de prêts et de brouilles qui ont précédé son départ de France.' },
      { id: 'q_b6cd92', q: 'Chelsea a recruté Didier Drogba en 2004 en provenance de quel club ?', o: ['Lyon', 'Monaco', 'Guingamp', 'Marseille'], a: 3, hint: 'Drogba a passé une saison très prolifique à Marseille avant un transfert de 24 M£ à Chelsea en 2004.' },
    ],
    copy: {
      tasterEyebrow: 'Essai gratuit · Sans inscription',
      tasterH: 'Tu connais vraiment l’OM ?',
      tasterPh: 'Dix questions rapides pour mesurer ton Ball IQ olympien.',
      tasterNote: 'Questions d’exemple — le quiz complet en contient bien plus.',
      playSection: 'Jouer au quiz OM',
      playSub: 'Touche une réponse pour vérifier — résultat immédiat et l’histoire derrière.',
      faqH: 'Quiz OM — Questions fréquentes',
      aboutQ: 'À propos du quiz OM',
      bandH: 'Tu penses connaître l’OM ? Prouve-le dans l’application.',
      bandP: 'Séries de victoires, 1 contre 1 en direct et une note sur 99 — tous les quiz dans une seule application. L’application est en anglais.',
      alsoH: 'La même page en anglais',
      alsoP: 'Ceci est la version française de notre quiz OM. Toutes les questions en version originale :',
      alsoLink: 'Marseille quiz (English)',
      statsLine: 'Les questions sur l’OM dans Ball IQ couvrent trois niveaux de difficulté — facile, moyen et difficile — toutes avec une explication.',
    },
  },

  // ── OLYMPIQUE LYONNAIS ─────────────────────────────────────────────────────
  {
    club: 'Olympique Lyonnais',
    slug: 'lyon',
    lang: 'fr',
    name: 'Olympique Lyonnais',
    h1: 'Quiz OL',
    title: 'Quiz OL — Olympique Lyonnais et Les Gones | Ball IQ',
    description:
      'Quiz OL gratuit, avec réponses expliquées : les sept titres d’affilée, Juninho, Benzema, Coupet, Lloris, Aulas et les Fenottes.',
    kind: 'Quiz de club',
    playLabel: 'Commencer le quiz',
    statLine: 'Gratuit · Questions sur l’OL avec réponses expliquées · sans inscription',
    intro: [
      'Sept titres de champion de France d’affilée, un record que personne n’a approché depuis. Ce quiz gratuit couvre toute l’histoire lyonnaise : l’arrivée de Jean-Michel Aulas en 1987 quand le club était en deuxième division, le premier titre de 2002, les coups francs de Juninho, Coupet et Lloris dans les buts, Benzema, Malouda et Abidal, la victoire au Bernabéu, l’exploit contre Manchester City en 2020 et la domination européenne des Fenottes.',
      'Les questions deviennent vraiment difficiles. Là où l’histoire du club est contestée, nous préférons ne pas publier la question plutôt que de prendre parti. Ne sort que ce qui se vérifie.',
      'Chaque réponse du set OL est accompagnée d’une explication écrite : même en se trompant, on apprend quelque chose.',
    ],
    faq: [
      { q: 'Le quiz OL est-il gratuit ?', a: 'Oui. Il se joue directement dans le navigateur, sans inscription et sans rien télécharger. Toutes les questions de cette page sont gratuites.' },
      { q: 'Quels sujets couvre le quiz ?', a: 'Le surnom des Gones, le Groupama Stadium, l’ère Aulas, les sept titres consécutifs et leurs entraîneurs, Juninho Pernambucano, Grégory Coupet et Hugo Lloris, Benzema, Malouda, Abidal et Lacazette, les parcours européens de 2010 et 2020, le derby contre Saint-Étienne et les titres européens de l’équipe féminine. On commence facile et on finit très difficile.' },
      { q: 'D’où viennent les questions ?', a: 'Elles sont écrites et vérifiées à la main, jamais générées automatiquement. Chaque information passe deux contrôles indépendants avant publication ; ce qui ne se vérifie pas ne sort pas.' },
      { q: 'L’application Ball IQ est-elle en français ?', a: 'Pas encore : cette page est en français, mais l’application est en anglais. Nous mesurons l’intérêt avant de traduire — être arrivé jusqu’ici nous aide déjà à trancher.' },
    ],
    taster: [
      { id: 'q_aa40b0', q: 'Sous quel surnom les supporters connaissent-ils l’Olympique Lyonnais ?', o: ['Les Verts', 'Les Gones', 'Les Dogues', 'Les Aiglons'], a: 1, hint: '«Gone» signifie gamin en parler lyonnais, donc Les Gones veut dire «les gamins» — Les Verts, ce sont les Stéphanois.' },
      { id: 'q_a6da39', q: 'Quel stade est l’enceinte de l’OL depuis 2016 ?', o: ['Le Stade de la Beaujoire', 'Le Stade Bollaert-Delelis', 'Le Groupama Stadium', 'Le Stade Vélodrome'], a: 2, en: 'Groupama Stadium', hint: 'L’OL s’est installé dans le Parc Olympique Lyonnais, à l’est de la ville, en janvier 2016.' },
      { id: 'q_975a8b', en: 'White', q: 'De quelle couleur est le maillot domicile traditionnel de l’OL ?', o: ['Vert', 'Blanc', 'Rouge', 'Bleu'], a: 1, hint: 'Le maillot traditionnel de l’OL est blanc, rehaussé du rouge et du bleu du club.' },
      { id: 'q_788ec3', q: 'Le derby le plus chaud de l’OL l’oppose à quel club voisin ?', o: ['l’AS Saint-Étienne', 'l’Olympique de Marseille', 'le Paris Saint-Germain', 'l’OGC Nice'], a: 0, en: 'AS Saint-Étienne', hint: 'Environ 60 km séparent les deux villes, ce qui fait du derby Rhône-Alpes l’un des plus intenses de France.' },
      { id: 'q_9687a3', q: 'Lors de quelle saison l’OL a-t-il remporté le premier titre de champion de France de son histoire ?', o: ['1997-98', '1999-2000', '2001-02', '2003-04'], a: 2, hint: 'L’OL a été sacré pour la première fois en 2001-02, lançant sa série record de sept titres.' },
      { id: 'q_72b087', en: 'Seven', q: 'L’OL a dominé la Ligue 1 dans les années 2000 avec une série record de titres consécutifs. Combien en a-t-il gagné d’affilée ?', o: ['Cinq', 'Six', 'Sept', 'Huit'], a: 2, hint: 'L’OL a remporté sept championnats de France consécutifs, un record en Ligue 1.' },
      { id: 'q_d24482', q: 'Quel entraîneur a offert à l’OL le premier titre de champion de son histoire ?', o: ['Paul Le Guen', 'Gérard Houllier', 'Jacques Santini', 'Alain Perrin'], a: 2, hint: 'Jacques Santini a livré le premier championnat lyonnais avant de partir prendre en main l’équipe de France.' },
      { id: 'q_e925c4', q: 'Quel milieu brésilien, redoutable spécialiste des coups francs, a été le capitaine de l’OL pendant les années de titres ?', o: ['Juninho Paulista', 'Zé Roberto', 'Juninho Pernambucano', 'Emerson'], a: 2, hint: 'Juninho Pernambucano a passé huit saisons à Lyon à partir de 2001 et y a remporté sept titres de champion.' },
      { id: 'q_01e39e', q: 'Quel attaquant formé au centre de formation de l’OL a été vendu au Real Madrid en 2009 ?', o: ['Bafétimbi Gomis', 'Olivier Giroud', 'Karim Benzema', 'Alexandre Lacazette'], a: 2, hint: 'Karim Benzema est sorti du centre de formation lyonnais, a été champion de France avec le club et a rejoint le Real Madrid en 2009.' },
      { id: 'q_7b8721', q: 'Quel homme d’affaires a pris la présidence de l’OL en 1987 et accompagné sa montée de la deuxième division jusqu’à sept titres de champion ?', o: ['Bernard Tapie', 'Louis Nicollin', 'Jean-Michel Aulas', 'Gervais Martel'], a: 2, hint: 'Jean-Michel Aulas est arrivé en 1987 avec son projet «OL – Europe», alors que Lyon évoluait en deuxième division.' },
    ],
    sample: [
      { id: 'q_fdcdcf', q: 'L’OL a recruté Juninho Pernambucano en 2001 dans quel club brésilien ?', o: ['Flamengo', 'Vasco da Gama', 'Corinthians', 'São Paulo'], a: 1, hint: 'Juninho est arrivé de Vasco da Gama, où il avait remporté la Copa Libertadores, et est devenu le patron de l’OL sur le terrain.' },
      { id: 'q_343fc3', q: 'Quel gardien a passé onze ans à l’OL, remportant les sept titres consécutifs, avant de rejoindre l’Atlético Madrid en 2008 ?', o: ['Fabien Barthez', 'Ulrich Ramé', 'Grégory Coupet', 'Sébastien Frey'], a: 2, hint: 'Grégory Coupet a été le numéro un lyonnais de 1997 à 2008 et a été élu meilleur gardien de Ligue 1 à plusieurs reprises.' },
      { id: 'q_609cbf', q: 'Quel gardien de l’OL a rejoint Tottenham Hotspur en 2012 ?', o: ['Steve Mandanda', 'Hugo Lloris', 'Mickaël Landreau', 'Grégory Coupet'], a: 1, hint: 'Hugo Lloris était capitaine de l’OL avant son départ à Tottenham en août 2012, où il est resté onze ans.' },
      { id: 'q_8f74cf', q: 'Quel défenseur français a quitté l’OL pour Barcelone en 2007 ?', o: ['Philippe Mexès', 'Éric Abidal', 'William Gallas', 'Jean-Alain Boumsong'], a: 1, hint: 'Éric Abidal a rejoint Barcelone depuis Lyon en 2007 et y a remporté deux fois la Ligue des champions.' },
      { id: 'q_cb4a14', q: 'Quel ailier français l’OL a-t-il vendu à Chelsea en 2007 ?', o: ['Sidney Govou', 'Franck Ribéry', 'Florent Malouda', 'Jérémy Ménez'], a: 2, hint: 'Florent Malouda a rejoint Chelsea en 2007 après quatre saisons à Lyon, où il avait remporté quatre titres de champion.' },
      { id: 'q_beaa6a', q: 'Alexandre Lacazette a quitté l’OL en 2017 pour quel club anglais ?', o: ['Chelsea', 'Everton', 'Arsenal', 'Liverpool'], a: 2, hint: 'Lacazette a signé à Arsenal en juillet 2017 pour environ 46 M£, alors record du club londonien.' },
      { id: 'q_7144bc', q: 'Quel entraîneur était en poste lors du dernier des sept titres consécutifs, une saison couronnée aussi par la Coupe de France ?', o: ['Alain Perrin', 'Claude Puel', 'Paul Le Guen', 'Gérard Houllier'], a: 0, hint: 'Alain Perrin a réalisé le doublé en 2007-08, septième championnat consécutif de l’OL.' },
      { id: 'q_7c47f2', q: 'L’OL a réalisé le doublé en 2008 en battant quel club 1-0 en finale de la Coupe de France ?', o: ['l’Olympique de Marseille', 'les Girondins de Bordeaux', 'le Paris Saint-Germain', 'l’AS Monaco'], a: 2, en: 'Paris Saint-Germain', hint: 'Un but de Karim Benzema a battu le Paris Saint-Germain au Stade de France.' },
      { id: 'q_e02c45', q: 'Quel club espagnol l’OL a-t-il éliminé en huitièmes de finale de la Ligue des champions 2009-10 ?', o: ['Séville', 'le Real Madrid', 'Valence', 'Barcelone'], a: 1, en: 'Real Madrid', hint: 'L’OL a gagné 1-0 à domicile et fait 1-1 au Bernabéu pour se qualifier 2-1 au cumul.' },
      { id: 'q_9d3e6c', q: 'Quel club a mis fin au parcours de l’OL en demi-finale de la Ligue des champions 2010 ?', o: ['l’Inter Milan', 'Barcelone', 'le Bayern Munich', 'Manchester United'], a: 2, en: 'Bayern Munich', hint: 'Le Bayern Munich a gagné 1-0 à l’aller grâce à Arjen Robben, puis s’est imposé 3-0 au retour.' },
      { id: 'q_6e7283', q: 'En quart de finale de la Ligue des champions 2020 à Lisbonne, l’OL a créé l’exploit en battant 3-1 quel club anglais ?', o: ['Chelsea', 'Manchester United', 'Manchester City', 'Tottenham Hotspur'], a: 2, hint: 'L’OL a sorti Manchester City sur un match sec, Moussa Dembélé marquant deux fois après son entrée en jeu.' },
      { id: 'q_df1465', q: 'Quel club a remporté le plus de titres en Ligue des champions féminine ?', o: ['le VfL Wolfsburg', 'l’Olympique Lyonnais', 'le FC Barcelone', 'le 1. FFC Francfort'], a: 1, en: 'Olympique Lyonnais', hint: 'L’équipe féminine de l’OL a soulevé le trophée européen huit fois, plus que n’importe quel autre club.' },
    ],
    copy: {
      tasterEyebrow: 'Essai gratuit · Sans inscription',
      tasterH: 'Tu connais vraiment l’OL ?',
      tasterPh: 'Dix questions rapides pour mesurer ton Ball IQ lyonnais.',
      tasterNote: 'Questions d’exemple — le quiz complet en contient bien plus.',
      playSection: 'Jouer au quiz OL',
      playSub: 'Touche une réponse pour vérifier — résultat immédiat et l’histoire derrière.',
      faqH: 'Quiz OL — Questions fréquentes',
      aboutQ: 'À propos du quiz OL',
      bandH: 'Tu penses connaître Les Gones ? Prouve-le dans l’application.',
      bandP: 'Séries de victoires, 1 contre 1 en direct et une note sur 99 — tous les quiz dans une seule application. L’application est en anglais.',
      alsoH: 'La même page en anglais',
      alsoP: 'Ceci est la version française de notre quiz OL. Toutes les questions en version originale :',
      alsoLink: 'Lyon quiz (English)',
      statsLine: 'Les questions sur l’OL dans Ball IQ couvrent trois niveaux de difficulté — facile, moyen et difficile — toutes avec une explication.',
    },
  },

  // ── AS MONACO ──────────────────────────────────────────────────────────────
  {
    club: 'AS Monaco',
    slug: 'monaco',
    lang: 'fr',
    name: 'AS Monaco',
    h1: 'Quiz AS Monaco',
    title: 'Quiz AS Monaco — Le Rocher et Louis II | Ball IQ',
    description:
      'Quiz Monaco gratuit, avec réponses expliquées : Wenger, Tigana, Henry et Trezeguet, la finale 2004, Ettori, Falcao, Mbappé et le titre 2017.',
    kind: 'Quiz de club',
    playLabel: 'Commencer le quiz',
    statLine: 'Gratuit · Questions sur Monaco avec réponses expliquées · sans inscription',
    intro: [
      'Une principauté, un championnat étranger et huit titres de champion de France. Ce quiz gratuit couvre toute l’histoire monégasque : le Stade Louis II bâti sur la mer, Jean-Luc Ettori et ses 755 matchs, Arsène Wenger champion dès sa première saison, la génération Tigana avec Henry et Trezeguet, la finale européenne de 2004, la descente en Ligue 2 puis le rachat de 2011, Falcao, Mbappé et le titre de 2017.',
      'Les questions deviennent vraiment difficiles. Là où l’histoire du club est contestée, nous préférons ne pas publier la question plutôt que de prendre parti. Ne sort que ce qui se vérifie.',
      'Chaque réponse du set Monaco est accompagnée d’une explication écrite : même en se trompant, on apprend quelque chose.',
    ],
    faq: [
      { q: 'Le quiz Monaco est-il gratuit ?', a: 'Oui. Il se joue directement dans le navigateur, sans inscription et sans rien télécharger. Toutes les questions de cette page sont gratuites.' },
      { q: 'Quels sujets couvre le quiz ?', a: 'Le statut particulier du club dans le championnat français, le Stade Louis II, le maillot en diagonale, Jean-Luc Ettori, Arsène Wenger et George Weah, les champions de Jean Tigana, le parcours européen de 2004 avec Morientes et Deschamps, la relégation de 2011 et le rachat par Rybolovlev, Ranieri, Falcao, Mbappé et le titre 2017. On commence facile et on finit très difficile.' },
      { q: 'D’où viennent les questions ?', a: 'Elles sont écrites et vérifiées à la main, jamais générées automatiquement. Chaque information passe deux contrôles indépendants avant publication ; ce qui ne se vérifie pas ne sort pas.' },
      { q: 'L’application Ball IQ est-elle en français ?', a: 'Pas encore : cette page est en français, mais l’application est en anglais. Nous mesurons l’intérêt avant de traduire — être arrivé jusqu’ici nous aide déjà à trancher.' },
    ],
    taster: [
      { id: 'q_ba365e', q: 'Dans le championnat de quel pays l’AS Monaco dispute-t-il ses matchs de league ?', o: ['La France', 'L’Italie', 'Le Portugal', 'L’Espagne'], a: 0, en: 'France', hint: 'Bien que le club soit basé en Principauté de Monaco, il évolue dans le système des ligues françaises.' },
      { id: 'q_4ce469', q: 'Comment s’appelle le stade de l’AS Monaco ?', o: ['Le Stade Vélodrome', 'Le Stade Geoffroy-Guichard', 'Le Stade Louis II', 'Le Stade de la Meinau'], a: 2, en: 'Stade Louis II', hint: 'Monaco évolue au Stade Louis II, bâti sur des terres gagnées sur la mer, depuis son ouverture en 1985.' },
      { id: 'q_5523a9', en: 'Red and white', q: 'Le maillot domicile traditionnel de Monaco est célèbre pour sa diagonale, dans quelles deux couleurs ?', o: ['Bleu et blanc', 'Rouge et blanc', 'Vert et blanc', 'Noir et or'], a: 1, hint: 'Le maillot diagonal rouge et blanc est la signature monégasque depuis des décennies.' },
      { id: 'q_d69dbf', en: 'Eight', q: 'Combien de fois Monaco a-t-il remporté le championnat de France ?', o: ['Quatre', 'Six', 'Huit', 'Dix'], a: 2, hint: 'Les huit titres monégasques datent de 1961, 1963, 1978, 1982, 1988, 1997, 2000 et 2017.' },
      { id: 'q_ecb0c5', q: 'Quel entraîneur a dirigé Monaco de 1987 à 1994 avant de prendre plus tard les rênes d’Arsenal ?', o: ['Jean Tigana', 'Gérard Houllier', 'Didier Deschamps', 'Arsène Wenger'], a: 3, hint: 'Arsène Wenger a été champion de France dès sa première saison à Monaco, en 1987-88, et est resté jusqu’en 1994.' },
      { id: 'q_2dd03f', q: 'Quel entraîneur a mené Monaco au titre de champion de France 1996-97 ?', o: ['Claude Puel', 'Arsène Wenger', 'Jean Tigana', 'Didier Deschamps'], a: 2, hint: 'Les champions de Jean Tigana en 1996-97 comptaient Fabien Barthez, Thierry Henry, David Trezeguet et Emmanuel Petit.' },
      { id: 'q_c0f46c', q: 'Quel entraîneur a mené Monaco au titre de Ligue 1 2016-17 ?', o: ['Didier Deschamps', 'Leonardo Jardim', 'Claude Puel', 'Jean Tigana'], a: 1, hint: 'Le technicien portugais Leonardo Jardim est arrivé en 2014 et a offert le championnat au club en 2016-17.' },
      { id: 'q_a16691', q: 'Dans quel club Kylian Mbappé est-il parti depuis Monaco en 2017 ?', o: ['l’Olympique Lyonnais', 'le Real Madrid', 'le Paris Saint-Germain', 'l’Olympique de Marseille'], a: 2, en: 'Paris Saint-Germain', hint: 'Mbappé a rejoint le Paris Saint-Germain à l’été 2017, juste après la saison du titre monégasque.' },
      { id: 'q_3743ea', q: 'Quel club a battu Monaco en finale de la Ligue des champions 2004 ?', o: ['le Real Madrid', 'Chelsea', 'le Milan AC', 'Porto'], a: 3, en: 'Porto', hint: 'Le Porto de José Mourinho a gagné la finale 2004 sur le score de 3-0, à Gelsenkirchen.' },
      { id: 'q_b06838', q: 'Qui entraînait Monaco lors de la finale de la Ligue des champions 2004 ?', o: ['Jean Tigana', 'Claude Puel', 'Didier Deschamps', 'Arsène Wenger'], a: 2, hint: 'Didier Deschamps a entraîné Monaco de 2001 à 2005 et l’a conduit en finale en 2004.' },
    ],
    sample: [
      { id: 'q_5ea0f9', q: 'Quel gardien a passé toute sa carrière à Monaco, disputant 755 matchs entre 1975 et 1994 ?', o: ['Jean-Luc Ettori', 'Fabien Barthez', 'Bernard Lama', 'Joël Bats'], a: 0, hint: 'Les 602 matchs de championnat de Jean-Luc Ettori ont longtemps constitué le record de l’élite française.' },
      { id: 'q_d6f262', q: 'Quel joueur africain a commencé sa carrière européenne à Monaco en 1988, en provenance du Tonnerre Yaoundé ?', o: ['Abedi Pelé', 'Roger Milla', 'George Weah', 'Rabah Madjer'], a: 2, hint: 'George Weah est arrivé du club camerounais Tonnerre Yaoundé en 1988 et a remporté la Coupe de France avec Monaco.' },
      { id: 'q_e39d25', q: 'De quel club argentin Monaco a-t-il recruté David Trezeguet en 1995 ?', o: ['River Plate', 'Boca Juniors', 'Vélez Sarsfield', 'Platense'], a: 3, hint: 'Trezeguet est passé de Platense à Monaco en 1995 et y a remporté deux titres de champion avant de rejoindre la Juventus.' },
      { id: 'q_88c737', q: 'Quel attaquant espagnol, prêté à Monaco par le Real Madrid, a terminé meilleur buteur de la Ligue des champions 2003-04 avec neuf buts ?', o: ['Raúl González', 'Diego Tristán', 'Fernando Torres', 'Fernando Morientes'], a: 3, hint: 'Fernando Morientes, prêté par son club propriétaire le Real Madrid, a fini meilleur buteur de l’édition 2003-04.' },
      { id: 'q_6ac488', q: 'Quel club Monaco a-t-il éliminé aux buts marqués à l’extérieur en quart de finale de la Ligue des champions 2003-04 ?', o: ['le Bayern Munich', 'le Real Madrid', 'le Milan AC', 'Arsenal'], a: 1, en: 'Real Madrid', hint: 'Monaco a perdu 4-2 à Madrid mais gagné 3-1 au retour pour passer 5-5 aux buts à l’extérieur.' },
      { id: 'q_fae983', q: 'À l’issue de quelle saison Monaco a-t-il été relégué en Ligue 2 ?', o: ['2008-09', '2009-10', '2010-11', '2011-12'], a: 2, hint: 'Monaco est descendu en 2011, sa première relégation de l’élite française en 35 ans.' },
      { id: 'q_a69635', q: 'Quel homme d’affaires a racheté deux tiers de l’AS Monaco en décembre 2011 ?', o: ['Roman Abramovitch', 'Alicher Ousmanov', 'Maxim Demin', 'Dmitri Rybolovlev'], a: 3, en: 'Dmitry Rybolovlev', hint: 'Dmitri Rybolovlev a acquis 66,67 % du club en décembre 2011, alors que Monaco était dernier de Ligue 2.' },
      { id: 'q_8076f8', q: 'Quel entraîneur a mené Monaco au titre de Ligue 2 en 2012-13 et à la remontée dans l’élite ?', o: ['Marco Simone', 'Claudio Ranieri', 'Carlo Ancelotti', 'Fabio Capello'], a: 1, hint: 'Claudio Ranieri a succédé à Marco Simone et a gagné la deuxième division dès sa première tentative, en 2012-13.' },
      { id: 'q_c7f842', q: 'Quel attaquant colombien a rejoint Monaco depuis l’Atlético Madrid en 2013 ?', o: ['Jackson Martínez', 'Carlos Bacca', 'Radamel Falcao', 'Teófilo Gutiérrez'], a: 2, hint: 'Radamel Falcao a été la recrue vedette des dépenses monégasques après la remontée en Ligue 1.' },
      { id: 'q_cb9f84', q: 'Quel club a terminé deuxième derrière Monaco en Ligue 1 en 2016-17 ?', o: ['l’Olympique Lyonnais', 'le Paris Saint-Germain', 'l’AS Saint-Étienne', 'le Lille OSC'], a: 1, en: 'Paris Saint-Germain', hint: 'Monaco a terminé avec huit points d’avance sur le Paris Saint-Germain, tenant du titre, en 2016-17.' },
      { id: 'q_6c7f89', q: 'Quel club allemand Monaco a-t-il éliminé en quart de finale de la Ligue des champions 2016-17 ?', o: ['le Bayern Munich', 'le Bayer Leverkusen', 'le Borussia Dortmund', 'le RB Leipzig'], a: 2, en: 'Borussia Dortmund', hint: 'Monaco a gagné 3-2 à l’extérieur et 3-1 à domicile pour éliminer le Borussia Dortmund 6-3 au cumul.' },
      { id: 'q_ecd74a', q: 'Monaco a éliminé quel club anglais aux buts marqués à l’extérieur en huitièmes de finale de la Ligue des champions 2016-17 ?', o: ['Arsenal', 'Leicester City', 'Tottenham Hotspur', 'Manchester City'], a: 3, hint: 'Après une défaite 5-3 à l’Etihad, Monaco a gagné le retour 3-1 pour passer 6-6 aux buts à l’extérieur.' },
    ],
    copy: {
      tasterEyebrow: 'Essai gratuit · Sans inscription',
      tasterH: 'Tu connais vraiment l’AS Monaco ?',
      tasterPh: 'Dix questions rapides pour mesurer ton Ball IQ monégasque.',
      tasterNote: 'Questions d’exemple — le quiz complet en contient bien plus.',
      playSection: 'Jouer au quiz Monaco',
      playSub: 'Touche une réponse pour vérifier — résultat immédiat et l’histoire derrière.',
      faqH: 'Quiz AS Monaco — Questions fréquentes',
      aboutQ: 'À propos du quiz Monaco',
      bandH: 'Tu penses connaître Le Rocher ? Prouve-le dans l’application.',
      bandP: 'Séries de victoires, 1 contre 1 en direct et une note sur 99 — tous les quiz dans une seule application. L’application est en anglais.',
      alsoH: 'La même page en anglais',
      alsoP: 'Ceci est la version française de notre quiz Monaco. Toutes les questions en version originale :',
      alsoLink: 'AS Monaco quiz (English)',
      statsLine: 'Les questions sur Monaco dans Ball IQ couvrent trois niveaux de difficulté — facile, moyen et difficile — toutes avec une explication.',
    },
  },
];

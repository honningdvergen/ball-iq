// Portuguese club pages — PILOT (one page: Flamengo).
//
// WHY A SEPARATE LANGUAGE AND NOT JUST "MORE SPANISH"
//
// Wave L shipped five South American clubs and they do not share a language.
// Boca Juniors and River Plate are Argentine; Corinthians, Flamengo and
// Palmeiras are Brazilian. So the Spanish pilot at /es/quiz/boca-juniors/
// leaves the MAJORITY of that wave unserved — three of five clubs — and no
// amount of Spanish fixes it, because a Flamengo supporter searches
// "quiz do Flamengo", not "quiz de Flamengo".
//
// Spanish and Portuguese are separate search markets with separate competition,
// so each gets its own pilot before anything scales. Two experiments, not
// seventy pages on a hunch. Flamengo is the right Portuguese test: the largest
// supporter base in Brazil, and a 2019 season (Libertadores + Brasileirão under
// Jorge Jesus) that people actively look things up about.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as clubs-es.mjs, and for the same reasons. Every entry carries
// `id`, the id of the English question in src/questions.js it was translated
// from, and gen-seo-pages.mjs enforces two things at build time:
//
//   1. every id still resolves in the bank (a deleted or re-idded question
//      breaks the build rather than leaving this page quoting a ghost);
//   2. the answer keys still agree — proper nouns compared loosely, translated
//      prose declaring the exact English string it came from via `en`.
//
// So this file asserts no new facts. Each one already survived the three-stage
// forge in English, and translating preserves a fact rather than inventing one.
//
// Portuguese register: Brazilian, and the club's own vocabulary where it
// matters (Mengão, Ninho do Urubu, Gabigol, o Maracanã). Football terms follow
// Brazilian usage — "goleiro" not "guarda-redes", "técnico" not "treinador",
// "zagueiro", "lateral" — because that is the audience this page is for. A page
// written in European Portuguese would read as foreign to every reader it is
// meant to reach.

export const CLUBS_PT = [
  {
    club: 'Flamengo',              // must match the `club` field in src/questions.js
    slug: 'flamengo',              // shared with the English page: /quiz/flamengo/
    lang: 'pt',
    name: 'Flamengo',
    h1: 'Quiz do Flamengo',
    title: 'Quiz do Flamengo — Perguntas do Mengão | Ball IQ',
    description:
      'Quiz gratuito do Flamengo com respostas explicadas: a Libertadores de 1981 e 2019, Zico, Gabigol, o Maracanã e a era Jorge Jesus.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · 36 perguntas do Flamengo · sem cadastro',
    playLabel: 'Jogar o quiz',
    intro: [
      'A maior torcida do Brasil merece um quiz à altura. Este é gratuito, feito para quem acompanha o Mengão de verdade, e percorre todo o arco do clube — do time de Zico que ganhou a Libertadores e o Mundial em 1981 à campanha de 2019 sob Jorge Jesus, com os dois gols de Gabigol nos minutos finais em Lima e os 90 pontos no Brasileirão.',
      'As perguntas ficam difíceis mesmo. Onde a história do Flamengo é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que dá para verificar.',
      'Cada resposta do conjunto do Flamengo vem com uma explicação escrita, então errar também ensina alguma coisa sobre como o Flamengo ganhou o que ganhou.',
    ],
    faq: [
      {
        q: 'O quiz do Flamengo é gratuito?',
        a: 'É. Dá para jogar aqui mesmo no navegador, sem cadastro e sem baixar nada. Todas as perguntas desta página são gratuitas.',
      },
      {
        q: 'Quais temas o quiz cobre?',
        a: 'História do clube, a Libertadores de 1981 e o Mundial de Tóquio, Zico, a campanha de 2019 com Jorge Jesus, a Libertadores de 2022, Gabigol, Bruno Henrique, o Ninho do Urubu e os recordes do clube. Vai do fácil ao realmente difícil.',
      },
      {
        q: 'De onde vêm as perguntas?',
        a: 'São escritas e verificadas à mão, nunca geradas automaticamente. Cada informação passa por duas checagens independentes antes de ser publicada, e quando algo não dá para confirmar, a pergunta não sai.',
      },
      {
        // The honest disclosure, and the single most useful thing this pilot
        // can measure. Same as the Spanish page: if people bounce here, the
        // answer to "should we localise?" is "not until the app is localised".
        q: 'O aplicativo Ball IQ está em português?',
        a: 'Ainda não: esta página está em português, mas o aplicativo está em inglês. Estamos medindo o interesse antes de traduzir — se você chegou até aqui, já está ajudando a decidir.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_842a2e', q: 'Em qual cidade brasileira fica o Flamengo?', o: ['São Paulo', 'Belo Horizonte', 'Porto Alegre', 'Rio de Janeiro'], a: 3, hint: 'O clube nasceu na Zona Sul da cidade, no bairro que dá nome a ele, e manda seus grandes jogos no estádio mais famoso do país.' },
      { id: 'q_0a2989', q: 'Qual estádio o Flamengo usa como casa nos seus maiores jogos?', o: ['Maracanã', 'Mineirão', 'Morumbi', 'Arena Corinthians'], a: 0, hint: 'Inaugurado para a Copa de 1950, é o palco onde o clube reúne suas maiores públicos no Rio de Janeiro.' },
      { id: 'q_f13629', en: 'Red and black', q: 'Quais são as duas cores do uniforme tradicional do Flamengo?', o: ['Azul e branco', 'Vermelho e preto', 'Verde e branco', 'Vermelho e branco'], a: 1, hint: 'As faixas horizontais renderam ao time o apelido de Rubro-Negro, usado desde os primeiros anos do futebol no clube.' },
      { id: 'q_e41cfb', q: 'Qual clube argentino o Flamengo venceu por 2 a 1 na final da Libertadores de 2019?', o: ['River Plate', 'Boca Juniors', 'Racing Club', 'Independiente'], a: 0, hint: 'O adversário abriu o placar no primeiro tempo e o Flamengo virou nos minutos finais, com dois gols em menos de dois minutos.' },
      { id: 'q_04b9a8', q: 'Quem marcou os dois gols do Flamengo nos últimos dois minutos da final da Libertadores de 2019?', o: ['Bruno Henrique', 'Éverton Ribeiro', 'Gabriel Barbosa', 'Rodrigo Caio'], a: 2, hint: 'O centroavante conhecido como Gabigol foi o artilheiro daquela edição e decidiu a final em Lima.' },
      { id: 'q_313838', q: 'Qual técnico português levou o Flamengo ao título da Libertadores e do Brasileirão em 2019?', o: ['José Mourinho', 'Jorge Jesus', 'Paulo Fonseca', 'Bruno Lage'], a: 1, hint: 'Ele chegou em meados de 2019 vindo do futebol português e mudou completamente a forma de jogar do time.' },
      { id: 'q_ee4833', q: 'O Flamengo perdeu a final do Mundial de Clubes de 2019 por 1 a 0 na prorrogação para qual campeão europeu?', o: ['Real Madrid', 'Bayern de Munique', 'Liverpool', 'Chelsea'], a: 2, hint: 'O gol saiu já na prorrogação, em Doha, contra o então campeão da Liga dos Campeões.' },
      { id: 'q_278fdb', en: 'Rowing', q: 'O Flamengo foi fundado originalmente não como clube de futebol, mas para qual esporte?', o: ['Basquete', 'Remo', 'Polo aquático', 'Atletismo'], a: 1, hint: 'O clube nasceu em 1895 na orla do Rio de Janeiro; o departamento de futebol só viria mais de quinze anos depois.' },
      { id: 'q_a2e544', q: 'O centro de treinamento do Flamengo, na Zona Oeste do Rio, é conhecido popularmente por qual nome?', o: ['Toca da Raposa', 'Cidade do Galo', 'CT Joaquim Grava', 'Ninho do Urubu'], a: 3, hint: 'O apelido vem do mascote do clube; os outros três nomes pertencem a Cruzeiro, Atlético Mineiro e Corinthians.' },
      { id: 'q_c71e77', q: 'O Flamengo ganhou sua primeira Libertadores em 1981, batendo qual clube chileno na decisão?', o: ['Cobreloa', 'Colo-Colo', 'Universidad de Chile', 'Unión Española'], a: 0, hint: 'A decisão precisou de um terceiro jogo, em Montevidéu, e Zico marcou os dois gols da vitória final.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_7f0ab5', q: 'Quem marcou duas vezes pelo Flamengo na final do Mundial Interclubes de 1981, em Tóquio?', o: ['Adílio', 'Tita', 'Nunes', 'Júnior'], a: 2, hint: 'O centroavante decidiu o 3 a 0 sobre o Liverpool; Zico deu as assistências dos três gols.' },
      { id: 'q_15e378', q: 'A final da Libertadores de 2019 saiu de Santiago por causa dos protestos no Chile. Em qual cidade foi jogada?', o: ['Buenos Aires', 'Lima', 'Assunção', 'Montevidéu'], a: 1, hint: 'A CONMEBOL transferiu a decisão para o Peru poucas semanas antes da data marcada.' },
      { id: 'q_7efa35', q: 'O Flamengo estava perdendo no intervalo da final da Libertadores de 2019. Qual atacante colombiano abriu o placar aos 14 minutos?', o: ['Rafael Santos Borré', 'Juan Fernando Quintero', 'Miguel Borja', 'Duván Zapata'], a: 0, hint: 'Ele aproveitou uma sobra na pequena área e o placar só mudou nos dois últimos minutos do jogo.' },
      { id: 'q_e2fdb8', q: 'Quantos pontos o Flamengo somou ao ganhar o Campeonato Brasileiro de 2019?', o: ['78', '84', '90', '96'], a: 2, hint: 'Foi a maior pontuação da era dos pontos corridos com 38 rodadas até então.' },
      { id: 'q_8e82f3', q: 'O Flamengo venceu a volta da semifinal da Libertadores de 2019 por 5 a 0. Contra quem?', o: ['Boca Juniors', 'Palmeiras', 'Grêmio', 'Internacional'], a: 2, hint: 'A ida em Porto Alegre terminou 1 a 1, e a volta no Maracanã virou uma das noites mais lembradas da campanha.' },
      { id: 'q_19f2dd', q: 'O Flamengo bateu seu recorde de contratação em 2019 para trazer o uruguaio Giorgian de Arrascaeta de qual clube brasileiro?', o: ['Internacional', 'Atlético Mineiro', 'São Paulo', 'Cruzeiro'], a: 3, hint: 'Ele veio de Belo Horizonte depois de três temporadas lá, e virou peça central do meio-campo de 2019.' },
      { id: 'q_117852', q: 'Qual técnico levou o Flamengo ao título da Libertadores de 2022?', o: ['Tite', 'Dorival Júnior', 'Vítor Pereira', 'Renato Gaúcho'], a: 1, hint: 'Ele assumiu com a temporada em andamento e fechou o ano com Libertadores e Copa do Brasil.' },
      { id: 'q_2126bb', q: 'O Flamengo ganhou a Copa do Brasil de 2022 nos pênaltis contra qual clube?', o: ['Atlético Mineiro', 'Fluminense', 'São Paulo', 'Corinthians'], a: 3, hint: 'A decisão foi no Maracanã, com os dois jogos empatados e a definição na marca da cal.' },
      { id: 'q_049ab9', q: 'Qual jogador é o recordista de partidas pelo Flamengo, com 857 jogos?', o: ['Zico', 'Adílio', 'Júnior', 'Rondinelli'], a: 2, hint: 'O lateral-esquerdo teve duas passagens pelo clube, com um período no futebol italiano entre elas.' },
      { id: 'q_5049f6', q: 'Para qual clube italiano Zico foi em 1983, depois da sua primeira passagem pelo Flamengo?', o: ['Napoli', 'Fiorentina', 'Roma', 'Udinese'], a: 3, hint: 'A transferência para o clube do Friul quase foi barrada por uma disputa entre a federação italiana e o governo local.' },
      { id: 'q_1d3fca', q: 'Qual atacante foi eleito a Bola de Ouro no ano em que o Flamengo ganhou o Brasileirão de 2009?', o: ['Vágner Love', 'Fred', 'Adriano', 'Ronaldo'], a: 2, hint: 'O Imperador voltou ao clube naquele ano e foi decisivo na reta final do campeonato.' },
      { id: 'q_639645', q: 'Qual atacante, então eleito o melhor jogador do mundo pela FIFA, chegou ao Flamengo vindo do Barcelona em janeiro de 1995?', o: ['Romário', 'Bebeto', 'Careca', 'Müller'], a: 0, hint: 'Ele tinha sido o craque da conquista da Copa de 1994 e voltou ao Rio poucos meses depois.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem cadastro',
      tasterH: 'Quanto você sabe sobre o Flamengo?',
      tasterPh: 'Dez perguntas rápidas para medir o seu Ball IQ rubro-negro.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Jogue o quiz do Flamengo',
      playSub: 'Toque em uma resposta para conferir — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do Flamengo — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do Flamengo',
      bandH: 'Acha que sabe tudo do Mengão? Prove no aplicativo.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes em um só app. O aplicativo está em inglês.',
      alsoH: 'A mesma página em inglês',
      alsoP: 'Esta é a versão em português do nosso quiz do Flamengo. A original, com as 36 perguntas, está aqui:',
      alsoLink: 'Flamengo quiz (English)',
      statsLine: (n, e, m, h) => `O Ball IQ tem ${n} perguntas do Flamengo — ${e} fáceis, ${m} médias e ${h} difíceis.`,
    },
  },
];

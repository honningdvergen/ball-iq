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
  {
    club: 'Corinthians',
    slug: 'corinthians',
    lang: 'pt',
    name: 'Corinthians',
    h1: 'Quiz do Corinthians',
    title: 'Quiz do Corinthians — Perguntas do Timão | Ball IQ',
    description:
      'Quiz gratuito do Corinthians com respostas explicadas: o Mundial de 2012, a Libertadores, Sócrates e a Democracia Corintiana, Ronaldo e o Derby.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · 36 perguntas do Timão · sem cadastro',
    playLabel: 'Jogar o quiz',
    intro: [
      'O Corinthians tem uma torcida que atravessa o país e uma história que vai muito além do futebol. Este quiz gratuito percorre tudo: o Mundial de 2012 em Yokohama, com o gol de Guerrero e Cássio eleito o melhor do torneio; a primeira Libertadores no mesmo ano, invicto; a Democracia Corintiana de Sócrates nos anos 80; o Mundial de 2000, o primeiro da história; Ronaldo em 2009; e o Derby contra o Palmeiras.',
      'As perguntas ficam difíceis mesmo. Onde a história é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que dá para verificar.',
      'Cada resposta do conjunto do Corinthians vem com uma explicação escrita, então errar também ensina alguma coisa.',
    ],
    faq: [
      { q: 'O quiz do Corinthians é gratuito?', a: 'É. Dá para jogar aqui mesmo no navegador, sem cadastro e sem baixar nada. Todas as perguntas desta página são gratuitas.' },
      { q: 'Quais temas o quiz cobre?', a: 'História do clube, o Mundial de 2000 e o de 2012, a Libertadores de 2012, a Democracia Corintiana, Sócrates, Marcelinho Carioca, Ronaldo, Tite, Cássio, o rebaixamento de 2007 e o Derby Paulista. Vai do fácil ao realmente difícil.' },
      { q: 'De onde vêm as perguntas?', a: 'São escritas e verificadas à mão, nunca geradas automaticamente. Cada informação passa por duas checagens independentes antes de ser publicada, e quando algo não dá para confirmar, a pergunta não sai.' },
      { q: 'O aplicativo Ball IQ está em português?', a: 'Ainda não: esta página está em português, mas o aplicativo está em inglês. Estamos medindo o interesse antes de traduzir — se você chegou até aqui, já está ajudando a decidir.' },
    ],
    taster: [
      { id: 'q_bd4e04', q: 'Por qual apelido de uma só palavra o Corinthians é conhecido no Brasil?', o: ['Verdão', 'Peixe', 'Mengão', 'Timão'], a: 3, hint: 'O apelido nasceu como aumentativo do nome do clube e é usado pela torcida desde meados do século XX.' },
      { id: 'q_a31d77', q: 'A maior rivalidade do Corinthians, considerada o maior clássico do estado, é contra qual clube?', o: ['Santos', 'São Paulo', 'Portuguesa', 'Palmeiras'], a: 3, hint: 'O confronto é conhecido como Derby Paulista e opõe os dois clubes com as maiores torcidas do estado.' },
      { id: 'q_aa6217', en: 'White and black', q: 'Quais são as duas cores do uniforme tradicional do Corinthians?', o: ['Verde e branco', 'Vermelho e preto', 'Branco e preto', 'Azul e branco'], a: 2, hint: 'A camisa principal é branca e a reserva preta, uma combinação que o clube usa há mais de um século.' },
      { id: 'q_4d4b7c', q: 'Qual é o nome do estádio que o Corinthians usa como casa desde 2014, no bairro de Itaquera?', o: ['Allianz Parque', 'Neo Química Arena', 'Morumbi', 'Beira-Rio'], a: 1, hint: 'Foi construído para a Copa de 2014 e sediou a partida de abertura do torneio.' },
      { id: 'q_905f2b', q: 'O Corinthians venceu qual clube inglês por 1 a 0 na final do Mundial de Clubes de 2012?', o: ['Chelsea', 'Manchester United', 'Liverpool', 'Arsenal'], a: 0, hint: 'O adversário era o campeão europeu daquele ano, e a decisão foi em Yokohama.' },
      { id: 'q_376bff', q: 'O Corinthians ganhou sua primeira Libertadores em 2012, batendo qual clube argentino na final?', o: ['River Plate', 'Independiente', 'Boca Juniors', 'Racing Club'], a: 2, hint: 'Foi 1 a 1 em Buenos Aires e 2 a 0 em São Paulo, numa campanha inteira sem derrotas.' },
      { id: 'q_8feb1f', q: 'Qual atacante brasileiro, artilheiro da Copa de 2002 e conhecido como O Fenômeno, assinou com o Corinthians em dezembro de 2008?', o: ['Ronaldo Nazário', 'Adriano', 'Romário', 'Luís Fabiano'], a: 0, hint: 'Ele chegou depois de anos na Europa e ainda ajudou o clube a ganhar a Copa do Brasil de 2009.' },
      { id: 'q_241a31', q: 'Qual campeonato estadual o Corinthians disputa todos os anos, além do nacional?', o: ['Campeonato Paulista', 'Campeonato Carioca', 'Campeonato Mineiro', 'Campeonato Gaúcho'], a: 0, hint: 'É o estadual mais antigo do país e o clube é um dos seus maiores campeões.' },
      { id: 'q_48e43d', q: 'Qual técnico levou o Corinthians aos títulos brasileiros de 2011 e 2015 antes de assumir a seleção em 2016?', o: ['Mano Menezes', 'Tite', 'Vanderlei Luxemburgo', 'Fábio Carille'], a: 1, hint: 'Ele também comandou o time nas conquistas da Libertadores e do Mundial de 2012.' },
      { id: 'q_439ae7', q: 'O goleiro do Corinthians foi eleito o melhor jogador do Mundial de Clubes de 2012. Quem era?', o: ['Júlio César', 'Cássio', 'Dida', 'Rogério Ceni'], a: 1, hint: 'Ele fez defesas decisivas contra o Chelsea na final e virou ídolo imediato da torcida.' },
    ],
    sample: [
      { id: 'q_3c3869', q: 'Quem marcou o único gol da final do Mundial de Clubes de 2012?', o: ['Paolo Guerrero', 'Danilo', 'Paulinho', 'Emerson Sheik'], a: 0, hint: 'O peruano apareceu de cabeça no segundo tempo e decidiu o título em Yokohama.' },
      { id: 'q_d1f6d2', q: 'Qual atacante marcou os dois gols da vitória de 2 a 0 na volta da final da Libertadores 2012?', o: ['Jorge Henrique', 'Emerson Sheik', 'Romarinho', 'Paolo Guerrero'], a: 1, hint: 'Os dois gols saíram no Pacaembu e garantiram o primeiro título continental do clube.' },
      { id: 'q_9fca85', q: 'O Corinthians empatou a ida da final da Libertadores 2012 em 1 a 1 na Bombonera. Quem fez o gol de empate aos 84 minutos?', o: ['Romarinho', 'Danilo', 'Jorge Henrique', 'Liedson'], a: 0, hint: 'Ele havia chegado ao clube naquele ano vindo do futebol brasiliense e entrou no segundo tempo.' },
      { id: 'q_eede76', q: 'O Corinthians ganhou o primeiro Mundial de Clubes da FIFA, em 2000, batendo nos pênaltis qual outro clube brasileiro na final?', o: ['Palmeiras', 'Flamengo', 'São Paulo', 'Vasco da Gama'], a: 3, hint: 'A final foi no Maracanã e terminou 0 a 0 antes da decisão por pênaltis.' },
      { id: 'q_6b0475', q: 'Qual atacante argentino chegou ao Corinthians em janeiro de 2005 e ajudou o time a ganhar o Brasileirão daquele ano?', o: ['Carlos Tévez', 'Javier Saviola', 'Hernán Crespo', 'Sergio Agüero'], a: 0, hint: 'Ele veio do Boca Juniors na era da MSI e foi eleito o melhor jogador do campeonato.' },
      { id: 'q_7f0bf9', q: 'O Corinthians foi rebaixado da elite do futebol brasileiro apenas uma vez. Em que ano?', o: ['1998', '2002', '2007', '2013'], a: 2, hint: 'O clube voltou à primeira divisão já na temporada seguinte, como campeão da Série B.' },
      { id: 'q_67471f', q: 'Em que ano o Corinthians ganhou seu primeiro título do Campeonato Brasileiro?', o: ['1977', '1985', '1990', '1998'], a: 2, hint: 'A conquista veio numa final contra o São Paulo e encerrou uma longa espera nacional.' },
      { id: 'q_4d3e78', q: 'Qual meio-campista do Corinthians foi para o Tottenham em julho de 2013, meses depois de jogar a final do Mundial?', o: ['Paulinho', 'Ralf', 'Danilo', 'Renato Augusto'], a: 0, hint: 'Ele foi titular da seleção na Copa das Confederações de 2013 antes da transferência para a Inglaterra.' },
      { id: 'q_036480', q: 'Qual meio-campista do Corinthians dos anos 80 — médico formado e capitão do Brasil na Copa de 1982 — foi um dos criadores da Democracia Corintiana?', o: ['Casagrande', 'Biro-Biro', 'Zenon', 'Sócrates'], a: 3, hint: 'O movimento colocava decisões do clube em votação entre jogadores e funcionários, em plena ditadura militar.' },
      { id: 'q_c6f14b', q: 'A qualidade nas cobranças de falta rendeu a qual meia do Corinthians o apelido de “Pé de Anjo”?', o: ['Neto', 'Ricardinho', 'Marcelinho Carioca', 'Vampeta'], a: 2, hint: 'Ele é um dos maiores goleadores da história do clube e peça central dos títulos dos anos 90.' },
      { id: 'q_9c51fa', q: 'Qual jogador é o recordista de partidas pelo Corinthians, com mais de 800 jogos?', o: ['Cássio', 'Zé Maria', 'Wladimir', 'Luizinho'], a: 2, hint: 'O lateral-esquerdo defendeu o clube por treze anos e também participou da Democracia Corintiana.' },
      { id: 'q_a695f1', q: 'Qual veterano lateral-esquerdo brasileiro chegou ao Corinthians vindo do Fenerbahçe em janeiro de 2010?', o: ['Marcelo', 'Michel Bastos', 'Roberto Carlos', 'Júnior'], a: 2, hint: 'Ele já tinha sido campeão do mundo com a seleção em 2002 e passado uma década no Real Madrid.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem cadastro',
      tasterH: 'Quanto você sabe sobre o Corinthians?',
      tasterPh: 'Dez perguntas rápidas para medir o seu Ball IQ alvinegro.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Jogue o quiz do Corinthians',
      playSub: 'Toque em uma resposta para conferir — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do Corinthians — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do Corinthians',
      bandH: 'Acha que sabe tudo do Timão? Prove no aplicativo.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes em um só app. O aplicativo está em inglês.',
      alsoH: 'A mesma página em inglês',
      alsoP: 'Esta é a versão em português do nosso quiz do Corinthians. A original está aqui:',
      alsoLink: 'Corinthians quiz (English)',
      statsLine: (n, e, m, h) => `O Ball IQ tem ${n} perguntas do Corinthians — ${e} fáceis, ${m} médias e ${h} difíceis.`,
    },
  },
  {
    club: 'Palmeiras',
    slug: 'palmeiras',
    lang: 'pt',
    name: 'Palmeiras',
    h1: 'Quiz do Palmeiras',
    title: 'Quiz do Palmeiras — Perguntas do Verdão | Ball IQ',
    description:
      'Quiz gratuito do Palmeiras com respostas explicadas: as Libertadores de 1999, 2020 e 2021, Abel Ferreira, Ademir da Guia, Marcos e o Derby.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · 36 perguntas do Verdão · sem cadastro',
    playLabel: 'Jogar o quiz',
    intro: [
      'O Palmeiras é o clube dos números: o maior campeão brasileiro, três Libertadores e uma década recente que poucos times no continente conseguem igualar. Este quiz gratuito cobre tudo — a primeira Libertadores em 1999 com Scolari e Marcos, o bicampeonato continental de 2020 e 2021 sob Abel Ferreira, Ademir da Guia e o Palestra Itália, e o Derby contra o Corinthians.',
      'As perguntas ficam difíceis mesmo. Onde a história é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que dá para verificar.',
      'Cada resposta do conjunto do Palmeiras vem com uma explicação escrita, então errar também ensina alguma coisa.',
    ],
    faq: [
      { q: 'O quiz do Palmeiras é gratuito?', a: 'É. Dá para jogar aqui mesmo no navegador, sem cadastro e sem baixar nada. Todas as perguntas desta página são gratuitas.' },
      { q: 'Quais temas o quiz cobre?', a: 'História do clube e a fundação italiana, as Libertadores de 1999, 2020 e 2021, a era Abel Ferreira, Scolari, Marcos, Ademir da Guia, Rivaldo, Roberto Carlos, Gabriel Jesus, Endrick e o Derby Paulista. Vai do fácil ao realmente difícil.' },
      { q: 'De onde vêm as perguntas?', a: 'São escritas e verificadas à mão, nunca geradas automaticamente. Cada informação passa por duas checagens independentes antes de ser publicada, e quando algo não dá para confirmar, a pergunta não sai.' },
      { q: 'O aplicativo Ball IQ está em português?', a: 'Ainda não: esta página está em português, mas o aplicativo está em inglês. Estamos medindo o interesse antes de traduzir — se você chegou até aqui, já está ajudando a decidir.' },
    ],
    taster: [
      { id: 'q_51b42d', q: 'O Palmeiras é de qual cidade brasileira?', o: ['Rio de Janeiro', 'Belo Horizonte', 'São Paulo', 'Porto Alegre'], a: 2, hint: 'O clube fica na zona oeste da maior cidade do país, no bairro da Água Branca.' },
      { id: 'q_1dd920', en: 'Green and white', q: 'Quais são as cores tradicionais do Palmeiras?', o: ['Verde e branco', 'Vermelho e preto', 'Preto e branco', 'Azul e branco'], a: 0, hint: 'O verde rendeu ao time o apelido de Verdão, e as cores remetem à bandeira do país dos fundadores.' },
      { id: 'q_037a92', en: 'Italy', q: 'O Palmeiras foi fundado em 1914 por imigrantes de qual país?', o: ['Portugal', 'Espanha', 'Itália', 'Alemanha'], a: 2, hint: 'O clube se chamava Palestra Itália até 1942, quando a Segunda Guerra forçou a mudança de nome.' },
      { id: 'q_e762a7', q: 'Contra qual clube o Palmeiras disputa o Derby Paulista?', o: ['Santos', 'Grêmio', 'Flamengo', 'Corinthians'], a: 3, hint: 'É o clássico entre as duas maiores torcidas do estado de São Paulo, disputado desde 1917.' },
      { id: 'q_c9849c', q: 'Qual clube brasileiro o Palmeiras venceu por 2 a 1 na prorrogação na final da Libertadores de 2021?', o: ['Flamengo', 'Fluminense', 'Vasco da Gama', 'Internacional'], a: 0, hint: 'A final foi em Montevidéu, a primeira decisão entre dois brasileiros em jogo único no Uruguai.' },
      { id: 'q_851c7c', q: 'Abel Ferreira, o técnico do bicampeonato da Libertadores, é de qual país?', o: ['Uruguai', 'Argentina', 'Espanha', 'Portugal'], a: 3, hint: 'Ele chegou ao clube no fim de 2020 vindo do futebol grego e virou o técnico mais vitorioso da história do Palmeiras.' },
      { id: 'q_338ad1', q: 'Qual clube o Palmeiras venceu por 1 a 0 na final da Libertadores de 2020?', o: ['Corinthians', 'Santos', 'São Paulo', 'Fluminense'], a: 1, hint: 'Foi a primeira final da competição entre dois clubes de São Paulo, disputada no Maracanã.' },
      { id: 'q_befb9a', q: 'Qual atacante do Palmeiras finalmente se apresentou ao Real Madrid no meio de 2024, mais de 18 meses depois de acertar a transferência?', o: ['Estêvão', 'Luis Guilherme', 'Endrick', 'Gabriel Veron'], a: 2, hint: 'O acordo foi fechado quando ele tinha 16 anos, mas só pôde se mudar ao completar 18.' },
      { id: 'q_18ecb4', q: 'Qual goleiro passou toda a carreira profissional no Palmeiras e foi campeão do mundo com o Brasil em 2002?', o: ['Rogério Ceni', 'Dida', 'Marcos', 'Fernando Prass'], a: 2, hint: 'O São Marcos foi o herói da Libertadores de 1999 e titular na Copa do Japão e Coreia.' },
      { id: 'q_0bbb14', q: 'Quantas vezes o Palmeiras já havia ganhado a Libertadores antes da final de 2025?', o: ['1', '2', '3', '4'], a: 2, hint: 'Os títulos vieram em 1999, 2020 e 2021 — os dois últimos em temporadas consecutivas.' },
    ],
    sample: [
      { id: 'q_5b4737', q: 'Quem marcou o gol do Palmeiras na prorrogação da final da Libertadores de 2021?', o: ['Rony', 'Dudu', 'Raphael Veiga', 'Deyverson'], a: 3, hint: 'Ele aproveitou uma saída errada da defesa adversária e definiu a decisão em Montevidéu.' },
      { id: 'q_a5e8f1', q: 'Quem marcou o gol do Palmeiras nos acréscimos da final da Libertadores de 2020?', o: ['Rony', 'Luiz Adriano', 'Breno Lopes', 'Gabriel Veron'], a: 2, hint: 'Ele havia chegado ao clube poucos meses antes e entrou no segundo tempo da final no Maracanã.' },
      { id: 'q_d6d4fa', q: 'Qual clube colombiano o Palmeiras venceu nos pênaltis para ganhar sua primeira Libertadores, em 1999?', o: ['Atlético Nacional', 'Once Caldas', 'Deportivo Cali', 'América de Cali'], a: 2, hint: 'A ida terminou 1 a 0 para os colombianos e o Palmeiras virou em casa antes da decisão nos pênaltis.' },
      { id: 'q_216e84', q: 'Qual técnico levou o Palmeiras ao seu primeiro título da Libertadores, em 1999?', o: ['Vanderlei Luxemburgo', 'Luiz Felipe Scolari', 'Cuca', 'Tite'], a: 1, hint: 'Três anos depois ele seria campeão do mundo com a seleção brasileira.' },
      { id: 'q_e3ade0', q: 'O Palmeiras perdeu a Copa Intercontinental de 1999, em Tóquio, para qual clube europeu?', o: ['Juventus', 'Real Madrid', 'Bayern de Munique', 'Manchester United'], a: 3, hint: 'O adversário vinha de conquistar a tríplice coroa na Inglaterra naquela temporada.' },
      { id: 'q_dd20f5', q: 'Qual clube venceu o Palmeiras na final do Mundial de Clubes de 2021?', o: ['Chelsea', 'Liverpool', 'Bayern de Munique', 'Real Madrid'], a: 0, hint: 'A decisão foi em Abu Dhabi e terminou na prorrogação, com um pênalti convertido pelos ingleses.' },
      { id: 'q_d90f4f', q: 'Qual clube contratou Gabriel Jesus do Palmeiras em negociação anunciada em 2016?', o: ['Chelsea', 'Manchester City', 'Arsenal', 'Liverpool'], a: 1, hint: 'Ele se despediu do Palmeiras como campeão brasileiro antes de se apresentar na Inglaterra em janeiro seguinte.' },
      { id: 'q_4f4e06', en: 'They were relegated to Série B', q: 'O Palmeiras ganhou a Copa do Brasil de 2012. O que mais aconteceu com o clube na mesma temporada?', o: ['Chegou à final da Libertadores', 'Ganhou o Campeonato Paulista', 'Perdeu pontos por confusão da torcida', 'Foi rebaixado para a Série B'], a: 3, hint: 'A conquista do título nacional de copa e a queda para a segunda divisão aconteceram no mesmo ano.' },
      { id: 'q_38d6e3', q: 'Qual jogador, apelidado de “O Divino”, é o recordista de partidas pelo Palmeiras?', o: ['Ademir da Guia', 'César Maluco', 'Marcos', 'Dudu'], a: 0, hint: 'Ele defendeu o clube de 1961 a 1977 e é considerado o maior ídolo da sua história.' },
      { id: 'q_d9a8d0', en: 'Paraguay', q: 'Gustavo Gómez, capitão de longa data do Palmeiras, joga por qual seleção?', o: ['Uruguai', 'Colômbia', 'Argentina', 'Paraguai'], a: 3, hint: 'O zagueiro chegou em 2018 vindo do Milan e virou capitão nas duas conquistas da Libertadores.' },
      { id: 'q_c18c31', q: 'O Palmeiras fez um recorde de pontos do clube em Brasileirões de 38 rodadas em 2022. Quantos somou?', o: ['73', '77', '81', '85'], a: 2, hint: 'O time terminou a competição com quinze pontos de vantagem sobre o segundo colocado.' },
      { id: 'q_dbd1f0', q: 'Roberto Carlos saiu do Palmeiras em 1995 para qual clube?', o: ['Juventus', 'AC Milan', 'Internazionale', 'Real Madrid'], a: 2, hint: 'Ele passou apenas uma temporada na Itália antes da transferência que o levou a Madrid.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem cadastro',
      tasterH: 'Quanto você sabe sobre o Palmeiras?',
      tasterPh: 'Dez perguntas rápidas para medir o seu Ball IQ alviverde.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Jogue o quiz do Palmeiras',
      playSub: 'Toque em uma resposta para conferir — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do Palmeiras — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do Palmeiras',
      bandH: 'Acha que sabe tudo do Verdão? Prove no aplicativo.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes em um só app. O aplicativo está em inglês.',
      alsoH: 'A mesma página em inglês',
      alsoP: 'Esta é a versão em português do nosso quiz do Palmeiras. A original está aqui:',
      alsoLink: 'Palmeiras quiz (English)',
      statsLine: (n, e, m, h) => `O Ball IQ tem ${n} perguntas do Palmeiras — ${e} fáceis, ${m} médias e ${h} difíceis.`,
    },
  },
];

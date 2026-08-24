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
    statLine: 'Grátis · Perguntas do Flamengo com respostas explicadas · sem cadastro',
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
      alsoP: 'Esta é a versão em português do nosso quiz do Flamengo. A original, em inglês, está aqui:',
      alsoLink: 'Flamengo quiz (English)',
      statsLine: 'As perguntas do Flamengo no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
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
    statLine: 'Grátis · Perguntas do Timão com respostas explicadas · sem cadastro',
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
      statsLine: 'As perguntas do Corinthians no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
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
    statLine: 'Grátis · Perguntas do Verdão com respostas explicadas · sem cadastro',
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
      statsLine: 'As perguntas do Palmeiras no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
    },
  },
  // ── BENFICA ────────────────────────────────────────────────────────────────
  // ⚠️ EUROPEAN Portuguese, not Brazilian. Flamengo, Corinthians and Palmeiras
  // above are written in Brazilian register on purpose ("goleiro", "técnico",
  // "torcida"). Benfica's readers are in Portugal and say "guarda-redes",
  // "treinador", "adeptos", "golo", "equipa". Writing this page in the same
  // Brazilian voice as the ones above would read as foreign to exactly the
  // audience it is built for — the same per-market argument that made
  // Portuguese a separate file from Spanish in the first place.
  //
  // Chosen because Benfica carries the deepest verified English pack of any
  // club in a Portuguese-speaking market, and no /pt/ page existed for the
  // three Portuguese giants at all — the market was served only in Brazil.
  {
    club: 'Benfica',
    slug: 'benfica',
    lang: 'pt',
    name: 'Benfica',
    h1: 'Quiz do Benfica',
    title: 'Quiz do Benfica — Perguntas das Águias | Ball IQ',
    description:
      'Quiz gratuito do Benfica com respostas explicadas: as Taças dos Campeões de 1961 e 1962, Eusébio, a maldição de Guttmann e a Luz.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · Perguntas do Benfica com respostas explicadas · sem registo',
    playLabel: 'Jogar o quiz',
    intro: [
      'O clube com mais sócios do mundo merece um quiz à altura. Este é gratuito, feito para quem acompanha o Benfica a sério, e atravessa todo o arco da história encarnada — da equipa de Béla Guttmann que ganhou a Taça dos Campeões Europeus em 1961 e 1962 aos 38 campeonatos que nenhum rival alcançou.',
      'As perguntas são mesmo difíceis. Onde a história do Benfica é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que se consegue verificar.',
      'Cada resposta do conjunto do Benfica traz uma explicação escrita, por isso errar também ensina alguma coisa sobre como o clube ganhou o que ganhou — e sobre as finais europeias que lhe escaparam.',
    ],
    faq: [
      {
        q: 'O quiz do Benfica é gratuito?',
        a: 'É. Joga-se aqui mesmo no navegador, sem registo e sem instalar nada. Todas as perguntas desta página são gratuitas.',
      },
      {
        q: 'As perguntas são difíceis?',
        a: 'Há de tudo. As da amostra servem para aquecer; o conjunto completo vai até perguntas que só um adepto de longa data acerta — treinadores, finais europeias e recordes do clube.',
      },
      {
        q: 'As respostas vêm explicadas?',
        a: 'Vêm. Cada pergunta do Benfica traz uma explicação curta com a história por trás da resposta, para que errar valha alguma coisa.',
      },
      {
        q: 'O que é a maldição de Guttmann?',
        a: 'Béla Guttmann, o treinador húngaro que ganhou as duas Taças dos Campeões, saiu em 1962 após uma disputa salarial e terá dito que o Benfica não voltaria a ser campeão europeu durante cem anos. O clube perdeu todas as finais europeias desde então.',
      },
    ],
    taster: [
      { id: 'q_0a1c9f', en: 'Lisbon', q: 'Em que cidade joga o Benfica os seus jogos em casa?', o: ['Porto', 'Lisboa', 'Braga', 'Coimbra'], a: 1, hint: 'O Benfica tem sede em Lisboa, a capital de Portugal.' },
      { id: 'q_957cca', q: 'Como se chama o estádio do Benfica, reconstruído em 2003?', o: ['Estádio da Luz', 'Estádio do Dragão', 'Estádio José Alvalade', 'Estádio do Bessa'], a: 0, hint: 'O Benfica joga no Estádio da Luz, em Lisboa, reconstruído em 2003 a tempo do Euro 2004.' },
      { id: 'q_8e929d', en: 'Eagle', q: 'Que ave figura no emblema do Benfica e aparece como mascote nos dias de jogo?', o: ['Falcão', 'Águia', 'Gavião', 'Corvo'], a: 1, hint: 'Uma águia encima o emblema do Benfica, e uma águia verdadeira chamada Vitória voa antes dos jogos em casa.' },
      { id: 'q_0ee1f4', q: 'O Benfica disputa o dérbi de Lisboa, "O Dérbi", contra que clube?', o: ['Sporting CP', 'Porto', 'Boavista', 'Braga'], a: 0, hint: 'O Sporting CP é o rival de cidade do Benfica, e os encontros entre ambos são conhecidos simplesmente como o dérbi de Lisboa.' },
      { id: 'q_6d9217', q: 'Quem é o melhor marcador de sempre do Benfica?', o: ['Eusébio', 'Nené', 'José Águas', 'Nuno Gomes'], a: 0, hint: 'Eusébio marcou mais de 470 golos pelo Benfica entre 1961 e 1975, o recorde do clube.' },
      { id: 'q_c0ecc9', q: 'Que clube inglês contratou o avançado Darwin Núñez ao Benfica em 2022?', o: ['Arsenal', 'Manchester United', 'Liverpool', 'Newcastle'], a: 2, hint: 'O Liverpool contratou Darwin Núñez ao Benfica em junho de 2022, num negócio que podia ultrapassar os 80 milhões de libras.' },
      { id: 'q_480827', q: 'O defesa Rúben Dias saiu do Benfica em 2020 para que clube?', o: ['Chelsea', 'Manchester City', 'Paris Saint-Germain', 'Bayern Munique'], a: 1, hint: 'O Manchester City contratou Rúben Dias ao Benfica em 2020 e ele foi eleito o melhor jogador da época do clube.' },
      { id: 'q_eb91c9', q: 'João Félix saiu do Benfica em 2019 num negócio de 126 milhões de euros — que clube o contratou?', o: ['Manchester City', 'Atlético Madrid', 'Barcelona', 'Juventus'], a: 1, hint: 'O Atlético Madrid pagou ao Benfica um recorde do clube de 126 milhões de euros pelo jovem avançado, em 2019.' },
      { id: 'q_0a17c3', q: 'Enzo Fernández saiu do Benfica em janeiro de 2023 por um valor recorde em Inglaterra — que clube o contratou?', o: ['Chelsea', 'Liverpool', 'Manchester United', 'Arsenal'], a: 0, hint: 'O Chelsea pagou cerca de 106,8 milhões de libras, na altura um recorde no futebol inglês, para contratar Enzo Fernández ao Benfica.' },
    ],
    sample: [
      { id: 'q_194fcc', q: 'Que treinador húngaro levou o Benfica a duas Taças dos Campeões Europeus consecutivas, em 1961 e 1962?', o: ['Béla Guttmann', 'Gusztáv Sebes', 'Nándor Hidegkuti', 'Ferenc Puskás'], a: 0, hint: 'Béla Guttmann foi o arquiteto das vitórias do Benfica sobre o Barcelona e o Real Madrid, em 1961 e 1962.' },
      { id: 'q_d48b19', en: '100 years', q: 'A famosa "maldição de Guttmann" condenaria o Benfica a ficar sem troféus europeus durante quanto tempo?', o: ['50 anos', '100 anos', '25 anos', '200 anos'], a: 1, hint: 'Béla Guttmann terá declarado que o Benfica não voltaria a ser campeão europeu durante cem anos, após uma disputa salarial em 1962.' },
      { id: 'q_8939fc', q: 'Em que ano foi fundado o Benfica?', o: ['1904', '1893', '1920', '1911'], a: 0, hint: 'O Sport Lisboa e Benfica foi fundado a 28 de fevereiro de 1904, em Lisboa.' },
      { id: 'q_f09cc9', q: 'A fundação do Benfica em 1904 foi liderada por que homem, cujo nome o museu do clube hoje ostenta?', o: ['José Águas', 'Cosme Damião', 'Otto Glória', 'Vítor Baptista'], a: 1, hint: 'Cosme Damião, então com 18 anos, juntou o grupo de jovens entusiastas do desporto que fundou o clube em Belém, Lisboa, em fevereiro de 1904.' },
      { id: 'q_f7bc3f', en: 'The Sacred Monster', q: 'Mário Coluna, capitão do Benfica campeão europeu nos anos 60, era conhecido por que alcunha?', o: ['O Monstro Sagrado', 'A Pantera Negra', 'A Águia', 'O General'], a: 0, hint: 'Coluna era conhecido como "O Monstro Sagrado" e foi capitão das equipas que venceram a Taça dos Campeões em 1961 e 1962.' },
      { id: 'q_1a1a9e', q: 'O Benfica atravessou toda a época 1972-73 do campeonato sem perder, sob que treinador inglês?', o: ['Bobby Robson', 'Ronnie Allen', 'Jimmy Hagan', 'Malcolm Allison'], a: 2, hint: 'A equipa de Hagan venceu 28 e empatou 2 dos seus 30 jogos e marcou 101 golos — o primeiro título português conquistado sem derrotas.' },
      { id: 'q_f75533', q: 'Quem detém o recorde de jogos oficiais pelo Benfica, ao longo de 18 épocas entre 1968 e 1986?', o: ['Nené', 'Mário Coluna', 'Eusébio', 'Rui Costa'], a: 0, hint: 'Nené passou 18 anos no Benfica e detém o recorde de presenças de sempre do clube.' },
      { id: 'q_50e424', q: 'Sven-Göran Eriksson levou o Benfica à final da Taça dos Campeões de 1990, perdida por 1-0 frente a que clube?', o: ['AC Milan', 'Ajax', 'Real Madrid', 'Steaua Bucareste'], a: 0, hint: 'Um golo de Frank Rijkaard deu ao AC Milan a vitória por 1-0 sobre o Benfica de Eriksson, na final de 1990.' },
      { id: 'q_8d5ec9', q: 'O Benfica perdeu a final da Taça dos Campeões de 1988 nos penáltis, após um empate sem golos em Estugarda. Quem os venceu?', o: ['Steaua Bucareste', 'Estrela Vermelha', 'PSV Eindhoven', 'Ajax'], a: 2, hint: 'O PSV venceu o desempate por 6-5, completando uma tripla com a Eredivisie, a Taça da Holanda e a Taça dos Campeões.' },
      { id: 'q_c3c439', q: 'Que treinador italiano pôs fim a 11 anos sem campeonato ao conquistar o título de 2004-05?', o: ['Giovanni Trapattoni', 'Fabio Capello', 'Carlo Ancelotti', 'Marcello Lippi'], a: 0, hint: 'Giovanni Trapattoni deu ao Benfica o primeiro campeonato em 11 anos, em 2004-05.' },
      { id: 'q_a60235', q: 'O Benfica conquistou o seu 38.º campeonato em 2022-23 sob que treinador alemão?', o: ['Roger Schmidt', 'Julian Nagelsmann', 'Ralf Rangnick', 'Thomas Tuchel'], a: 0, hint: 'Roger Schmidt guiou o Benfica ao título da Primeira Liga de 2022-23 na sua primeira época no comando.' },
      { id: 'q_a90163', en: 'Sevilla', q: 'O Benfica perdeu a final da Liga Europa de 2014 nos penáltis frente a que clube espanhol?', o: ['Sevilha', 'Valência', 'Villarreal', 'Atlético Madrid'], a: 0, hint: 'O Sevilha venceu o Benfica por 4-2 nos penáltis, após uma final da Liga Europa de 2014 sem golos, em Turim.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem registo',
      tasterH: 'Quanto sabes sobre o Benfica?',
      tasterPh: 'Dez perguntas rápidas para medir o teu Ball IQ encarnado.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Joga o quiz do Benfica',
      playSub: 'Toca numa resposta para confirmar — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do Benfica — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do Benfica',
      bandH: 'Achas que sabes tudo do Benfica? Prova-o na aplicação.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes numa só aplicação. A aplicação está em inglês.',
      alsoH: 'A mesma página noutro idioma',
      statsLine: 'As perguntas do Benfica no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
    },
  },
  // ── SPORTING CP ────────────────────────────────────────────────────────────
  // European Portuguese, same reasoning as Benfica above.
  {
    club: 'Sporting CP',
    slug: 'sporting-cp',
    lang: 'pt',
    name: 'Sporting CP',
    h1: 'Quiz do Sporting',
    title: 'Quiz do Sporting — Perguntas dos Leões | Ball IQ',
    description:
      'Quiz gratuito do Sporting com respostas explicadas: os Cinco Violinos, a Taça das Taças de 1964, Figo, Ronaldo e o título de Amorim.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · Perguntas do Sporting com respostas explicadas · sem registo',
    playLabel: 'Jogar o quiz',
    intro: [
      'Um quiz à altura de Alvalade. É gratuito, feito para quem acompanha o Sporting a sério, e percorre todo o arco leonino — dos Cinco Violinos dos anos 40 à Taça das Taças de 1964, da formação que deu Figo, Ronaldo e Nani ao mundo até ao campeonato de Rúben Amorim que pôs fim a 19 anos de espera.',
      'As perguntas são mesmo difíceis. Onde a história do Sporting é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que se consegue verificar.',
      'Cada resposta traz uma explicação escrita, por isso errar também ensina alguma coisa — sobre a academia que exportou uma geração e sobre as noites europeias que Alvalade ainda recorda.',
    ],
    faq: [
      { q: 'O quiz do Sporting é gratuito?', a: 'É. Joga-se aqui mesmo no navegador, sem registo e sem instalar nada. Todas as perguntas desta página são gratuitas.' },
      { q: 'As perguntas são difíceis?', a: 'Há de tudo. As da amostra servem para aquecer; o conjunto completo chega a perguntas que só um adepto de longa data acerta — treinadores, finais europeias e recordes do clube.' },
      { q: 'As respostas vêm explicadas?', a: 'Vêm. Cada pergunta do Sporting traz uma explicação curta com a história por trás da resposta, para que errar valha alguma coisa.' },
      { q: 'Quem saiu da academia do Sporting?', a: 'A formação leonina deu ao futebol Luís Figo, Cristiano Ronaldo, Nani, Ricardo Quaresma e Bruno Fernandes, entre muitos outros. Em 2020 a academia passou a chamar-se Academia Cristiano Ronaldo.' },
    ],
    taster: [
      { id: 'q_22ae6d', q: 'Em que ano foi fundado o Sporting CP?', o: ['1898', '1902', '1906', '1911'], a: 2, hint: 'O Sporting Clube de Portugal foi fundado a 1 de julho de 1906, em Lisboa.' },
      { id: 'q_1103cc', en: 'Lisbon', q: 'Em que cidade tem sede o Sporting CP?', o: ['Porto', 'Braga', 'Lisboa', 'Coimbra'], a: 2, hint: 'O Sporting é um dos grandes clubes de Lisboa, a capital portuguesa.' },
      { id: 'q_c5e82f', en: 'The Lions', q: 'O Sporting é tradicionalmente conhecido pelo nome de que animal, retirado do seu emblema?', o: ['Os Dragões', 'Os Leões', 'As Águias', 'Os Lobos'], a: 1, hint: 'O leão rampante do emblema dá ao Sporting a alcunha de Os Leões; o Benfica são as Águias e o Porto os Dragões.' },
      { id: 'q_dc5fd1', en: 'Green and white', q: 'Quais são as cores tradicionais do equipamento principal do Sporting?', o: ['Vermelho e branco', 'Azul e branco', 'Verde e branco', 'Verde e preto'], a: 2, hint: 'O Sporting joga de camisola com arcos verdes e brancos, um visual adotado em 1928.' },
      { id: 'q_c1a8f5', q: 'Como se chama o estádio do Sporting, inaugurado em 2003?', o: ['Estádio da Luz', 'Estádio José Alvalade', 'Estádio do Dragão', 'Estádio do Bessa'], a: 1, hint: 'A casa do Sporting, inaugurada em 2003, é o Estádio José Alvalade; a Luz é do Benfica e o Dragão do Porto.' },
      { id: 'q_a951a9', en: 'The Big Three', q: 'Juntamente com o Benfica e o Porto, o Sporting forma que grupo no futebol português?', o: ['O Velho Clássico', 'Os Três Grandes', 'O Grand Slam', 'O Trio de Ferro'], a: 1, hint: 'Sporting, Benfica e Porto são conhecidos como Os Três Grandes do futebol português.' },
      { id: 'q_de09b7', q: 'O dérbi de Lisboa opõe o Sporting a que rival?', o: ['Porto', 'Benfica', 'Braga', 'Vitória de Guimarães'], a: 1, hint: 'O dérbi de Lisboa é Sporting-Benfica, o maior dérbi do futebol português.' },
      { id: 'q_bbb47c', q: 'Para que clube foi Luís Figo quando saiu do Sporting, em 1995?', o: ['Real Madrid', 'Barcelona', 'Juventus', 'Inter'], a: 1, hint: 'Figo saiu do Sporting para o Barcelona em 1995, após uma saga confusa que envolveu a Juventus e o Parma.' },
      { id: 'q_db95d5', q: 'Nani saiu do Sporting em 2007 para que clube?', o: ['Real Madrid', 'Manchester United', 'Chelsea', 'Valência'], a: 1, hint: 'Nani seguiu o caminho de Ronaldo do Sporting para o Manchester United, em 2007.' },
      { id: 'q_8a1dd8', q: 'Bruno Fernandes saiu do Sporting em janeiro de 2020 para que clube?', o: ['Manchester City', 'Manchester United', 'Tottenham', 'Liverpool'], a: 1, hint: 'O capitão do Sporting, Bruno Fernandes, assinou pelo Manchester United em janeiro de 2020.' },
    ],
    sample: [
      { id: 'q_d28d2e', q: 'Que treinador levou o Sporting ao campeonato de 2020-21, o primeiro em 19 anos, antes de mais tarde assinar pelo Manchester United?', o: ['Jorge Jesus', 'Rúben Amorim', 'José Peseiro', 'Leonardo Jardim'], a: 1, hint: 'Rúben Amorim venceu a Primeira Liga de 2020-21, o primeiro título do Sporting desde 2002, e mais tarde rumou ao Manchester United.' },
      { id: 'q_56bd55', q: 'Em 2020, o Sporting rebatizou a sua academia em honra de que antigo jogador?', o: ['Luís Figo', 'Cristiano Ronaldo', 'Paulo Futre', 'Fernando Peyroteo'], a: 1, hint: 'Em 2020 a academia passou a chamar-se Academia Cristiano Ronaldo, em honra do seu formando mais famoso.' },
      { id: 'q_e330e2', q: 'O estádio do Sporting, inaugurado em 2003, foi construído sobretudo para receber jogos de que torneio?', o: ['Mundial de 1998', 'Euro 2004', 'Jogos Olímpicos de 2004', 'Mundial de 2006'], a: 1, hint: 'O novo recinto do Sporting abriu em 2003 para receber jogos do Euro 2004, organizado por Portugal.' },
      { id: 'q_9dd62d', en: '1950s', q: 'O anterior estádio do Sporting, substituído pelo atual em 2003, abriu em que década?', o: ['Anos 30', 'Anos 50', 'Anos 60', 'Anos 70'], a: 1, hint: 'O antigo recinto do Sporting abriu em 1956 e serviu o clube até ser substituído em 2003.' },
      { id: 'q_7ff7f4', q: 'Como são normalmente chamados os adeptos do Sporting?', o: ['Culés', 'Sportinguistas', 'Merengues', 'Bhoys'], a: 1, hint: 'Os adeptos do Sporting são conhecidos como sportinguistas.' },
      { id: 'q_60bfb4', en: "Cup Winners' Cup", q: 'Que troféu europeu conquistou o Sporting em 1964?', o: ['Taça dos Campeões Europeus', 'Taça das Taças', 'Taça UEFA', 'Taça das Cidades com Feiras'], a: 1, hint: 'O Sporting ergueu a Taça das Taças em 1964, um grande troféu continental.' },
      { id: 'q_7b9266', q: 'Na campanha europeia de 1963-64, o Sporting registou uma vitória por 16-1 sobre que clube?', o: ['Atalanta', 'Anderlecht', 'APOEL', 'Panathinaikos'], a: 2, hint: 'O 16-1 do Sporting ao cipriota APOEL, em 1963-64, fixou durante décadas o recorde da maior vitória numa competição europeia.' },
      { id: 'q_28d9d0', en: 'CSKA Moscow', q: 'O Sporting chegou à final da Taça UEFA de 2005 no seu próprio estádio; quem os venceu por 3-1?', o: ['Zenit', 'CSKA Moscovo', 'Shakhtar Donetsk', 'Sevilha'], a: 1, hint: 'O Sporting vencia por 1-0 ao intervalo, mas perdeu a final da Taça UEFA de 2005 por 3-1 frente ao CSKA Moscovo, em Lisboa.' },
      { id: 'q_f4985a', q: 'O Sporting perdeu em casa por 5-0 a primeira mão dos oitavos da Liga dos Campeões de 2021-22 frente a que clube?', o: ['Chelsea', 'Manchester City', 'Liverpool', 'Arsenal'], a: 1, hint: 'O Manchester City goleou o Sporting por 5-0 em Lisboa, nos oitavos da Liga dos Campeões de 2021-22.' },
      { id: 'q_c23240', q: 'Quem é o melhor marcador de sempre do Sporting?', o: ['Eusébio', 'Fernando Peyroteo', 'Mário Jardel', 'Liédson'], a: 1, hint: 'Fernando Peyroteo marcou mais de 500 golos pelo Sporting entre 1937 e 1949, o recorde do clube.' },
      { id: 'q_42a43a', en: 'The Five Violins (Cinco Violinos)', q: 'Que alcunha foi dada à devastadora linha avançada do Sporting nos anos 40?', o: ['O Trio de Ouro', 'Os Cinco Violinos', 'A Máquina Verde', 'Os Leões de Lisboa'], a: 1, hint: 'O ataque de cinco homens do Sporting nos anos 40 ficou conhecido como os Cinco Violinos.' },
      { id: 'q_987562', q: 'Cristiano Ronaldo, que começou a carreira no Sporting, estreou-se num Campeonato do Mundo em que edição?', o: ['2002', '2006', '2010', '2014'], a: 1, hint: 'Ronaldo, formado no Sporting, jogou pela primeira vez num Campeonato do Mundo ao serviço de Portugal em 2006.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem registo',
      tasterH: 'Quanto sabes sobre o Sporting?',
      tasterPh: 'Dez perguntas rápidas para medir o teu Ball IQ leonino.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Joga o quiz do Sporting',
      playSub: 'Toca numa resposta para confirmar — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do Sporting — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do Sporting',
      bandH: 'Achas que sabes tudo do Sporting? Prova-o na aplicação.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes numa só aplicação. A aplicação está em inglês.',
      alsoH: 'A mesma página noutro idioma',
      statsLine: 'As perguntas do Sporting no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
    },
  },
  // ── PORTO ──────────────────────────────────────────────────────────────────
  {
    club: 'Porto',
    slug: 'porto',
    lang: 'pt',
    name: 'FC Porto',
    h1: 'Quiz do FC Porto',
    title: 'Quiz do FC Porto — Perguntas dos Dragões | Ball IQ',
    description:
      'Quiz gratuito do FC Porto com respostas explicadas: o calcanhar de Madjer em 1987, a Champions de Mourinho, Falcao e o Dragão.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · Perguntas do FC Porto com respostas explicadas · sem registo',
    playLabel: 'Jogar o quiz',
    intro: [
      'Um quiz à altura do Dragão. É gratuito, feito para quem acompanha o FC Porto a sério, e percorre todo o arco portista — do calcanhar de Madjer em Viena, em 1987, à Liga dos Campeões de José Mourinho em 2004 e ao quadruplo de André Villas-Boas em 2010-11.',
      'As perguntas são mesmo difíceis. Onde a história do Porto é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que se consegue verificar.',
      'Cada resposta traz uma explicação escrita, por isso errar também ensina alguma coisa — sobre os negócios que fizeram do Porto um clube exportador e sobre as noites europeias que os Dragões ainda contam.',
    ],
    faq: [
      { q: 'O quiz do FC Porto é gratuito?', a: 'É. Joga-se aqui mesmo no navegador, sem registo e sem instalar nada. Todas as perguntas desta página são gratuitas.' },
      { q: 'As perguntas são difíceis?', a: 'Há de tudo. As da amostra servem para aquecer; o conjunto completo chega a perguntas que só um adepto de longa data acerta — treinadores, finais europeias e transferências.' },
      { q: 'As respostas vêm explicadas?', a: 'Vêm. Cada pergunta do FC Porto traz uma explicação curta com a história por trás da resposta, para que errar valha alguma coisa.' },
      { q: 'Que troféus europeus tem o FC Porto?', a: 'O Porto venceu a Taça dos Campeões Europeus em 1987, a Liga dos Campeões em 2004, a Taça UEFA em 2003 e a Liga Europa em 2011 — além da Taça Intercontinental em 1987 e 2004.' },
    ],
    taster: [
      { id: 'q_7750ae', q: 'Uma semana depois da conquista da Liga dos Campeões de 2004, José Mourinho saiu do Porto para treinar que clube?', o: ['Real Madrid', 'Inter', 'Chelsea', 'Tottenham'], a: 2, hint: 'Mourinho assinou pelo Chelsea poucos dias depois de erguer a Liga dos Campeões de 2004 pelo Porto.' },
      { id: 'q_c81e9e', en: 'Seville', q: 'Em que cidade venceu o Porto o Celtic por 3-2 após prolongamento, na final da Taça UEFA de 2003?', o: ['Roterdão', 'Sevilha', 'Gotemburgo', 'Basileia'], a: 1, hint: 'O Porto venceu o Celtic em Sevilha, em 2003, no seu primeiro grande troféu europeu desde 1987.' },
      { id: 'q_b43106', q: 'A final da Liga Europa de 2011 foi a primeira final europeia entre dois clubes portugueses; que clube venceu o Porto por 1-0?', o: ['Benfica', 'Sporting CP', 'Braga', 'Vitória de Guimarães'], a: 2, hint: 'O Porto venceu o Braga por 1-0 em Dublin, em 2011, na primeira final europeia totalmente portuguesa.' },
      { id: 'q_a8ad48', q: 'Quem marcou o golo da vitória do Porto na final da Liga Europa de 2011, frente ao Braga?', o: ['Hulk', 'Radamel Falcao', 'Fredy Guarín', 'Silvestre Varela'], a: 1, hint: 'Falcao cabeceou o único golo frente ao Braga e decidiu a final de 2011.' },
      { id: 'q_bcd71e', q: 'Que treinador levou o Porto a um quadruplo em 2010-11 — campeonato, taça, Supertaça e Liga Europa?', o: ['André Villas-Boas', 'José Mourinho', 'Sérgio Conceição', 'Jesualdo Ferreira'], a: 0, hint: 'André Villas-Boas conquistou todos os quatro troféus disponíveis na sua única época completa no comando.' },
      { id: 'q_493de0', q: 'Quem é o melhor marcador de sempre do Porto, com 355 golos pelo clube?', o: ['Mário Jardel', 'Fernando Gomes', 'Radamel Falcao', 'Hulk'], a: 1, hint: 'Fernando Gomes marcou 355 golos pelo Porto e conquistou duas Botas de Ouro europeias nos anos 80.' },
      { id: 'q_ece329', q: 'Que inglês conquistou dois campeonatos seguidos pelo Porto, em 1995 e 1996, e era apelidado de "Bobby Five-O"?', o: ['Terry Venables', 'Roy Hodgson', 'Bobby Robson', 'Bobby Charlton'], a: 2, hint: 'Bobby Robson ganhou a alcunha "Five-O" pelas frequentes goleadas por 5-0 do Porto, antes de rumar ao Barcelona.' },
      { id: 'q_e3d1f1', q: 'Radamel Falcao foi vendido pelo Porto em 2011 para que clube?', o: ['Manchester United', 'Atlético Madrid', 'Chelsea', 'Mónaco'], a: 1, hint: 'Falcao saiu do Porto para o Atlético Madrid em 2011, antes da posterior transferência para o Mónaco.' },
      { id: 'q_a482ca', en: 'Monaco', q: 'James Rodríguez saiu do Porto em 2013 para assinar por que clube?', o: ['Real Madrid', 'Mónaco', 'Bayern Munique', 'Everton'], a: 1, hint: 'James saiu do Porto para o Mónaco em 2013, um ano antes de a sua explosão internacional lhe valer o Real Madrid.' },
      { id: 'q_089b03', q: 'Deco saiu do Porto em 2004, pouco depois da Liga dos Campeões, para que clube?', o: ['Chelsea', 'Real Madrid', 'Barcelona', 'Inter'], a: 2, hint: 'Deco assinou pelo Barcelona em 2004, depois de brilhar na conquista da Liga dos Campeões pelo Porto.' },
    ],
    sample: [
      { id: 'q_021447', en: 'Backheel', q: 'Na final da Taça dos Campeões de 1987 frente ao Bayern Munique, Rabah Madjer marcou o seu icónico empate com que tipo de remate?', o: ['De cabeça', 'De calcanhar', 'De bicicleta', 'Em mergulho'], a: 1, hint: 'O improvisado toque de calcanhar de Madjer, aos 77 minutos da final de 1987 em Viena, tornou-se um dos golos mais famosos do Porto.' },
      { id: 'q_b93383', q: 'De quem foi o golo nos descontos em Old Trafford, em 2004, que eliminou o Manchester United e desencadeou a corrida de Mourinho na linha lateral?', o: ['Costinha', 'Deco', 'Benni McCarthy', 'Maniche'], a: 0, hint: 'Costinha aproveitou a defesa incompleta de Tim Howard a um livre de McCarthy e apurou o Porto no último minuto.' },
      { id: 'q_f6d8d2', q: 'Quem marcou o golo decisivo do Porto no prolongamento da final da Taça UEFA de 2003, frente ao Celtic?', o: ['Deco', 'Dmitri Alenichev', 'Derlei', 'Capucho'], a: 2, hint: 'O golo de Derlei no prolongamento decidiu a vitória por 3-2 sobre o Celtic, em Sevilha.' },
      { id: 'q_bcaeb5', en: 'Went unbeaten all season', q: 'O que conseguiu a equipa do Porto de André Villas-Boas na Primeira Liga de 2010-11?', o: ['Venceu todos os jogos', 'Ficou invicta toda a época', 'Marcou 100 golos no campeonato', 'Não sofreu golos em casa'], a: 1, hint: 'O Porto conquistou o título de 2010-11 sem perder um jogo, com 27 vitórias e 3 empates.' },
      { id: 'q_b358d1', q: 'Em que época marcou Mário Jardel uns notáveis 54 golos em todas as competições pelo Porto?', o: ['1996-97', '1998-99', '1999-2000', '2001-02'], a: 2, hint: 'Jardel apontou 54 golos em todas as provas na campanha do Porto de 1999-2000.' },
      { id: 'q_746d86', q: 'A venda recorde do Porto levou que avançado para o Zenit de São Petersburgo por cerca de 60 milhões de euros, em 2012?', o: ['Hulk', 'Radamel Falcao', 'James Rodríguez', 'Lisandro López'], a: 0, hint: 'O avançado brasileiro Hulk saiu do Porto para o Zenit por cerca de 60 milhões de euros, em 2012.' },
      { id: 'q_9fc260', q: 'Que jogador, então com 16 anos, se estreou pelo Barcelona no particular de 2003 que inaugurou o Estádio do Dragão?', o: ['Andrés Iniesta', 'Cesc Fàbregas', 'Lionel Messi', 'Bojan Krkić'], a: 2, hint: 'Um adolescente Lionel Messi entrou pelo Barcelona no jogo de inauguração do Dragão, em novembro de 2003.' },
      { id: 'q_dc786e', q: 'O recorde de 58 jogos sem perder do Porto na Primeira Liga aconteceu entre que anos?', o: ['1994-1996', '2003-2005', '2010-2012', '2020-2022'], a: 3, hint: 'O Porto esteve 58 jogos do campeonato sem perder, de novembro de 2020 a abril de 2022 (47 vitórias e 11 empates), batendo o recorde português do Benfica.' },
      { id: 'q_c34d76', q: 'Que central do Porto seguiu Mourinho para o Chelsea em 2004 e mais tarde assinou pelo Real Madrid?', o: ['Jorge Costa', 'Ricardo Carvalho', 'Pepe', 'Bruno Alves'], a: 1, hint: 'Ricardo Carvalho saiu do Porto para o Chelsea juntamente com Mourinho, em 2004.' },
      { id: 'q_93cd47', q: 'Quem marcou o segundo golo do Porto e foi eleito homem do jogo na final da Liga dos Campeões de 2004?', o: ['Carlos Alberto', 'Deco', 'Dmitri Alenichev', 'Costinha'], a: 1, hint: 'Deco marcou e foi eleito homem do jogo na vitória por 3-0 na final frente ao Mónaco.' },
      { id: 'q_1badc7', q: 'Que extremo passou do Barcelona para o Porto como parte do negócio de Deco, em 2004?', o: ['Anderson', 'Ricardo Quaresma', 'Pepe', 'Lucho González'], a: 1, hint: 'Ricardo Quaresma trocou o Barcelona pelo Porto como moeda de troca na transferência de Deco, em 2004.' },
      { id: 'q_b7fe90', q: 'O cabeceamento vitorioso de Falcao na final da Liga Europa de 2011 surgiu de um cruzamento de que médio?', o: ['João Moutinho', 'Fredy Guarín', 'Hulk', 'James Rodríguez'], a: 1, hint: 'O colombiano Fredy Guarín cruzou para o cabeceamento vitorioso do compatriota Falcao, frente ao Braga.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem registo',
      tasterH: 'Quanto sabes sobre o FC Porto?',
      tasterPh: 'Dez perguntas rápidas para medir o teu Ball IQ portista.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Joga o quiz do FC Porto',
      playSub: 'Toca numa resposta para confirmar — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do FC Porto — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do FC Porto',
      bandH: 'Achas que sabes tudo do Porto? Prova-o na aplicação.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes numa só aplicação. A aplicação está em inglês.',
      alsoH: 'A mesma página noutro idioma',
      statsLine: 'As perguntas do FC Porto no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
    },
  },
  // ── SANTOS ─────────────────────────────────────────────────────────────────
  // BRAZILIAN register, like Flamengo/Corinthians/Palmeiras above — Santos is a
  // São Paulo club, so "pênalti", "técnico", "time", "você". Completes the
  // Portuguese market: three Brazilian giants + the three Portuguese giants.
  {
    club: 'Santos',
    slug: 'santos',
    lang: 'pt',
    name: 'Santos',
    h1: 'Quiz do Santos',
    title: 'Quiz do Santos — Perguntas do Peixe | Ball IQ',
    description:
      'Quiz gratuito do Santos com respostas explicadas: o time de Pelé bicampeão do mundo, o milésimo gol, os Meninos da Vila e Neymar.',
    kind: 'Quiz de clube',
    statLine: 'Grátis · Perguntas do Santos com respostas explicadas · sem cadastro',
    playLabel: 'Jogar o quiz',
    intro: [
      'O clube de Pelé merece um quiz à altura. Este é gratuito, feito para quem acompanha o Peixe de verdade, e percorre todo o arco santista — do time que venceu o mundo em 1962 e 1963 aos Meninos da Vila de cada geração: Diego e Robinho, Neymar e Ganso, Rodrygo.',
      'As perguntas ficam difíceis mesmo. Onde a história do Santos é disputada, preferimos deixar a pergunta de fora a escolher um lado. O que é publicado é o que dá para verificar.',
      'Cada resposta do conjunto do Santos vem com uma explicação escrita, então errar também ensina alguma coisa — sobre a Vila Belmiro, o milésimo gol e as noites de Libertadores.',
    ],
    faq: [
      { q: 'O quiz do Santos é gratuito?', a: 'É. Dá para jogar aqui mesmo no navegador, sem cadastro e sem baixar nada. Todas as perguntas desta página são gratuitas.' },
      { q: 'As perguntas são difíceis?', a: 'Tem de tudo. As da amostra servem para aquecer; o conjunto completo chega a perguntas que só um santista de longa data acerta — técnicos, finais continentais e o time dos anos 60.' },
      { q: 'As respostas vêm explicadas?', a: 'Vêm. Cada pergunta do Santos traz uma explicação curta com a história por trás da resposta, para que errar valha alguma coisa.' },
      { q: 'Quem são os Meninos da Vila?', a: 'É o nome dado às gerações formadas na base do Santos: o termo consagrou Diego e Robinho no título brasileiro de 2002 e voltou com Neymar, Ganso e depois Rodrygo. A Vila é a Vila Belmiro, o estádio do clube.' },
    ],
    taster: [
      { id: 'q_4f3d78', q: 'Em que ano o Santos FC foi fundado na cidade portuária de Santos?', o: ['1892', '1902', '1912', '1922'], a: 2, hint: 'O Santos Foot-Ball Club foi fundado em 14 de abril de 1912, numa reunião no clube Concórdia, por três desportistas da cidade.' },
      { id: 'q_442d42', q: 'Desde 1916 o Santos manda seus jogos num estádio compacto conhecido pelo nome do bairro ao redor. Qual é o estádio?', o: ['Morumbi', 'Vila Belmiro', 'Pacaembu', 'Canindé'], a: 1, hint: 'A Vila Belmiro abriu em 12 de outubro de 1916 e é um dos menores estádios usados por um grande clube brasileiro, com cerca de 16 mil lugares.' },
      { id: 'q_784db3', en: 'The Fish', q: 'O Santos é conhecido em todo o Brasil como "O Peixe". De onde vem o apelido?', o: ['O Peixe', 'O Tubarão', 'A Onda', 'A Baleia'], a: 0, hint: 'O clube fica no litoral paulista, ao lado do maior porto do Brasil — por isso torcida e imprensa chamam o time de Peixe há décadas.' },
      { id: 'q_c4b87b', q: 'O Santos disputa qual campeonato estadual, que já venceu mais de 20 vezes?', o: ['Campeonato Carioca', 'Campeonato Mineiro', 'Campeonato Gaúcho', 'Campeonato Paulista'], a: 3, hint: 'O Santos é do estado de São Paulo, então joga o Paulista — o Carioca é do Rio, o Mineiro de Minas e o Gaúcho do Rio Grande do Sul.' },
      { id: 'q_21e5fc', q: 'O Santos venceu o Mundial Interclubes de 1962 batendo o campeão europeu por 5 a 2 fora de casa, com três gols de Pelé. Qual era o clube?', o: ['Real Madrid', 'Benfica', 'AC Milan', 'Internazionale'], a: 1, hint: 'O Benfica, dono das Taças dos Campeões de 1961 e 1962, perdeu por 3 a 2 no Rio e depois por 5 a 2 no Estádio da Luz, onde Pelé marcou três.' },
      { id: 'q_dc912c', q: 'O milésimo gol da carreira de Pelé, em novembro de 1969 no Maracanã, saiu contra qual clube?', o: ['Botafogo', 'Fluminense', 'Vasco da Gama', 'Flamengo'], a: 2, hint: 'O Santos venceu o Vasco por 2 a 1 em 19 de novembro de 1969; Pelé converteu o pênalti contra o goleiro Edgardo Andrada.' },
      { id: 'q_50b55d', q: 'Em que ano Neymar deixou o Santos rumo ao futebol europeu?', o: ['2011', '2012', '2013', '2014'], a: 2, hint: 'O negócio foi anunciado em 25 de maio de 2013 e ele foi apresentado no Camp Nou em 3 de junho; o valor, divulgado como 57 milhões de euros, depois se revelou bem maior.' },
      { id: 'q_73b4d5', q: 'O Santos chegou à final do Mundial de Clubes de 2011, no Japão. Que time europeu venceu a decisão?', o: ['Manchester United', 'Barcelona', 'Inter de Milão', 'Real Madrid'], a: 1, hint: 'O Barcelona venceu por 4 a 0 em Yokohama, em 18 de dezembro de 2011. Messi fez dois e levou a Bola de Ouro do torneio.' },
      { id: 'q_26793d', q: 'Qual camisa 10 formou com Neymar a dupla celebrada do Santos campeão da Libertadores de 2011?', o: ['Oscar', 'Ganso', 'Lucas Moura', 'Philippe Coutinho'], a: 1, hint: 'Paulo Henrique Ganso vestia a 10 ao lado da 11 de Neymar; voltou de lesão para começar o segundo jogo da final de 2011.' },
      { id: 'q_a5661c', en: 'Diego and Robinho', q: 'O Brasileirão de 2002 do Santos foi puxado por dois adolescentes da base, saudados como novos "Meninos da Vila". Quem eram?', o: ['Neymar e Ganso', 'Diego e Robinho', 'Rodrygo e Gabigol', 'Kaká e Adriano'], a: 1, hint: 'Diego tinha 17 anos e Robinho 18, sob o comando de Emerson Leão; Robinho marcou no 3 a 2 do segundo jogo da final.' },
    ],
    sample: [
      { id: 'q_fdd5ec', q: 'Na final da Libertadores de 1962 o Santos se tornou o primeiro clube brasileiro a vencer a competição, num jogo de desempate contra o bicampeão. Qual clube?', o: ['Nacional', 'Peñarol', 'River Plate', 'Independiente'], a: 1, hint: 'O Peñarol havia vencido as duas primeiras edições, em 1960 e 1961; o Santos ganhou o desempate por 3 a 0 em Buenos Aires, com dois gols de Pelé.' },
      { id: 'q_347ee0', q: 'O Santos venceu a segunda Libertadores seguida em 1963, fechando o título fora de casa, na Argentina. Quem foi o rival da final?', o: ['River Plate', 'Independiente', 'Boca Juniors', 'Racing'], a: 2, hint: 'O Santos venceu o Boca por 3 a 2 no Maracanã e por 2 a 1 na Bombonera, com gols de Coutinho e Pelé em Buenos Aires.' },
      { id: 'q_2491ac', q: 'O Santos manteve o Mundial em 1963, precisando de um terceiro jogo para superar qual clube italiano?', o: ['Juventus', 'Internazionale', 'AC Milan', 'Fiorentina'], a: 2, hint: 'O Milan venceu a ida por 4 a 2 no San Siro; o Santos devolveu o 4 a 2 e levou o desempate no Maracanã por 1 a 0, com pênalti de Dalmo.' },
      { id: 'q_f66689', en: 'From a penalty', q: 'Como Pelé marcou o milésimo gol da carreira pelo Santos?', o: ['De pênalti', 'De cabeça', 'De bicicleta', 'De falta'], a: 0, hint: 'Clodoaldo o lançou, o zagueiro Fernando o derrubou na área, e o próprio Pelé cobrou o pênalti no fim do segundo tempo, contra Edgardo Andrada, no Maracanã.' },
      { id: 'q_60db17', q: 'Quem é o segundo maior artilheiro da história do Santos, atrás apenas de Pelé?', o: ['Coutinho', 'Pepe', 'Dorval', 'Mengálvio'], a: 1, hint: 'Pepe marcou 405 gols pelo Santos entre 1954 e 1969, a carreira inteira no clube; a esquerda forte rendeu o apelido de "Canhão da Vila".' },
      { id: 'q_d478c3', q: 'Qual técnico comandou o Santos durante toda a ascensão até o título mundial, dirigindo o clube de 1954 a 1966?', o: ['Vicente Feola', 'Lula', 'Aymoré Moreira', 'Zezé Moreira'], a: 1, hint: 'Lula — Luís Alonso Pérez — dirigiu o Santos de 1954 a 1966, o período mais vitorioso da história do clube.' },
      { id: 'q_601766', q: 'Pelé chegou ao Santos em 1956, aos 15 anos, levado por um ex-jogador da Seleção que o havia treinado em Bauru. Quem era?', o: ['Zizinho', 'Leônidas da Silva', 'Waldemar de Brito', 'Domingos da Guia'], a: 2, hint: 'Waldemar de Brito, que jogou a Copa de 1934 pelo Brasil, treinou Pelé em Bauru e o apresentou dizendo que aquele menino seria o melhor jogador do mundo.' },
      { id: 'q_f59624', q: 'O Santos encerrou 34 anos sem título nacional em 2002, com Robinho e Diego bem jovens no time. Quem caiu na final em dois jogos?', o: ['Corinthians', 'São Paulo', 'Palmeiras', 'Grêmio'], a: 0, hint: 'O Santos venceu o Corinthians por 2 a 0 e 3 a 2 sob Émerson Leão; o título nacional anterior era o Roberto Gomes Pedrosa de 1968.' },
      { id: 'q_d47030', q: 'Quem era o técnico quando o Santos voltou a vencer o Brasileirão em 2004?', o: ['Emerson Leão', 'Muricy Ramalho', 'Dorival Júnior', 'Vanderlei Luxemburgo'], a: 3, hint: 'O time de Vanderlei Luxemburgo fechou o campeonato de 46 rodadas com 89 pontos, três à frente do Atlético Paranaense.' },
      { id: 'q_98a4ac', q: 'Qual clube o Santos venceu na final da Libertadores de 2011?', o: ['Peñarol', 'Nacional', 'Boca Juniors', 'Independiente'], a: 0, hint: 'Empate sem gols no Centenário, em Montevidéu, e 2 a 1 no Pacaembu, com gols de Neymar e Danilo, sob Muricy Ramalho.' },
      { id: 'q_e08315', q: 'Neymar voltou ao Santos em janeiro de 2025. De qual clube ele saiu para voltar?', o: ['Al-Nassr', 'Paris Saint-Germain', 'Al-Hilal', 'Al-Ittihad'], a: 2, hint: 'Ele encerrou uma passagem marcada por lesões no Al-Hilal, clube saudita que havia defendido desde 2023, quando saiu do Paris Saint-Germain.' },
      { id: 'q_70aec1', q: 'O Santos foi rebaixado da Série A pela primeira vez na história ao fim de qual temporada?', o: ['2017', '2020', '2023', '2025'], a: 2, hint: 'A derrota em casa por 2 a 1 para o Fortaleza na última rodada, em dezembro de 2023, selou a queda; o clube venceu a Série B de 2024 e voltou de imediato.' },
    ],
    copy: {
      tasterEyebrow: 'Amostra grátis · Sem cadastro',
      tasterH: 'Quanto você sabe sobre o Santos?',
      tasterPh: 'Dez perguntas rápidas para medir o seu Ball IQ santista.',
      tasterNote: 'Perguntas de amostra — o quiz completo tem muitas mais.',
      playSection: 'Jogue o quiz do Santos',
      playSub: 'Toque em uma resposta para conferir — certo ou errado na hora, e a história por trás.',
      faqH: 'Quiz do Santos — Perguntas frequentes',
      aboutQ: 'Sobre o quiz do Santos',
      bandH: 'Acha que sabe tudo do Peixe? Prove no aplicativo.',
      bandP: 'Sequências, 1v1 ao vivo, um rating até 99 — e todos os quizzes em um só app. O aplicativo está em inglês.',
      alsoH: 'A mesma página em outro idioma',
      statsLine: 'As perguntas do Santos no Ball IQ vêm em três níveis — fáceis, médias e difíceis — todas com a resposta explicada.',
    },
  },
];

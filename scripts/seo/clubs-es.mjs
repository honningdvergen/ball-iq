// Spanish club pages — PILOT (one page: Boca Juniors).
//
// WHY THIS EXISTS
//
// Wave L put five South American clubs in the bank. Their fans search in
// Spanish: a Boca supporter types "quiz de Boca Juniors" and finds nothing of
// ours, because every page we have is in English. That is the strongest
// localisation case we have — and, importantly, the OPPOSITE of the US one we
// killed on 2026-07-29, where the search language was already English and the
// premise turned out to be false. Here the language genuinely differs.
//
// This is deliberately ONE page. Prove a Spanish page ranks and converts before
// building seventy of them.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Every entry below carries `id`, the id of the English question in
// src/questions.js it was translated from. That is not decoration:
//
//   1. It means this file asserts NO new facts. Each fact already passed the
//      three-stage forge (generate → examiner → skeptic) as an English
//      question. Translating preserves the fact; it cannot invent one. The
//      ZERO ERROR bar is met by construction rather than by another audit.
//   2. gen-seo-pages.mjs checks every id still resolves in the bank and throws
//      if one does not. So a future bank edit that deletes or re-ids a Boca
//      question fails the build instead of silently leaving this page quoting
//      something that no longer exists.
//
// If you correct an English question, correct its translation here in the same
// change. The id is the link between them.
//
// Spanish register: neutral-but-Rioplatense where the club's own vocabulary
// demands it (Superclásico, La Bombonera, el Xeneize, banda amarilla). Football
// terms follow Argentine usage — "arquero" not "portero", "técnico" not
// "entrenador" — because the audience this page is for says it that way.

export const CLUBS_ES = [
  {
    club: 'Boca Juniors',          // must match the `club` field in src/questions.js
    slug: 'boca-juniors',          // shared with the English page: /quiz/boca-juniors/
    lang: 'es',
    name: 'Boca Juniors',
    h1: 'Quiz de Boca Juniors',
    title: 'Quiz de Boca Juniors — Trivia de La Bombonera | Ball IQ',
    description:
      'Quiz gratis de Boca Juniors con respuestas explicadas: Riquelme, la era Bianchi, cuatro Libertadores en una década y el Superclásico.',
    // Hero copy.
    kind: 'Quiz de club',
    statLine: 'Gratis · 36 preguntas de Boca · sin registro',
    playLabel: 'Jugar el quiz',
    intro: [
      'Ningún club del mundo suena como Boca Juniors. La Bombonera no aplaude: late. Este quiz gratuito está hecho para los que saben por qué, y recorre todo el arco moderno del Xeneize — la era de Carlos Bianchi que dejó cuatro Copas Libertadores en ocho temporadas, Juan Román Riquelme como el último gran enganche, las Intercontinentales de 2000 y 2003 ante Real Madrid y Milan, y el Superclásico que paraliza a un país.',
      'Las preguntas se ponen difíciles de verdad. Donde la historia de Boca está en disputa — y hay tramos que lo están, incluido el resultado de la final de 2012, que fuentes serias reportan de dos maneras distintas — preferimos dejar la pregunta afuera antes que elegir un bando. Sale publicado lo que se puede verificar.',
      'Cada respuesta del set de Boca trae una explicación escrita, así que una respuesta errada igual te enseña algo sobre cómo Boca ganó lo que ganó.',
    ],
    faq: [
      {
        q: '¿El quiz de Boca Juniors es gratis?',
        a: 'Sí. Se juega acá mismo en el navegador, sin registro y sin descargar nada. Todas las preguntas de esta página son gratuitas.',
      },
      {
        q: '¿Qué temas cubre?',
        a: 'Historia del club, la era Bianchi, las Libertadores de 2000, 2001, 2003 y 2007, las Intercontinentales ante Real Madrid y Milan, Riquelme, Palermo, Tevez, el Superclásico y los récords del club. Va de fácil a realmente difícil.',
      },
      {
        q: '¿De dónde salen las preguntas?',
        a: 'Están escritas y verificadas a mano, nunca generadas automáticamente. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale.',
      },
      {
        // The honest disclosure. It is also the single most useful thing this
        // pilot can measure: if people bounce here, the answer to "should we
        // localise?" is "not until the app is localised too".
        q: '¿La aplicación Ball IQ está en español?',
        a: 'Todavía no: esta página está en español, pero la app está en inglés. Estamos midiendo el interés antes de traducirla — si llegaste hasta acá, ya nos estás ayudando a decidirlo.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_2044e1', q: '¿En qué ciudad tiene su sede Boca Juniors?', o: ['Rosario', 'Córdoba', 'Buenos Aires', 'La Plata'], a: 2, hint: 'Su cancha está en un barrio portuario y obrero del sur de la capital argentina, cerca de la desembocadura del Riachuelo.' },
      { id: 'q_6b43ae', q: 'Boca disputa el Superclásico, el clásico más feroz del fútbol argentino, ¿contra qué club?', o: ['Independiente', 'River Plate', 'Racing Club', 'San Lorenzo'], a: 1, hint: 'Los dos clubes nacieron alrededor del barrio de La Boca antes de que el rival se mudara al norte, a Núñez; el partido encabeza casi siempre las listas de los clásicos más intensos del mundo.' },
      // `en` because the answer is translated prose, not a proper noun — see
      // the answer-key guard in gen-seo-pages.mjs. It is the tripwire that
      // fires if the English answer is ever reworded.
      { id: 'q_b84bda', en: 'Blue with a yellow band', q: '¿Cuáles son los colores tradicionales de Boca Juniors?', o: ['Azul con banda amarilla', 'Rojo y blanco a rayas', 'Blanco y negro a rayas', 'Todo blanco'], a: 0, hint: 'La banda horizontal sobre una camiseta oscura es una de las más reconocibles del fútbol, y el club usa alguna versión de ella desde principios del siglo XX.' },
      { id: 'q_1b9a6a', q: '¿Qué número 10 se convirtió en el ídolo moderno de Boca, ganando la Libertadores en 2000, 2001 y 2007?', o: ['Pablo Aimar', 'Juan Román Riquelme', 'Ariel Ortega', "Andrés D'Alessandro"], a: 1, hint: 'Entre sus dos etapas en Boca pasó cinco años en España, y fue elegido Futbolista Sudamericano del Año en 2001.' },
      { id: 'q_40804a', q: '¿Qué leyenda argentina volvió a Boca Juniors en 1995 y terminó ahí su carrera como jugador?', o: ['Diego Maradona', 'Gabriel Batistuta', 'Ariel Ortega', 'Hernán Crespo'], a: 0, hint: 'Tras un paso por Newell’s Old Boys y una suspensión de 15 meses por doping, siguió jugando en La Bombonera hasta 1997 — una segunda etapa después de la primera, en 1981-82.' },
      { id: 'q_7826d7', q: 'Boca le ganó 2-1 en Tokio a un gigante europeo para quedarse con la Intercontinental de 2000. ¿A cuál?', o: ['Bayern Múnich', 'Manchester United', 'Juventus', 'Real Madrid'], a: 3, hint: 'Roberto Carlos descontó para el campeón de Europa, pero Boca ya había marcado dos veces en los primeros seis minutos.' },
      { id: 'q_2b7c8d', q: '¿Qué delantero surgió en Boca a principios de los 2000 antes de jugar en West Ham, Manchester United y Manchester City?', o: ['Sergio Agüero', 'Javier Saviola', 'Carlos Tevez', 'Ángel Di María'], a: 2, hint: 'Fue Futbolista Sudamericano del Año tres años seguidos desde 2003, y volvió a Boca dos veces más, en 2015 y 2018.' },
      { id: 'q_ab95c1', q: '¿Qué técnico dirigió la época dorada de Boca, ganando la Libertadores en 2000, 2001 y 2003?', o: ['Alfio Basile', 'Carlos Bianchi', 'Miguel Ángel Russo', 'Julio César Falcioni'], a: 1, hint: 'Apodado “El Virrey”, ya había ganado la edición de 1994 con Vélez Sarsfield y es el único técnico que levantó el trofeo cuatro veces.' },
      { id: 'q_11b9e7', q: '¿Qué delantero es el máximo goleador histórico de Boca Juniors, con 236 goles?', o: ['Guillermo Barros Schelotto', 'Rodrigo Palacio', 'Martín Palermo', 'Marcelo Delgado'], a: 2, hint: 'Hizo los dos goles de la final de la Intercontinental 2000 y superó la vieja marca del club de Roberto Cherro, de 221.' },
      { id: 'q_e0b7f5', q: 'Boca ganó cuatro Copas Libertadores en una misma década. ¿Cuál?', o: ['Los años 80', 'Los años 90', 'Los años 2000', 'Los años 2010'], a: 2, hint: 'Con dos técnicos distintos, Boca llegó a cinco finales continentales en esos diez años y ganó cuatro.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_7e0a06', q: 'Boca ganó la final de la Libertadores 2000 por penales, ¿contra qué club brasileño?', o: ['Palmeiras', 'São Paulo', 'Corinthians', 'Santos'], a: 0, hint: 'La serie terminó 2-2 en La Bombonera y 0-0 en el Morumbí; Boca convirtió después cuatro penales en la definición.' },
      { id: 'q_6c4945', q: '¿A qué club mexicano le ganó Boca por penales para retener la Libertadores en 2001?', o: ['Club América', 'Guadalajara', 'Tigres UANL', 'Cruz Azul'], a: 3, hint: 'El equipo mexicano participaba como invitado en el torneo sudamericano y perdió la definición 3-1 tras igualar la serie.' },
      { id: 'q_866922', q: 'Boca le ganó 5-1 en el global a un club brasileño en la final de la Libertadores 2003. ¿A cuál?', o: ['Santos', 'Grêmio', 'Cruzeiro', 'Internacional'], a: 0, hint: 'Revancha de la final de 1963: Boca ganó 2-0 de local y 3-1 en el Morumbí para sellar su quinta corona continental.' },
      { id: 'q_8ac161', q: '¿A qué club brasileño le ganó Boca 5-0 en el global en la final de la Libertadores 2007?', o: ['Flamengo', 'Grêmio', 'Fluminense', 'Atlético Mineiro'], a: 1, hint: 'Boca ganó 3-0 en La Bombonera y 2-0 en Porto Alegre; sigue siendo su título continental más reciente.' },
      { id: 'q_0bf6a2', q: 'Boca ganó la Intercontinental 2003 por penales, ¿contra qué campeón europeo?', o: ['Juventus', 'Porto', 'AC Milan', 'Ajax'], a: 2, hint: 'Los italianos erraron tres de sus cuatro penales en Yokohama después de que el partido terminara 1-1 tras el alargue.' },
      { id: 'q_b76e7b', q: '¿Qué presidente de Boca Juniors de los años 90 y 2000 llegó después a ser presidente de la Argentina?', o: ['Daniel Angelici', 'Jorge Amor Ameal', 'Juan Román Riquelme', 'Mauricio Macri'], a: 3, hint: 'Condujo el club durante su década más exitosa antes de entrar en política: jefe de gobierno de la capital en 2007 y presidente en 2015.' },
      { id: 'q_658f69', q: 'Boca es el único club que ganó dos Copas Sudamericanas consecutivas. ¿En qué dos años seguidos?', o: ['2002 y 2003', '2004 y 2005', '2006 y 2007', '2008 y 2009'], a: 1, hint: 'En la primera superó una final a doble partido ante un equipo boliviano; en la segunda ganó una definición por penales ante un rival mexicano.' },
      { id: 'q_5a1003', q: '¿Qué arquero colombiano ganó la Libertadores con Boca en 2000 y 2001?', o: ['Óscar Córdoba', 'René Higuita', 'Faryd Mondragón', 'David Ospina'], a: 0, hint: 'Estuvo en el club entre 1997 y 2001, jugó 118 partidos y fue elegido en el equipo ideal de América en 2000 y 2001.' },
      { id: 'q_b737ed', q: 'La revancha de la final de la Libertadores 2018, entre dos equipos argentinos, se mudó al exterior. ¿A qué estadio?', o: ['Camp Nou', 'Wembley', 'Stade de France', 'Santiago Bernabéu'], a: 3, hint: 'La CONMEBOL llevó el partido a Madrid en diciembre de 2018, después del ataque al micro de Boca en la fecha original.' },
      { id: 'q_f1501d', q: '¿Qué club colombiano le ganó a Boca por penales en la final de la Libertadores 2004?', o: ['Atlético Nacional', 'Once Caldas', 'Deportivo Cali', 'Millonarios'], a: 1, hint: 'El equipo de Manizales ganó la definición tras un 0-0 en la ida y un 1-1 en Colombia, y le negó a Boca el bicampeonato.' },
      { id: 'q_125693', q: '¿Qué arquero, apodado “El Pato”, ganó tres Libertadores con Boca entre 2000 y 2003?', o: ['Óscar Córdoba', 'Agustín Orion', 'Esteban Andrada', 'Roberto Abbondanzieri'], a: 3, hint: 'Estuvo en el club de 1996 a 2006 antes de pasar al Getafe, donde ganó el Trofeo Zamora como mejor arquero de La Liga.' },
      { id: 'q_441a0b', q: 'Entre 1998 y 1999 Boca marcó un récord argentino de partidos locales invicto consecutivos. ¿Cuántos?', o: ['28', '40', '33', '51'], a: 1, hint: 'La racha fue del Clausura 1998 al Clausura 1999 y rompió la marca de 39 que Racing Club tenía desde los años 60.' },
    ],
    // Spanish strings for the shared page furniture. Kept here rather than in
    // the generator so a second Spanish page is a data edit, not a code edit.
    copy: {
      tasterEyebrow: 'Muestra gratis · Sin registro',
      tasterH: '¿Cuánto sabés de Boca Juniors?',
      tasterPh: 'Diez preguntas rápidas para medir tu Ball IQ de Boca.',
      tasterNote: 'Preguntas de muestra — el quiz completo tiene muchas más.',
      playSection: 'Jugá el quiz de Boca Juniors',
      playSub: 'Tocá una respuesta para comprobarla — correcto o incorrecto al instante, y la historia detrás.',
      faqH: 'Quiz de Boca Juniors — Preguntas frecuentes',
      aboutQ: 'Sobre el quiz de Boca Juniors',
      bandH: '¿Te creés que sabés de Boca? Demostralo en la app.',
      bandP: 'Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.',
      alsoH: 'La misma página en inglés',
      alsoP: 'Esta página es la versión en español de nuestro quiz de Boca Juniors. La original, con las 36 preguntas, está acá:',
      alsoLink: 'Boca Juniors quiz (English)',
      statsLine: (n, e, m, h) => `Ball IQ tiene ${n} preguntas de Boca Juniors — ${e} fáciles, ${m} medias y ${h} difíciles.`,
    },
  },
  {
    club: 'River Plate',
    slug: 'river-plate',
    lang: 'es',
    name: 'River Plate',
    h1: 'Quiz de River Plate',
    title: 'Quiz de River Plate — Trivia del Monumental | Ball IQ',
    description:
      'Quiz gratis de River Plate con respuestas explicadas: la era Gallardo, Madrid 2018, Francescoli, el descenso de 2011 y el Superclásico.',
    kind: 'Quiz de club',
    statLine: 'Gratis · 38 preguntas de River · sin registro',
    playLabel: 'Jugar el quiz',
    intro: [
      'River Plate tiene la historia más ganadora del fútbol argentino y también su cicatriz más famosa. Este quiz gratuito recorre las dos cosas: la era de Marcelo Gallardo, con la Libertadores de 2015 y la final de Madrid en 2018; Enzo Francescoli, Ortega, Aimar y Crespo; el Monumental como sede de la final del Mundial 78; y el descenso de 2011, que ningún hincha de River necesita que le expliquen.',
      'Las preguntas se ponen difíciles de verdad. Donde la historia está en disputa preferimos dejar la pregunta afuera antes que elegir un bando. Sale publicado lo que se puede verificar.',
      'Cada respuesta del set de River trae una explicación escrita, así que una respuesta errada igual te enseña algo.',
    ],
    faq: [
      {
        q: '¿El quiz de River Plate es gratis?',
        a: 'Sí. Se juega acá mismo en el navegador, sin registro y sin descargar nada. Todas las preguntas de esta página son gratuitas.',
      },
      {
        q: '¿Qué temas cubre?',
        a: 'Historia del club, la era Gallardo, las Libertadores de 2015 y 2018, la final de Madrid, la Intercontinental de 1986, Francescoli, Ortega, Aimar, Crespo, Enzo Fernández y Julián Álvarez, el descenso de 2011 y el Superclásico. Va de fácil a realmente difícil.',
      },
      {
        q: '¿De dónde salen las preguntas?',
        a: 'Están escritas y verificadas a mano, nunca generadas automáticamente. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale.',
      },
      {
        q: '¿La aplicación Ball IQ está en español?',
        a: 'Todavía no: esta página está en español, pero la app está en inglés. Estamos midiendo el interés antes de traducirla — si llegaste hasta acá, ya nos estás ayudando a decidirlo.',
      },
    ],
    taster: [
      { id: 'q_10164d', q: '¿En qué ciudad juega River Plate sus partidos de local?', o: ['Buenos Aires', 'Rosario', 'Córdoba', 'La Plata'], a: 0, hint: 'El club nació en la zona sur de la capital argentina antes de mudarse al norte, al barrio de Núñez.' },
      { id: 'q_fabe3e', q: '¿Con qué apodo se conoce universalmente al estadio de River Plate?', o: ['La Bombonera', 'El Cilindro', 'El Monumental', 'El Nuevo Gasómetro'], a: 2, hint: 'Inaugurado en 1938 en Núñez, es el estadio más grande de la Argentina y sede habitual de la selección.' },
      { id: 'q_d7a920', q: '¿Cuál es el apodo más conocido de River Plate?', o: ['Los Xeneizes', 'Los Millonarios', 'La Academia', 'El Ciclón'], a: 1, hint: 'Viene de los fichajes récord de los años 30, cuando el club pagó cifras inéditas para el fútbol argentino de la época.' },
      { id: 'q_b8bd5c', en: 'Red', q: 'La camiseta clásica de River Plate es blanca con una banda diagonal de qué color?', o: ['Azul', 'Verde', 'Negro', 'Rojo'], a: 3, hint: 'La banda cruzada es uno de los diseños más reconocibles del fútbol mundial y el club la usa desde principios del siglo XX.' },
      { id: 'q_2e604b', q: 'El estadio de River Plate fue sede de la final de qué Mundial?', o: ['1962', '1970', '1978', '1986'], a: 2, hint: 'Argentina ganó ese torneo en casa, con la final decidida en el alargue en Núñez.' },
      { id: 'q_cf8ae3', q: '¿Quién era el técnico de River Plate cuando ganaron la Libertadores de 2018?', o: ['Ramón Díaz', 'Marcelo Gallardo', 'Daniel Passarella', 'Matías Almeyda'], a: 1, hint: 'Ex jugador del club, dirigió a River entre 2014 y 2021 y ganó dos Libertadores en ese ciclo.' },
      { id: 'q_9d64f5', q: '¿A qué selección representó Enzo Francescoli, el gran enganche de River Plate?', o: ['Chile', 'Paraguay', 'Colombia', 'Uruguay'], a: 3, hint: 'El Príncipe ganó dos Copas América con su país y tuvo dos etapas en River, separadas por años en Francia e Italia.' },
      { id: 'q_6d06ff', q: 'River Plate toma su nombre del nombre en inglés de qué estuario sudamericano?', o: ['Paraná', 'Orinoco', 'Magdalena', 'Río de la Plata'], a: 3, hint: 'El club se fundó en 1901 cerca del puerto de Buenos Aires, y el nombre quedó en inglés desde entonces.' },
      { id: 'q_95f56c', q: '¿A qué enganche de River Plate le decían “El Burrito”?', o: ['Pablo Aimar', "Andrés D'Alessandro", 'Ariel Ortega', 'Ignacio Fernández'], a: 2, hint: 'Jugó cuatro etapas distintas en el club y fue parte del equipo que ganó la Libertadores de 1996.' },
      { id: 'q_9bf97c', q: '¿A qué club mexicano le ganó River Plate para quedarse con la Libertadores de 2015?', o: ['Cruz Azul', 'Club América', 'Monterrey', 'Tigres UANL'], a: 3, hint: 'La ida en México terminó 0-0 y River definió la serie en el Monumental.' },
    ],
    sample: [
      { id: 'q_472c59', q: '¿En qué año descendió River Plate por primera vez en su historia?', o: ['2005', '2008', '2011', '2014'], a: 2, hint: 'Fue por el sistema de promoción, y el club volvió a Primera al año siguiente.' },
      { id: 'q_7af50d', q: '¿Qué club cordobés le ganó a River Plate la promoción que lo mandó a la segunda división?', o: ['Belgrano', 'Instituto', 'Talleres', 'Racing de Córdoba'], a: 0, hint: 'Ganó 2-0 la ida en Córdoba y el 1-1 en el Monumental alcanzó para dejar a River afuera.' },
      { id: 'q_747765', q: '¿Quién dirigió a River Plate en la segunda división, después de retirarse como jugador para tomar el cargo?', o: ['Leonardo Astrada', 'Matías Almeyda', 'Ramón Díaz', 'Américo Gallego'], a: 1, hint: 'Era jugador del plantel cuando aceptó el banco, y logró el ascenso en su primera temporada como técnico.' },
      { id: 'q_ca9fff', q: '¿En qué estadio se jugó finalmente la revancha de la final de la Libertadores 2018 entre River y Boca?', o: ['Santiago Bernabéu', 'Camp Nou', 'Estádio da Luz', 'Wanda Metropolitano'], a: 0, hint: 'La CONMEBOL llevó el partido a Madrid en diciembre de 2018, y River ganó 3-1 en el alargue.' },
      { id: 'q_89f6ca', q: '¿Qué delantero de River Plate marcó en los dos partidos de la final de la Libertadores 2018?', o: ['Ignacio Scocco', 'Rafael Santos Borré', 'Lucas Pratto', 'Gonzalo Martínez'], a: 2, hint: 'El Oso había llegado desde São Paulo ese mismo año y empató el partido en Madrid.' },
      { id: 'q_1f64a0', q: '¿Quién puso a River Plate 2-1 arriba a los 109 minutos de la revancha de la final 2018?', o: ['Lucas Pratto', 'Gonzalo Martínez', 'Exequiel Palacios', 'Juan Fernando Quintero'], a: 3, hint: 'El colombiano entró en el segundo tiempo y definió con un remate desde afuera del área en el alargue.' },
      { id: 'q_77be68', q: '¿Qué jugador de River Plate fue elegido Futbolista Sudamericano del Año en 2018?', o: ['Gonzalo Martínez', 'Juan Fernando Quintero', 'Franco Armani', 'Lucas Pratto'], a: 0, hint: 'El Pity cerró la final de Madrid con el tercer gol, ya en el arco vacío, y se fue a la MLS poco después.' },
      { id: 'q_c4c63f', q: '¿Qué arquero, incorporado en enero de 2018, atajó en la Libertadores que River ganó ese año?', o: ['Franco Armani', 'Marcelo Barovero', 'Germán Lux', 'Augusto Batalla'], a: 0, hint: 'Llegó desde Atlético Nacional de Colombia y se convirtió en titular indiscutido casi de inmediato.' },
      { id: 'q_482b08', q: '¿A qué delantero le vendió River Plate al Real Madrid en enero de 2007?', o: ['Radamel Falcao', 'Javier Saviola', 'Fernando Cavenaghi', 'Gonzalo Higuaín'], a: 3, hint: 'Tenía 19 años cuando se fue a Madrid, donde terminó siendo el máximo goleador de una temporada de La Liga.' },
      { id: 'q_00320d', q: '¿Qué mediocampista de River Plate pasó al Benfica en 2022 y meses después al Chelsea por un récord británico?', o: ['Exequiel Palacios', 'Enzo Fernández', 'Santiago Simón', 'Nicolás De La Cruz'], a: 1, hint: 'Fue elegido mejor jugador joven del Mundial 2022 antes de que el Chelsea pagara la cifra récord en enero siguiente.' },
      { id: 'q_f18d00', q: 'Un brote de COVID-19 en mayo de 2021 dejó a River sin arqueros para un partido de Libertadores. ¿Qué jugador de campo atajó los 90 minutos?', o: ['Leonardo Ponzio', 'Javier Pinola', 'Jorge Carrascal', 'Enzo Pérez'], a: 3, hint: 'El mediocampista se puso los guantes contra Independiente Santa Fe y River ganó 2-1 sin poder hacer cambios.' },
      { id: 'q_240f35', q: '¿A qué campeón de Europa le ganó River Plate 1-0 en Tokio para llevarse la Intercontinental de 1986?', o: ['PSV Eindhoven', 'Aston Villa', 'Steaua București', 'Hamburgo'], a: 2, hint: 'El rival rumano venía de ganar la Copa de Europa por penales, y Antonio Alzamendi marcó el único gol del partido.' },
    ],
    copy: {
      tasterEyebrow: 'Muestra gratis · Sin registro',
      tasterH: '¿Cuánto sabés de River Plate?',
      tasterPh: 'Diez preguntas rápidas para medir tu Ball IQ de River.',
      tasterNote: 'Preguntas de muestra — el quiz completo tiene muchas más.',
      playSection: 'Jugá el quiz de River Plate',
      playSub: 'Tocá una respuesta para comprobarla — correcto o incorrecto al instante, y la historia detrás.',
      faqH: 'Quiz de River Plate — Preguntas frecuentes',
      aboutQ: 'Sobre el quiz de River Plate',
      bandH: '¿Te creés que sabés de River? Demostralo en la app.',
      bandP: 'Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.',
      alsoH: 'La misma página en inglés',
      alsoP: 'Esta página es la versión en español de nuestro quiz de River Plate. La original está acá:',
      alsoLink: 'River Plate quiz (English)',
      statsLine: (n, e, m, h) => `Ball IQ tiene ${n} preguntas de River Plate — ${e} fáciles, ${m} medias y ${h} difíciles.`,
    },
  },
];

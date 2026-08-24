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
    statLine: 'Gratis · Preguntas de Boca con respuestas explicadas · sin registro',
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
      alsoP: 'Esta página es la versión en español de nuestro quiz de Boca Juniors. La original, en inglés, está acá:',
      alsoLink: 'Boca Juniors quiz (English)',
      statsLine: 'Las preguntas de Boca Juniors en Ball IQ vienen en tres niveles — fáciles, medias y difíciles — y todas con la respuesta explicada.',
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
    statLine: 'Gratis · Preguntas de River con respuestas explicadas · sin registro',
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
      statsLine: 'Las preguntas de River Plate en Ball IQ vienen en tres niveles — fáciles, medias y difíciles — y todas con la respuesta explicada.',
    },
  },
  {
    "club": "Barcelona",
    "slug": "barcelona",
    "lang": "es",
    "name": "Barcelona",
    "h1": "Quiz del FC Barcelona",
    "title": "Quiz del FC Barcelona | Ball IQ",
    "description": "Pon a prueba tus conocimientos sobre el FC Barcelona: Cruyff, el Dream Team, Guardiola, Messi y la Remontada. Preguntas verificadas, juego inmediato.",
    "kind": "Quiz de club",
    "statLine": "De Joan Gamper a La Masia, de Wembley 92 a la Remontada del 6-1.",
    "playLabel": "Jugar el quiz",
    "intro": [
      "El Barcelona no es solo un club de fútbol: es un anuncio en un periódico de 1899, una masía del siglo XVIII convertida en cantera y una idea de juego que cambió el deporte. Este quiz recorre esa historia de principio a fin.",
      "Hay preguntas que casi todo el mundo acierta —Wembley 92, la Remontada del 6-1, el año de los seis títulos— y otras que separan al aficionado del culé de verdad: quién pagó a quién por el patrocinio de la camiseta, qué cayó al césped cuando volvió Figo, cuántos puntos hicieron falta para igualar el récord de LaLiga.",
      "Cada dato ha pasado un doble control antes de llegar aquí, y cada pregunta lleva una pista por si te quedas atascado. Los superlativos van fechados o anclados a una temporada concreta, para que no envejezcan mal.",
      "Juega, falla, aprende algo y vuelve a intentarlo. La Masia tampoco se construyó en un día."
    ],
    "faq": [
      {
        "q": "¿Hasta cuándo llegan las preguntas?",
        "a": "El quiz llega hasta la temporada 2025-26, incluido el título de Liga que el Barça selló en el Clásico de mayo de 2026. Los récords y las marcas históricas se anclan a una fecha o a una temporada concreta para que sigan siendo ciertos con el tiempo."
      },
      {
        "q": "¿Necesito registrarme para jugar?",
        "a": "No. Puedes empezar a jugar directamente desde esta página. La cuenta solo sirve para guardar tus resultados, competir con amigos y mantener viva tu racha diaria."
      },
      {
        "q": "¿Es muy difícil?",
        "a": "Hay de todo: preguntas que cualquier aficionado resolverá y otras pensadas para quien se sabe las alineaciones de memoria. Si te bloqueas, cada pregunta tiene una pista que te acerca sin regalarte la respuesta."
      },
      {
        "q": "¿De dónde salen los datos?",
        "a": "De fuentes públicas contrastadas. Cada pregunta pasa por dos revisiones antes de publicarse: una que comprueba el hecho y otra que intenta tumbarlo. Si no aguanta, no se publica."
      }
    ],
    "taster": [
      {
        "id": "q_af730a",
        "q": "En el Balón de Oro de 2010, los tres finalistas al mejor jugador del mundo eran TODOS del mismo club y de la misma cantera. ¿Qué tres jugadores?",
        "o": [
          "Messi, Xavi e Iniesta",
          "Messi, Villa y Pedro",
          "Xavi, Iniesta y Busquets",
          "Messi, Eto'o y Henry"
        ],
        "a": 0,
        "hint": "La Masia se convirtió en la primera cantera de la historia en colocar a los tres finalistas en un mismo año; Messi se llevó el premio por delante de Iniesta y Xavi.",
        "en": "Messi, Xavi and Iniesta"
      },
      {
        "id": "q_ae441e",
        "q": "El máximo goleador histórico del Barcelona acumuló la asombrosa cifra de 672 goles con el club. ¿Quién es?",
        "o": [
          "Lionel Messi",
          "César Rodríguez",
          "Luis Suárez",
          "Samuel Eto'o"
        ],
        "a": 0,
        "hint": "Los 672 goles de Messi entre 2004 y 2021 son un récord mundial con un solo club; los 232 de César Rodríguez habían sido el récord del club durante unos 57 años, hasta que Messi lo superó en 2012.",
        "en": "Lionel Messi"
      },
      {
        "id": "q_fefffb",
        "q": "El tridente MSN del Barcelona aterrorizó a Europa durante el triplete de 2015. ¿Qué trío formaba la MSN?",
        "o": [
          "Messi, Suárez y Neymar",
          "Messi, Sánchez y Neymar",
          "Messi, Silva y Neymar",
          "Messi, Suárez y Neymar Sr."
        ],
        "a": 0,
        "hint": "Messi, Suárez y Neymar combinaron un récord de 122 goles en 2014-15 y llevaron al Barça a su segundo triplete continental.",
        "en": "Messi, Suárez and Neymar"
      },
      {
        "id": "q_4ca3a1",
        "q": "¿Qué legendario neerlandés, tras brillar como jugador, volvió como entrenador del Barcelona y construyó el 'Dream Team' de principios de los años noventa?",
        "o": [
          "Johan Cruyff",
          "Louis van Gaal",
          "Frank Rijkaard",
          "Ronald Koeman"
        ],
        "a": 0,
        "hint": "Cruyff sentó las bases tácticas —la posesión, la falsa posición, la filosofía de La Masia— que Guardiola perfeccionaría después.",
        "en": "Johan Cruyff"
      },
      {
        "id": "q_57983e",
        "q": "¿Con qué nombre se conoce la cantera del Barcelona, de la que salieron Messi, Xavi, Iniesta, Puyol y Busquets, tomado de una vieja masía cercana al estadio?",
        "o": [
          "La Masia",
          "La Cantera",
          "La Fábrica",
          "La Cartuja"
        ],
        "a": 0,
        "hint": "'La Masia' significa 'la masía'; el edificio rústico (Can Planes, construido en 1702) junto al viejo Camp Nou alojó a jóvenes jugadores durante décadas. ('La Fábrica' es la cantera del Real Madrid.)",
        "en": "La Masia"
      },
      {
        "id": "q_4ccaed",
        "q": "En la final de la Liga de Campeones de 2006 en París, el Barcelona remontó para ganar 2-1 y levantar su segunda Copa de Europa. ¿A qué club inglés venció?",
        "o": [
          "Arsenal",
          "Chelsea",
          "Manchester United",
          "Liverpool"
        ],
        "a": 0,
        "hint": "El Barça ganó 2-1 a un Arsenal con diez, con goles de Eto'o y Belletti al final después de que Sol Campbell adelantara de cabeza a los ingleses.",
        "en": "Arsenal"
      },
      {
        "id": "q_f40cc1",
        "q": "¿Qué mediapunta brasileño reactivó al Barcelona a mediados de los años 2000 y fue elegido Mejor Jugador del Mundo de la FIFA en 2004 y en 2005?",
        "o": [
          "Rivaldo",
          "Ronaldinho",
          "Kaká",
          "Juninho Pernambucano"
        ],
        "a": 1,
        "hint": "La magia y la sonrisa de Ronaldinho iluminaron el Camp Nou: dos premios consecutivos al mejor del mundo y el Balón de Oro de 2005.",
        "en": "Ronaldinho"
      },
      {
        "id": "q_e355c3",
        "q": "Cuando Neymar dejó el Barcelona en 2017 por un récord mundial de 222 millones de euros, ¿a qué club fichó?",
        "o": [
          "Real Madrid",
          "Manchester City",
          "Paris Saint-Germain",
          "Juventus"
        ],
        "a": 2,
        "hint": "El PSG pagó su cláusula de rescisión en 2017 por 222 millones de euros, cifra que estableció el récord mundial de traspasos.",
        "en": "Paris Saint-Germain"
      },
      {
        "id": "q_255610",
        "q": "¿Qué central, hombre de un solo club, fue capitán del Barcelona de 2004 a 2014 y lo lideró durante la época dorada de Guardiola?",
        "o": [
          "Carles Puyol",
          "Gerard Piqué",
          "Rafael Márquez",
          "Éric Abidal"
        ],
        "a": 0,
        "hint": "Puyol, el defensa de la melena, fue el capitán inspirador del Barça durante una década y nunca jugó en otro club como profesional.",
        "en": "Carles Puyol"
      },
      {
        "id": "q_d4019e",
        "q": "¿De qué club fichó el Barcelona al delantero Luis Suárez en 2014, formando el trío MSN junto a Messi y Neymar?",
        "o": [
          "Ajax",
          "Atlético de Madrid",
          "Inter de Milán",
          "Liverpool"
        ],
        "a": 3,
        "hint": "Suárez llegó del Liverpool en 2014 y de inmediato se entendió con Messi y Neymar para llevar al Barça al triplete.",
        "en": "Liverpool"
      }
    ],
    "sample": [
      {
        "id": "q_61b861",
        "q": "¿Qué centrocampista, canterano de La Masia que pasó toda su carrera sénior en el Barcelona entre 2002 y 2018, marcó después el gol de la victoria de España en la final del Mundial de 2010?",
        "o": [
          "Xavi",
          "Sergio Busquets",
          "Andrés Iniesta",
          "Cesc Fàbregas"
        ],
        "a": 2,
        "hint": "Iniesta, barcelonista de toda la vida, se deslizaba por el centro del campo del Barcelona y firmó el gol de España en la prórroga de la final de 2010.",
        "en": "Andrés Iniesta"
      },
      {
        "id": "q_0cc96d",
        "q": "Johan Cruyff llegó al Barcelona como jugador en 1973 por una cifra récord mundial en aquel momento. ¿De qué club fichó?",
        "o": [
          "Ajax",
          "Feyenoord",
          "PSV Eindhoven",
          "Real Madrid"
        ],
        "a": 0,
        "hint": "Cruyff pasó del Ajax al Barça en 1973 e inspiró un célebre 5-0 en el Bernabéu aquella temporada.",
        "en": "Ajax"
      },
      {
        "id": "q_83f6b6",
        "q": "En la Liga de Campeones de 2020, reorganizada por la COVID, el Barcelona fue desmontado por el Bayern de Múnich en unos cuartos de final a partido único en Lisboa. ¿Cuál fue el resultado final?",
        "o": [
          "8-2 para el Bayern",
          "6-1 para el Bayern",
          "5-0 para el Bayern",
          "7-3 para el Bayern"
        ],
        "a": 0,
        "hint": "Thomas Müller marcó dos veces y Philippe Coutinho, cedido en el Bayern por el Barcelona, salió del banquillo para añadir otros dos el 14 de agosto de 2020.",
        "en": "8-2 to Bayern"
      },
      {
        "id": "q_2be7cb",
        "q": "El Barcelona jugó más de un siglo sin ningún patrocinador comercial en la parte delantera de la camiseta. Cuando por fin apareció un logo en 2006, el club hizo algo inaudito. ¿El qué?",
        "o": [
          "Cobró una cifra récord al patrocinador",
          "PAGÓ al patrocinador en lugar de cobrar",
          "Subastó el espacio entre los aficionados durante una temporada",
          "Dejó la camiseta en blanco e imprimió el logo en los pantalones"
        ],
        "a": 1,
        "hint": "El Barça pagaba a UNICEF alrededor de 1,5 millones al año por lucir su logo: el primer gran club que puso en el pecho a una organización benéfica y no a un pagador.",
        "en": "They PAID the sponsor instead of being paid"
      },
      {
        "id": "q_dc898d",
        "q": "¿Qué momento se considera el punto de inflexión que lanzó el dominio moderno del Barcelona, su PRIMERA Copa de Europa, conquistada en 1992?",
        "o": [
          "Un 4-0 al AC Milan en Atenas",
          "La falta de Ronald Koeman en la prórroga para ganar a la Sampdoria en Wembley",
          "Una victoria en los penaltis ante el Steaua de Bucarest",
          "La chilena de Rivaldo contra el Valencia"
        ],
        "a": 1,
        "hint": "El 'Dream Team' de Cruyff conquistó por fin Europa cuando Koeman fusiló una falta indirecta en el minuto 112 en Wembley.",
        "en": "Ronald Koeman's extra-time free kick to beat Sampdoria at Wembley"
      },
      {
        "id": "q_85d8f9",
        "q": "En 2017 el Barcelona firmó la mayor remontada de la historia de la Liga de Campeones, dando la vuelta a un 4-0 de la ida ante el PSG. ¿Quién marcó el caótico gol de la victoria en el descuento que puso el 6-1?",
        "o": [
          "Lionel Messi",
          "Luis Suárez",
          "Sergi Roberto",
          "Neymar"
        ],
        "a": 2,
        "hint": "Neymar se la puso y Sergi Roberto, que no era precisamente un goleador, la empujó en el minuto 95 para sellar 'La Remontada'.",
        "en": "Sergi Roberto"
      },
      {
        "id": "q_05c854",
        "q": "Cuando Luis Figo volvió al Camp Nou con la camiseta del Real Madrid, los enfurecidos aficionados del Barça lanzaron al césped un objeto que se hizo célebre. ¿Cuál?",
        "o": [
          "Un muñeco en llamas",
          "Una cabeza de cerdo cortada",
          "Una caja de petardos",
          "Una gallina viva"
        ],
        "a": 1,
        "hint": "El fichaje de Figo por el Madrid en 2000 lo convirtió en el 'Judas' del fútbol; durante el Clásico de noviembre de 2002 una cabeza de cochinillo cayó cerca de su banderín de córner.",
        "en": "A severed pig's head"
      },
      {
        "id": "q_4147b6",
        "q": "¿Qué delantero búlgaro, apodado 'El Pistolero', fue una estrella temperamental del Dream Team de Cruyff y ganó el Balón de Oro de 1994 estando en el Barça?",
        "o": [
          "Hristo Stoichkov",
          "Gheorghe Hagi",
          "Krasimir Balakov",
          "Emil Kostadinov"
        ],
        "a": 0,
        "hint": "Su carácter volcánico le llevó una vez a pisar el pie de un árbitro, lo que le costó una larga sanción; su pierna izquierda ayudó a ganar cuatro Ligas consecutivas en el Camp Nou.",
        "en": "Hristo Stoichkov"
      },
      {
        "id": "q_f56836",
        "q": "¿Quién fundó el FC Barcelona en 1899 poniendo un anuncio en un periódico para buscar jugadores, un hombre nacido en Suiza cuyo nombre se catalanizó con el tiempo?",
        "o": [
          "Joan Gamper",
          "Josep Sunyol",
          "Hans Krankl",
          "Ladislao Kubala"
        ],
        "a": 0,
        "hint": "Nacido como Hans Gamper en Winterthur, llegó a ser presidente del club en cinco etapas; el trofeo actual de pretemporada lleva su nombre.",
        "en": "Joan Gamper"
      },
      {
        "id": "q_4f7ca6",
        "q": "¿Qué significa literalmente el nombre 'Camp Nou' en catalán?",
        "o": [
          "La Catedral",
          "Campo Nuevo",
          "El Campo de los Sueños",
          "La Gran Tribuna"
        ],
        "a": 1,
        "hint": "Era el campo 'nuevo' (camp = campo, nou = nuevo) que sustituyó a Les Corts en 1957. La afición lo llamó 'el campo nuevo' con tanta insistencia que los socios acabaron votando para convertir Camp Nou en el nombre oficial del estadio.",
        "en": "New Field"
      },
      {
        "id": "q_46b80d",
        "q": "El 19 de noviembre de 2005, un jugador del Barcelona hizo algo tan brillante en el Bernabéu que hasta los aficionados del Real Madrid se levantaron a aplaudirle. ¿Quién?",
        "o": [
          "Ronaldinho",
          "Lionel Messi",
          "Samuel Eto'o",
          "Deco"
        ],
        "a": 0,
        "hint": "Ronaldinho marcó dos goles en jugadas individuales en un 3-0; después reconoció que ni siquiera se dio cuenta de que la afición rival le estaba ovacionando en pie.",
        "en": "Ronaldinho"
      },
      {
        "id": "q_ea8088",
        "q": "¿Cuántas veces ha ganado el Barcelona la Copa de Europa / Liga de Campeones a lo largo de su historia?",
        "o": [
          "Tres",
          "Cinco",
          "Siete",
          "Cuatro"
        ],
        "a": 1,
        "hint": "1992, 2006, 2009, 2011 y 2015: su último título llegó con Luis Enrique y el tridente MSN en Berlín.",
        "en": "Five"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Barça?",
      "tasterPh": "Prueba una pregunta antes de jugar",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Barça",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Preguntas frecuentes",
      "aboutQ": "¿De qué va el quiz del FC Barcelona?",
      "bandH": "¿Crees que sabes del Barça? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Barça. La original, en inglés, está aquí:",
      "alsoLink": "Barcelona quiz (English)",
      "statsLine": "De Joan Gamper a La Masia, de Wembley 92 a la Remontada del 6-1."
    }
  },
  {
    "club": "Sevilla",
    "slug": "sevilla",
    "lang": "es",
    "name": "Sevilla",
    "h1": "Quiz del Sevilla FC",
    "title": "Quiz del Sevilla FC — preguntas | Ball IQ",
    "description": "Kanouté, Palop, Monchi y las noches europeas. Pon a prueba tu Ball IQ con el quiz del Sevilla FC: Nervión, la Copa del Rey y el Gran Derbi.",
    "kind": "Quiz de club",
    "statLine": "De Eindhoven 2006 a Budapest 2023: el club de las noches europeas.",
    "playLabel": "Jugar el quiz",
    "intro": [
      "Fundado el 25 de enero de 1890, el Sevilla FC es uno de los clubes más antiguos del fútbol español, y también uno de los que mejor ha aprendido a ganar fuera de casa. Este quiz recorre esa historia desde Nervión hasta las finales continentales.",
      "Hay preguntas sobre el Ramón Sánchez-Pizjuán y el presidente que le da nombre, sobre el título de Liga de 1945-46 y sobre la primera Copa del Rey de 1935 ante el Sabadell. Y, por supuesto, sobre El Gran Derbi.",
      "La parte europea es la que separa al aficionado del erudito: Eindhoven 2006, Glasgow 2007, Turín 2014, Varsovia 2015, Basilea 2016, Colonia 2020 y Budapest 2023. Si sabes qué portero paró el penalti decisivo en Hungría, este quiz es tuyo.",
      "También aparecen los nombres que hicieron grande al club: Kanouté, Palop, Luís Fabiano, Dani Alves, Rakitić, Jesús Navas, Bacca, Banega, Antonio Puerta y el paso fugaz de Maradona en 1992-93."
    ],
    "faq": [
      {
        "q": "¿De qué va el quiz del Sevilla FC?",
        "a": "Cubre la historia del club desde su fundación en 1890 hasta la Liga Europa de 2023: estadio, apodos, títulos, entrenadores, fichajes y las finales europeas."
      },
      {
        "q": "¿Qué títulos europeos ha ganado el Sevilla?",
        "a": "La Copa de la UEFA en 2006 y 2007, y la Liga Europa en 2014, 2015, 2016, 2020 y 2023. También la Supercopa de Europa de 2006, tras ganar 3-0 al Barcelona en Mónaco."
      },
      {
        "q": "¿Hay que registrarse para jugar?",
        "a": "No. El quiz se juega gratis en el navegador. Si creas una cuenta guardarás tus resultados y podrás comparar tu Ball IQ con el de tus amigos."
      },
      {
        "q": "¿Es difícil?",
        "a": "Está pensado para que un sevillista se sienta como en casa y un aficionado neutral aprenda algo. Las preguntas van de lo básico (colores, rival de ciudad) a detalles de finales concretas."
      }
    ],
    "taster": [
      {
        "id": "q_f47bcc",
        "q": "¿En qué año se fundó el Sevilla FC, uno de los clubes de fútbol más antiguos de España?",
        "o": [
          "1890",
          "1905",
          "1878",
          "1923"
        ],
        "a": 0,
        "hint": "El Sevilla FC se fundó el 25 de enero de 1890, uno de los primerísimos clubes de España dedicados al fútbol.",
        "en": "1890"
      },
      {
        "id": "q_ee7066",
        "q": "¿Cuáles son los colores tradicionales de la primera equipación del Sevilla FC?",
        "o": [
          "Rojo y blanco",
          "Azul y blanco",
          "Todo rojo",
          "Azul celeste"
        ],
        "a": 0,
        "hint": "El Sevilla viste tradicionalmente camiseta blanca con detalles rojos, de ahí su identidad blanquirroja.",
        "en": "Red and white"
      },
      {
        "id": "q_d8e3a5",
        "q": "El Gran Derbi enfrenta al Sevilla con ¿qué gran rival de la ciudad?",
        "o": [
          "Real Betis",
          "Real Madrid",
          "Valencia",
          "Villarreal"
        ],
        "a": 0,
        "hint": "El derbi sevillano, El Gran Derbi, se disputa contra el vecino Real Betis.",
        "en": "Real Betis"
      },
      {
        "id": "q_274120",
        "q": "El Sevilla ganó 3-1 a ¿qué club inglés en la final de la Liga Europa de 2016?",
        "o": [
          "Liverpool",
          "Everton",
          "Tottenham Hotspur",
          "Aston Villa"
        ],
        "a": 0,
        "hint": "El Sevilla remontó para derrotar 3-1 al Liverpool en la final de 2016.",
        "en": "Liverpool"
      },
      {
        "id": "q_9133c7",
        "q": "¿Qué delantero internacional maliense se convirtió en icono del Sevilla y ganó el premio al Futbolista Africano del Año en 2007?",
        "o": [
          "Frédéric Kanouté",
          "Didier Drogba",
          "Samuel Eto'o",
          "El Hadji Diouf"
        ],
        "a": 0,
        "hint": "Frédéric Kanouté, nacido en Francia pero internacional con Malí, fue elegido Futbolista Africano del Año en 2007.",
        "en": "Frédéric Kanouté"
      },
      {
        "id": "q_b9f89b",
        "q": "Diego Maradona, que llegó a jugar en el Sevilla, ¿a qué selección representó?",
        "o": [
          "Argentina",
          "Brasil",
          "Uruguay",
          "Colombia"
        ],
        "a": 0,
        "hint": "Maradona fue el legendario capitán de Argentina, a la que llevó al título del Mundial de 1986.",
        "en": "Argentina"
      },
      {
        "id": "q_b9bcab",
        "q": "¿Qué entrenador llevó al Sevilla a tres Ligas Europa consecutivas en 2014, 2015 y 2016?",
        "o": [
          "Unai Emery",
          "Julen Lopetegui",
          "Juande Ramos",
          "Jorge Sampaoli"
        ],
        "a": 0,
        "hint": "Unai Emery ideó los tres triunfos europeos seguidos del Sevilla entre 2014 y 2016.",
        "en": "Unai Emery"
      },
      {
        "id": "q_007d35",
        "q": "El lateral ofensivo del Sevilla Dani Alves, ¿a qué selección representó a nivel internacional?",
        "o": [
          "Brasil",
          "Argentina",
          "Portugal",
          "Colombia"
        ],
        "a": 0,
        "hint": "Dani Alves, lateral derecho incansable en el Sevilla, fue durante años internacional con Brasil.",
        "en": "Brazil"
      },
      {
        "id": "q_4055f6",
        "q": "El estadio del Sevilla, inaugurado en 1958, lleva el nombre de ¿qué expresidente del club?",
        "o": [
          "Ramón Sánchez-Pizjuán",
          "Santiago Bernabéu",
          "Luis Casanova",
          "José Zorrilla"
        ],
        "a": 0,
        "hint": "El estadio Ramón Sánchez-Pizjuán honra al presidente que impulsó su construcción y que murió en 1956, dos años antes de la inauguración.",
        "en": "Ramón Sánchez-Pizjuán"
      },
      {
        "id": "q_869605",
        "q": "¿En qué temporada ganó el Sevilla su primer campeonato de Liga?",
        "o": [
          "1945-46",
          "1955-56",
          "1963-64",
          "1935-36"
        ],
        "a": 0,
        "hint": "El Sevilla se proclamó campeón de España en la temporada 1945-46.",
        "en": "1945-46"
      }
    ],
    "sample": [
      {
        "id": "q_af6698",
        "q": "El estadio del Sevilla y uno de los apodos del club proceden de ¿qué barrio de Sevilla?",
        "o": [
          "Nervión",
          "Triana",
          "Macarena",
          "Los Remedios"
        ],
        "a": 0,
        "hint": "El club está arraigado en el barrio de Nervión, lo que da a su afición el apodo de 'los nervionenses'.",
        "en": "Nervión"
      },
      {
        "id": "q_4c2057",
        "q": "El Sevilla ganó la final de la Copa de la UEFA de 2006 por 4-0 ante ¿qué club inglés?",
        "o": [
          "Middlesbrough",
          "Newcastle United",
          "Bolton Wanderers",
          "Charlton Athletic"
        ],
        "a": 0,
        "hint": "El Sevilla goleó 4-0 al Middlesbrough en la final de 2006 y ganó su primer gran título europeo.",
        "en": "Middlesbrough"
      },
      {
        "id": "q_934b13",
        "q": "La final de la Copa de la UEFA de 2007 fue un duelo español en el que el Sevilla ganó en los penaltis a ¿qué club?",
        "o": [
          "Espanyol",
          "Valencia",
          "Real Zaragoza",
          "Villarreal"
        ],
        "a": 0,
        "hint": "El Sevilla venció al Espanyol en los penaltis tras el 2-2 y retuvo la Copa de la UEFA en 2007.",
        "en": "Espanyol"
      },
      {
        "id": "q_3dc3b4",
        "q": "En la final de la Liga Europa de 2015, el Sevilla venció 3-2 a ¿qué club ucraniano?",
        "o": [
          "Dnipro",
          "Shakhtar Donetsk",
          "Dynamo Kyiv",
          "Metalist Kharkiv"
        ],
        "a": 0,
        "hint": "El Sevilla se impuso por 3-2 al Dnipro Dnipropetrovsk y levantó el título de 2015.",
        "en": "Dnipro"
      },
      {
        "id": "q_fc5174",
        "q": "En la final de la Liga Europa de 2020, el Sevilla ganó 3-2 a ¿qué club italiano?",
        "o": [
          "Inter de Milán",
          "AC Milan",
          "Juventus",
          "Nápoles"
        ],
        "a": 0,
        "hint": "El Sevilla venció 3-2 al Inter de Milán en la final de 2020, disputada en Alemania.",
        "en": "Inter Milan"
      },
      {
        "id": "q_5ca90b",
        "q": "El Sevilla ganó la final de la Liga Europa de 2023 ante ¿qué club italiano, en la tanda de penaltis?",
        "o": [
          "Roma",
          "Atalanta",
          "Lazio",
          "Fiorentina"
        ],
        "a": 0,
        "hint": "El Sevilla superó a la Roma en los penaltis tras el 1-1 de la final de 2023.",
        "en": "Roma"
      },
      {
        "id": "q_dd9354",
        "q": "El Sevilla ganó la Supercopa de Europa de 2006 por 3-0 ante ¿qué club, en Mónaco?",
        "o": [
          "Barcelona",
          "Real Madrid",
          "Valencia",
          "Chelsea"
        ],
        "a": 0,
        "hint": "El Sevilla venció 3-0 al Barcelona en Mónaco y se llevó la Supercopa de Europa de 2006.",
        "en": "Barcelona"
      },
      {
        "id": "q_cbece8",
        "q": "El Sevilla vendió al centrocampista Ivan Rakitić en 2014 a ¿qué club?",
        "o": [
          "Barcelona",
          "Real Madrid",
          "Bayern de Múnich",
          "Juventus"
        ],
        "a": 0,
        "hint": "Rakitić fichó por el Barcelona en 2014, donde llegó a ganar la Liga de Campeones.",
        "en": "Barcelona"
      },
      {
        "id": "q_fbf8c4",
        "q": "¿Qué extremo, producto de la cantera del Sevilla, formó parte de la selección española campeona del Mundial de 2010?",
        "o": [
          "Jesús Navas",
          "David Silva",
          "Pedro",
          "Santi Cazorla"
        ],
        "a": 0,
        "hint": "El canterano Jesús Navas ganó el Mundial de 2010 con España.",
        "en": "Jesús Navas"
      },
      {
        "id": "q_913cc4",
        "q": "Diego Maradona tuvo un breve paso por el Sevilla, ¿en qué periodo?",
        "o": [
          "1992-93",
          "1986-87",
          "1996-97",
          "1982-83"
        ],
        "a": 0,
        "hint": "Maradona jugó en el Sevilla en la temporada 1992-93, en una etapa breve y discreta.",
        "en": "1992-93"
      },
      {
        "id": "q_2e63bb",
        "q": "¿Quién fue el director deportivo de largo recorrido del Sevilla, célebre por su olfato en los fichajes durante el crecimiento del club?",
        "o": [
          "Monchi",
          "Txiki Begiristain",
          "Luis Campos",
          "Andrea Berta"
        ],
        "a": 0,
        "hint": "Ramón Rodríguez Verdejo, conocido como Monchi, forjó como director deportivo la fama del Sevilla en el mercado.",
        "en": "Monchi"
      },
      {
        "id": "q_8b9b18",
        "q": "¿Qué entrenador guio al Sevilla en sus dos Copas de la UEFA consecutivas de 2006 y 2007?",
        "o": [
          "Juande Ramos",
          "Unai Emery",
          "Joaquín Caparrós",
          "Manolo Jiménez"
        ],
        "a": 0,
        "hint": "Juande Ramos estaba al mando en las victorias consecutivas del Sevilla en la Copa de la UEFA de 2006 y 2007.",
        "en": "Juande Ramos"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Sevilla?",
      "tasterPh": "Elige una respuesta para empezar",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Sevilla",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Preguntas frecuentes",
      "aboutQ": "¿De qué va este quiz?",
      "bandH": "¿Crees que sabes del Sevilla? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Sevilla. La original, en inglés, está aquí:",
      "alsoLink": "Sevilla quiz (English)",
      "statsLine": "De Eindhoven 2006 a Budapest 2023: el club de las noches europeas."
    }
  },
  {
    "club": "Real Madrid",
    "slug": "real-madrid",
    "lang": "es",
    "name": "Real Madrid",
    "h1": "Quiz del Real Madrid",
    "title": "Quiz del Real Madrid — Trivia madridista | Ball IQ",
    "description": "Quiz gratis del Real Madrid con respuestas explicadas: las cinco primeras Copas de Europa, la Quinta del Buitre, los Galácticos y La Décima.",
    "kind": "Quiz de club",
    "statLine": "Gratis · Preguntas del Real Madrid con respuestas explicadas · sin registro",
    "playLabel": "Jugar el quiz",
    "intro": [
      "Ningún club ha convivido tanto tiempo con el listón tan alto como el Real Madrid. Este quiz gratuito está hecho para quien conoce la historia entera y no solo el último título: las cinco primeras Copas de Europa entre 1956 y 1960 con Di Stéfano, Puskás y Gento, el 7-3 de Hampden Park, la Quinta del Buitre y las cinco Ligas seguidas desde 1986, la era de los Galácticos y la volea de Zidane de 2002, La Décima de Lisboa en 2014 y los tres títulos europeos consecutivos entre 2016 y 2018.",
      "Las preguntas se ponen difíciles de verdad. Hay una para el gol de Mijatovic en Ámsterdam, otra para los 100 puntos de la Liga 2011-12 y otra para el rey que puso la corona en el escudo en 1920. Los datos van anclados a su momento: cuando un récord puede cambiar, la pregunta dice en qué temporada o en qué año se midió, para que la respuesta correcta siga siéndolo dentro de cinco años.",
      "Cada pregunta del set del Real Madrid trae una explicación escrita, así que fallar también enseña algo sobre cómo el Madrid ganó lo que ganó. Con quince Copas de Europa hasta 2024, hay bastante que explicar.",
      "Se juega aquí mismo, en el navegador, sin registro y sin descargar nada."
    ],
    "faq": [
      {
        "q": "¿El quiz del Real Madrid es gratis?",
        "a": "Sí. Se juega aquí mismo en el navegador, sin registro y sin descargar nada. Todas las preguntas de esta página son gratuitas."
      },
      {
        "q": "¿Qué temas cubre?",
        "a": "Historia del club, las cinco Copas de Europa consecutivas de 1956 a 1960, la Quinta del Buitre, la era de los Galácticos, La Décima de 2014, los tres títulos europeos seguidos de 2016 a 2018, el Bernabéu, los presidentes, los fichajes récord y el palmarés del club. Va de fácil a realmente difícil."
      },
      {
        "q": "¿De dónde salen las preguntas?",
        "a": "Están escritas y verificadas a mano, nunca generadas automáticamente. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale."
      },
      {
        "q": "¿La aplicación Ball IQ está en español?",
        "a": "Todavía no: esta página está en español, pero la app está en inglés. Estamos midiendo el interés antes de traducirla — si has llegado hasta aquí, ya nos estás ayudando a decidirlo."
      }
    ],
    "taster": [
      {
        "id": "q_4d89c7",
        "q": "En la final de 2014, el Real Madrid estaba a 90 segundos de perder «La Décima» ante el Atlético, hasta que un cabezazo en el minuto 93 la llevó a la prórroga. ¿Quién marcó ese gol salvador?",
        "o": [
          "Gareth Bale",
          "Cristiano Ronaldo",
          "Sergio Ramos",
          "Marcelo"
        ],
        "a": 2,
        "hint": "Sergio Ramos se elevó a un córner de Modric para poner el 1-1; el Madrid arrasó después en la prórroga para ganar 4-1 y conquistar por fin su décima corona europea, 12 años después de la novena.",
        "en": "Sergio Ramos"
      },
      {
        "id": "q_140c04",
        "q": "La Copa de Europa de 2002 del Real Madrid, «La Novena», se selló con un gol votado a menudo como el mejor de la historia de la Liga de Campeones. ¿Quién marcó aquella volea de zurda?",
        "o": [
          "Raúl",
          "Zinedine Zidane",
          "Roberto Carlos",
          "Luis Figo"
        ],
        "a": 1,
        "hint": "Enganchó un centro bombeado de Roberto Carlos en la frontal del área y lo voleó a la escuadra en Hampden Park para batir al Bayer Leverkusen.",
        "en": "Zinedine Zidane"
      },
      {
        "id": "q_be3cce",
        "q": "¿Qué lateral izquierdo brasileño, famoso en el Real Madrid por un libre directo que desafiaba a la física ante Francia en 1997, se pasó más de una década desbordando por la banda del Madrid?",
        "o": [
          "Marcelo",
          "Roberto Carlos",
          "Cafu",
          "Carlos Alberto"
        ],
        "a": 1,
        "hint": "El libre directo con efecto de Roberto Carlos, que se curvó de forma imposible hasta entrar en la portería, se hizo legendario; fue fijo de la era galáctica entre 1996 y 2007.",
        "en": "Roberto Carlos"
      },
      {
        "id": "q_332594",
        "q": "¿Qué «destructor» brasileño, apodado El Tanque, fue el ancla del centro del campo del Madrid en cuatro Ligas de Campeones junto a Modric y Kroos?",
        "o": [
          "Xabi Alonso",
          "Casemiro",
          "Fernando Redondo",
          "Claude Makelele"
        ],
        "a": 1,
        "hint": "Casemiro era el recuperador del célebre trío Modric-Kroos-Casemiro; se marchó al Manchester United en 2022, tras el triunfo europeo de 2021-22.",
        "en": "Casemiro"
      },
      {
        "id": "q_bba20a",
        "q": "Las victorias del Real Madrid en la Liga de Campeones de 2016, 2017 y 2018 lo convirtieron en el primer club de la era moderna en lograr ¿qué?",
        "o": [
          "Ganarla con un entrenador español",
          "Ganarla tres veces seguidas",
          "Ganarla sin perder un partido",
          "Ganarla sin encajar un gol"
        ],
        "a": 1,
        "hint": "El equipo de Zidane la levantó tres temporadas consecutivas: ningún club había ganado tres seguidas desde que la competición pasó a llamarse Liga de Campeones en 1992 (el Bayern fue el último en lograrlo, en la antigua Copa de Europa, entre 1974 y 1976).",
        "en": "Win three in a row"
      },
      {
        "id": "q_7accaa",
        "q": "¿Qué veterano centrocampista alemán, un metrónomo del pase fichado en 2014, se retiró tras la Liga de Campeones de 2024 del Madrid y se marchó en lo más alto?",
        "o": [
          "Mesut Özil",
          "Toni Kroos",
          "Sami Khedira",
          "Bastian Schweinsteiger"
        ],
        "a": 1,
        "hint": "Kroos ganó cinco Ligas de Campeones en el Madrid y se despidió en 2024, eligiendo retirarse en lugar de perseguir más títulos: una salida elegante y poco habitual.",
        "en": "Toni Kroos"
      },
      {
        "id": "q_0a308b",
        "q": "La victoria del Real Madrid ante el Liverpool en la final de la Liga de Campeones de 2018 en Kiev la iluminó una chilena espectacular desde el banquillo. ¿Quién la marcó?",
        "o": [
          "Karim Benzema",
          "Cristiano Ronaldo",
          "Gareth Bale",
          "Marco Asensio"
        ],
        "a": 2,
        "hint": "Gareth Bale salió y marcó una chilena espectacular, y después añadió un segundo gol, en el 3-1 que selló el tercer título consecutivo del Madrid.",
        "en": "Gareth Bale"
      },
      {
        "id": "q_7661e2",
        "q": "¿Qué exgaláctico centrocampista dirigió al Real Madrid hasta tres Ligas de Campeones consecutivas entre 2016 y 2018?",
        "o": [
          "Carlo Ancelotti",
          "Zinedine Zidane",
          "Rafael Benítez",
          "Santiago Solari"
        ],
        "a": 1,
        "hint": "Zinedine Zidane, héroe de la final de 2002 como jugador, volvió como entrenador y la ganó en cada una de sus tres primeras temporadas en el banquillo.",
        "en": "Zinedine Zidane"
      },
      {
        "id": "q_89bdc8",
        "q": "En 2009 el Real Madrid batió el récord mundial de traspasos para fichar a Cristiano Ronaldo. ¿De qué club llegó?",
        "o": [
          "Sporting CP",
          "Manchester United",
          "Juventus",
          "Manchester City"
        ],
        "a": 1,
        "hint": "Ronaldo llegó del Manchester United por unos 80 millones de libras, entonces récord mundial, tras seis años cargados de títulos en Old Trafford.",
        "en": "Manchester United"
      },
      {
        "id": "q_6d6fe3",
        "q": "A finales de 2024, ¿cuántas Copas de Europa / Ligas de Campeones había ganado el Real Madrid, un récord de la competición?",
        "o": [
          "13",
          "14",
          "15",
          "16"
        ],
        "a": 2,
        "hint": "Su victoria de 2024 ante el Borussia Dortmund en Wembley fue la decimoquinta, muy por delante de cualquier otro club.",
        "en": "15"
      }
    ],
    "sample": [
      {
        "id": "q_04c278",
        "q": "¿Qué centrocampista del Real Madrid ganó el Balón de Oro de 2018, poniendo fin a una década de dominio de Messi y Ronaldo?",
        "o": [
          "Toni Kroos",
          "Luka Modric",
          "Isco",
          "Marco Asensio"
        ],
        "a": 1,
        "hint": "El croata Luka Modric se llevó el premio de 2018 tras el triplete de Ligas de Campeones del Madrid y su camino hasta la final del Mundial.",
        "en": "Luka Modric"
      },
      {
        "id": "q_20922e",
        "q": "En 2003, en plena era de los Galácticos, el Real Madrid fichó del Manchester United a ¿qué centrocampista inglés?",
        "o": [
          "Steve McManaman",
          "David Beckham",
          "Michael Owen",
          "Jonathan Woodgate"
        ],
        "a": 1,
        "hint": "David Beckham llegó del Manchester United en 2003 y se convirtió en uno de los grandes fichajes galácticos.",
        "en": "David Beckham"
      },
      {
        "id": "q_2f1f5c",
        "q": "¿Qué delantero mexicano, célebre por sus definiciones acrobáticas de chilena, ganó varios Pichichis en el Real Madrid a finales de los años ochenta?",
        "o": [
          "Hugo Sánchez",
          "Jorge Valdano",
          "Iván Zamorano",
          "Emilio Butragueño"
        ],
        "a": 0,
        "hint": "Hugo Sánchez fue máximo goleador de LaLiga cuatro veces como jugador del Madrid y es famoso por marcar toda una temporada de goles a primer toque.",
        "en": "Hugo Sanchez"
      },
      {
        "id": "q_2c3b79",
        "q": "Junto a Cristiano Ronaldo en 2009, el Real Madrid fichó también del AC Milan a ¿qué brasileño ganador del Balón de Oro?",
        "o": [
          "Robinho",
          "Kaká",
          "Ronaldinho",
          "Alexandre Pato"
        ],
        "a": 1,
        "hint": "Kaká, Balón de Oro en 2007, llegó del AC Milan en el mismo verano de récords que trajo a Ronaldo al Madrid.",
        "en": "Kaka"
      },
      {
        "id": "q_c19fce",
        "q": "La racha de CINCO Copas de Europa consecutivas del Real Madrid (1956-60) se cerró con un demoledor 7-3 al Eintracht Frankfurt. Aquella noche dos jugadores madridistas marcaron sendos hat-tricks: ¿qué pareja fue?",
        "o": [
          "Di Stéfano y Puskás",
          "Gento y Kopa",
          "Di Stéfano y Gento",
          "Puskás y Rial"
        ],
        "a": 0,
        "hint": "Di Stéfano firmó tres y Puskás cuatro ante 127.000 espectadores en Hampden Park: sigue siendo la final de Copa de Europa con más goles y muchos la consideran la mejor final de la historia.",
        "en": "Di Stefano and Puskas"
      },
      {
        "id": "q_dc4abb",
        "q": "El Real Madrid fichó a Alfredo Di Stéfano en 1953 solo tras un extraño tira y afloja con un rival español que también había cerrado un acuerdo por él. ¿Qué club era?",
        "o": [
          "Barcelona",
          "Atlético de Madrid",
          "Valencia",
          "Athletic de Bilbao"
        ],
        "a": 0,
        "hint": "Dos clubes, uno de Colombia y otro de Argentina, reclamaban sus derechos; un mediador propuso repartírselo en temporadas alternas antes de que el Barcelona se retirara y el Madrid se lo quedara en exclusiva.",
        "en": "Barcelona"
      },
      {
        "id": "q_bd9e37",
        "q": "¿Qué rey de España concedió al club el título que llevó la corona real al escudo del Real Madrid en 1920?",
        "o": [
          "Juan Carlos I",
          "Alfonso XII",
          "Alfonso XIII",
          "Felipe VI"
        ],
        "a": 2,
        "hint": "Concedió el título de «Real» al club en junio de 1920; la corona se retiró brevemente con la República de 1931 y se restauró en 1941. Ojo: el rey que murió en 1885 es otro Alfonso.",
        "en": "Alfonso XIII"
      },
      {
        "id": "q_13ae58",
        "q": "¿Quién tiene el récord de partidos con el Real Madrid, con 741 encuentros entre 1994 y 2010?",
        "o": [
          "Iker Casillas",
          "Sergio Ramos",
          "Manuel Sanchís",
          "Raúl"
        ],
        "a": 3,
        "hint": "Raúl supera a Casillas (725) y a Sanchís (710); el capitán formado en la cantera ganó seis Ligas y tres Ligas de Campeones a lo largo de 16 temporadas.",
        "en": "Raul"
      },
      {
        "id": "q_b89a9a",
        "q": "Cristiano Ronaldo es el máximo goleador histórico del Real Madrid con unos 450 goles. ¿Quién ocupa el segundo puesto de esa lista?",
        "o": [
          "Raúl",
          "Karim Benzema",
          "Ferenc Puskás",
          "Hugo Sánchez"
        ],
        "a": 1,
        "hint": "Durante años el segundo puesto fue de Raúl, pero un francés se destapó en sus últimas temporadas y lo adelantó antes de marcharse a Arabia Saudí en 2023.",
        "en": "Karim Benzema"
      },
      {
        "id": "q_890e78",
        "q": "El estadio Santiago Bernabéu lleva el nombre de un hombre que sirvió al club como jugador y como presidente durante muchísimos años. ¿En qué década lo rebautizó el club en su honor?",
        "o": [
          "Los años 40",
          "Los años 50",
          "Los años 60",
          "Los años 70"
        ],
        "a": 1,
        "hint": "Inaugurado en 1947 como «Nuevo Estadio Chamartín», pasó a llamarse Santiago Bernabéu en 1955, cuando él seguía siendo presidente e impulsaba la época dorada del Madrid.",
        "en": "1950s"
      },
      {
        "id": "q_ed3c7d",
        "q": "El apodo del Real Madrid, «Los Merengues», ¿a qué aspecto del club se refiere?",
        "o": [
          "Sus celebraciones en las finales de copa",
          "Su equipación totalmente blanca",
          "La pastelería de un fundador",
          "La cúpula de su estadio"
        ],
        "a": 1,
        "hint": "Piensa en algo blanco y esponjoso como el merengue montado: el club lo viste desde sus primeros días, inspirado por el Corinthians inglés.",
        "en": "Their all-white kit"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Real Madrid?",
      "tasterPh": "Preguntas rápidas para medir tu Ball IQ madridista.",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Real Madrid",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Quiz del Real Madrid — Preguntas frecuentes",
      "aboutQ": "Sobre el quiz del Real Madrid",
      "bandH": "¿Crees que sabes del Real Madrid? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Real Madrid. La original, en inglés, está aquí:",
      "alsoLink": "Real Madrid quiz (English)",
      "statsLine": "Gratis · Preguntas del Real Madrid con respuestas explicadas · sin registro"
    }
  },
  {
    "club": "Atlético Madrid",
    "slug": "atletico-madrid",
    "lang": "es",
    "name": "Atlético Madrid",
    "h1": "Quiz del Atlético de Madrid",
    "title": "Quiz del Atlético de Madrid | Ball IQ",
    "description": "Pon a prueba tu Ball IQ colchonero: del Atlético Aviación al Cholismo, la Liga del Camp Nou y las finales de Lisboa y Milán. Gratis y sin registro.",
    "kind": "Quiz de club",
    "statLine": "Del Metropolitano al Calderón: la historia rojiblanca, pregunta a pregunta.",
    "playLabel": "Jugar el quiz",
    "intro": [
      "El Atlético de Madrid no se explica solo con títulos. Nació en 1903 como filial de unos estudiantes vascos, sobrevivió a una unión con la aviación militar, bajó a Segunda en 2000 y volvió para ganar la Liga en el Camp Nou. Este quiz recorre esa historia.",
      "Hay preguntas de la era Simeone —el Cholismo, las dos finales perdidas ante el Real Madrid, el título sellado en Valladolid en 2021— y otras del Atlético anterior: la final repetida de 1974, la Recopa de 1962, el Doblete de Radomir Antić.",
      "Cada pregunta trae una pista para los momentos en los que la memoria falla, y cuatro opciones con respuesta inmediata. Se juega en un par de minutos, en el móvil o en el ordenador.",
      "Los datos están verificados y los superlativos van anclados a un año o a una temporada concreta, para que la respuesta correcta siga siéndolo dentro de dos años."
    ],
    "faq": [
      {
        "q": "¿Es gratis el quiz del Atlético de Madrid?",
        "a": "Sí. Se juega directamente en el navegador, sin registro ni descarga. Si quieres guardar tu racha y comparar resultados con tus amigos, puedes crear una cuenta en Ball IQ."
      },
      {
        "q": "¿De qué épocas son las preguntas?",
        "a": "Sobre todo del Atlético moderno, de los años noventa en adelante: el Doblete de 1995-96, los años de Torres y Agüero y toda la etapa de Simeone. También aparecen hitos clásicos como la Recopa de 1962, la final de 1974 y el primer título de 1940."
      },
      {
        "q": "¿Cómo comprobáis los datos?",
        "a": "Cada pregunta pasa por dos revisiones antes de publicarse, y toda afirmación de récord o de 'el primero' va fechada o atada a una temporada concreta, para que no se vuelva falsa con el paso del tiempo."
      },
      {
        "q": "¿Puedo jugar desde el móvil?",
        "a": "Sí. La página funciona igual de bien en el móvil, y Ball IQ está además disponible como aplicación para iOS y Android."
      }
    ],
    "taster": [
      {
        "id": "q_9854d4",
        "q": "El Atlético ha perdido dos finales de la Liga de Campeones ante un mismo rival, en 2014 y 2016. ¿Cuál?",
        "o": [
          "Real Madrid",
          "Bayern de Múnich",
          "Liverpool",
          "Juventus"
        ],
        "a": 0,
        "hint": "El empate de Sergio Ramos en el minuto 93 en 2014 y una tanda de penaltis en 2016 convirtieron ambas finales en dolorosos derbis madrileños.",
        "en": "Real Madrid"
      },
      {
        "id": "q_641eeb",
        "q": "¿Qué delantero de la cantera, apodado 'El Niño', se convirtió con 19 años en el capitán más joven de la historia del Atlético antes de fichar por el Liverpool en 2007?",
        "o": [
          "Fernando Torres",
          "Sergio Agüero",
          "David Villa",
          "Raúl"
        ],
        "a": 0,
        "hint": "Seguidor del Liverpool desde niño, llevaba en el Atlético un brazalete de capitán con 'You'll Never Walk Alone' escrito por dentro, algo que se descubrió por accidente meses antes de su marcha a Anfield.",
        "en": "Fernando Torres"
      },
      {
        "id": "q_49439e",
        "q": "Diego Simeone se hizo cargo del Atlético en diciembre de 2011. ¿Qué había sido antes en el club?",
        "o": [
          "Un centrocampista combativo que jugó en el equipo",
          "Entrenador de las categorías inferiores",
          "Director general del club",
          "Fisioterapeuta"
        ],
        "a": 0,
        "hint": "El 'Cholo' fue un mediocentro tenaz en el equipo de finales de los noventa antes de volver como el entrenador que marcaría a una generación.",
        "en": "A combative midfielder who played for them"
      },
      {
        "id": "q_9f36f3",
        "q": "Sergio 'Kun' Agüero dejó el Atlético de Madrid en 2011 para fichar por un club inglés. ¿Cuál?",
        "o": [
          "Manchester City",
          "Chelsea",
          "Manchester United",
          "Liverpool"
        ],
        "a": 0,
        "hint": "Se marchó al Manchester City, donde acabó siendo su máximo goleador histórico.",
        "en": "Manchester City"
      },
      {
        "id": "q_769de3",
        "q": "¿Cuál es la nacionalidad de Diego Simeone, entrenador de larga trayectoria en el Atlético?",
        "o": [
          "Argentina",
          "Uruguaya",
          "Chilena",
          "Española"
        ],
        "a": 0,
        "hint": "El 'Cholo' Simeone es argentino, nacido en Buenos Aires.",
        "en": "Argentine"
      },
      {
        "id": "q_ec7cf2",
        "q": "El Atlético de Madrid disputa el derbi madrileño contra un gran rival de la ciudad. ¿Cuál?",
        "o": [
          "Real Madrid",
          "Rayo Vallecano",
          "Getafe",
          "FC Barcelona"
        ],
        "a": 0,
        "hint": "El derbi madrileño enfrenta al Atlético con su vecino, el Real Madrid.",
        "en": "Real Madrid"
      },
      {
        "id": "q_5f0218",
        "q": "¿Con qué selección fue internacional Diego Godín, icónico capitán y central del Atlético?",
        "o": [
          "Uruguay",
          "Argentina",
          "Colombia",
          "Chile"
        ],
        "a": 0,
        "hint": "Godín fue un fijo en la selección de Uruguay durante más de una década.",
        "en": "Uruguay"
      },
      {
        "id": "q_588485",
        "q": "¿Al frente de qué selección ganó Luis Aragonés la Eurocopa 2008, tras ser leyenda del Atlético como jugador y como entrenador?",
        "o": [
          "España",
          "Grecia",
          "Portugal",
          "Italia"
        ],
        "a": 0,
        "hint": "'El Sabio de Hortaleza' llevó a España al triunfo en la Eurocopa de 2008.",
        "en": "Spain"
      },
      {
        "id": "q_ead9b3",
        "q": "El Atlético de Madrid se fundó en 1903 como filial de otro club español. ¿De cuál?",
        "o": [
          "Athletic Bilbao",
          "Real Madrid",
          "FC Barcelona",
          "Real Sociedad"
        ],
        "a": 0,
        "hint": "Unos estudiantes vascos afincados en Madrid crearon una filial juvenil del equipo de su infancia, y por eso ambos visten de rojiblanco a rayas hasta hoy.",
        "en": "Athletic Bilbao"
      },
      {
        "id": "q_91589b",
        "q": "¿Por qué a los aficionados y jugadores del Atlético se les apoda 'Los Colchoneros'?",
        "o": [
          "Sus rayas rojiblancas eran iguales que la tela con la que se hacían los colchones",
          "Su primer campo se levantó sobre una antigua fábrica de colchones",
          "Su fundador tenía un negocio de ropa de cama",
          "Los aficionados lanzaron colchones al campo en señal de protesta"
        ],
        "a": 0,
        "hint": "La tela barata de rayas rojas y blancas cubría los colchones españoles de la época, y la camiseta era idéntica.",
        "en": "Their red-and-white stripes matched the cloth used to make mattresses"
      }
    ],
    "sample": [
      {
        "id": "q_d4c3b2",
        "q": "El animal del escudo del Atlético, tomado directamente del escudo de Madrid, ¿cuál es?",
        "o": [
          "Un oso empinado sobre un madroño",
          "Un león",
          "Un lobo",
          "Un águila"
        ],
        "a": 0,
        "hint": "'El Oso y el Madroño' simboliza la ciudad desde la Edad Media; hoy una estatua se alza a las puertas del Metropolitano.",
        "en": "A bear reaching up a strawberry tree"
      },
      {
        "id": "q_6573e5",
        "q": "En la última jornada de la temporada 2013-14, el Atlético selló el título de Liga con un empate 1-1 en el Camp Nou gracias al cabezazo de un defensa. ¿Quién fue?",
        "o": [
          "Diego Godín",
          "Miranda",
          "Filipe Luís",
          "Juanfran"
        ],
        "a": 0,
        "hint": "El gol del uruguayo en el minuto 49 fue la primera vez en los 67 años de historia del Camp Nou que un equipo visitante se proclamaba campeón allí.",
        "en": "Diego Godín"
      },
      {
        "id": "q_c80511",
        "q": "¿Quién marcó el gol del Atlético en la final de 2014, antes de que Sergio Ramos rompiera el corazón colchonero en el descuento?",
        "o": [
          "Diego Godín",
          "Diego Costa",
          "Raúl García",
          "Koke"
        ],
        "a": 0,
        "hint": "Fue el mismo que había cabeceado el gol del título en el Camp Nou la semana anterior: Godín marcó en la jornada decisiva de LaLiga y también en la final europea de aquella temporada.",
        "en": "Diego Godín"
      },
      {
        "id": "q_e2ed2a",
        "q": "¿Quién es el máximo goleador histórico del Atlético de Madrid, tras superar en 2024 a la leyenda del club Luis Aragonés?",
        "o": [
          "Antoine Griezmann",
          "Fernando Torres",
          "Diego Costa",
          "Radamel Falcao"
        ],
        "a": 0,
        "hint": "Las dos etapas del francés en el club le permitieron superar en enero de 2024 el récord que Aragonés ostentaba desde hacía décadas.",
        "en": "Antoine Griezmann"
      },
      {
        "id": "q_35f0bf",
        "q": "¿Qué entrenador llevó al Atlético de Madrid al histórico Doblete de Liga y Copa de 1995-96, el único doblete nacional en la historia del club?",
        "o": [
          "Radomir Antić",
          "Luis Aragonés",
          "César Luis Menotti",
          "Javier Aguirre"
        ],
        "a": 0,
        "hint": "El entrenador serbio es el único hombre que ha dirigido a los tres: Real Madrid, Barcelona y Atlético.",
        "en": "Radomir Antić"
      },
      {
        "id": "q_825f86",
        "q": "En 2000, bajo la polémica presidencia de Jesús Gil, el Atlético sufrió una humillación. ¿Cuál?",
        "o": [
          "El descenso a Segunda División",
          "La expulsión de las competiciones europeas",
          "Una resta de puntos por impago de salarios",
          "El cierre del estadio por incidentes de la afición"
        ],
        "a": 0,
        "hint": "Gil restó importancia al descenso y bautizó lo que vino después como una 'Temporada en el Infierno', pero hicieron falta dos años en la categoría de plata para volver a subir.",
        "en": "Relegation to the Segunda División"
      },
      {
        "id": "q_8f9db2",
        "q": "El estadio en el que el Atlético jugó durante décadas hasta 2017 estaba a orillas de un río de Madrid. ¿Cuál?",
        "o": [
          "Manzanares",
          "Guadalquivir",
          "Ebro",
          "Tajo"
        ],
        "a": 0,
        "hint": "El Vicente Calderón, bautizado en honor a un presidente muy querido, abrazaba el Manzanares antes de la mudanza al Metropolitano en 2017.",
        "en": "Manzanares"
      },
      {
        "id": "q_e2adde",
        "q": "La filosofía defensiva, de desgaste físico y obsesión por el balón parado que Simeone implantó en el Atlético se conoce popularmente como…",
        "o": [
          "Cholismo",
          "Tiki-taka",
          "Catenaccio",
          "Gegenpressing"
        ],
        "a": 0,
        "hint": "Bautizado por su apodo 'Cholo', prima la organización y la garra sobre la estética: lo contrario del brillo galáctico del vecino de la ciudad.",
        "en": "Cholismo"
      },
      {
        "id": "q_451951",
        "q": "¿En qué final de la Liga Europa marcó Diego Forlán los dos goles del Atlético de Madrid para ganar al Fulham?",
        "o": [
          "2010",
          "2012",
          "2018",
          "2014"
        ],
        "a": 0,
        "hint": "El doblete del uruguayo en Hamburgo, con un gol decisivo en el minuto 116 de la prórroga, dio al club su primer título europeo en décadas.",
        "en": "2010"
      },
      {
        "id": "q_e050c9",
        "q": "¿Quién marcó dos goles en la final de la Liga Europa de 2018, un 3-0 al Marsella en Lyon?",
        "o": [
          "Antoine Griezmann",
          "Diego Costa",
          "Kevin Gameiro",
          "Ángel Correa"
        ],
        "a": 0,
        "hint": "Su doblete, que le valió el premio al mejor del partido, llegó el año antes de su fichaje por el Barcelona; el capitán Gabi anotó el tercero a bocajarro.",
        "en": "Antoine Griezmann"
      },
      {
        "id": "q_f6d25e",
        "q": "La victoria del Atlético en la final de la Copa del Rey de 2013 fue especialmente dulce por dónde se jugó y contra quién. ¿Cuál fue el escenario y el rival?",
        "o": [
          "En el Bernabéu, contra el Real Madrid",
          "En el Camp Nou, contra el Barcelona",
          "En Mestalla, contra el Valencia",
          "En el Calderón, contra el Sevilla"
        ],
        "a": 0,
        "hint": "Los goles de Diego Costa y Miranda pusieron fin a 14 años y 25 partidos sin ganar al eterno rival, y encima en su propia casa.",
        "en": "At the Bernabéu against Real Madrid"
      },
      {
        "id": "q_c9bf32",
        "q": "En 2026, ¿quién ostenta el récord de partidos en la historia del Atlético de Madrid, superando los 700 encuentros como jugador de un solo club?",
        "o": [
          "Koke",
          "Gabi",
          "Adelardo",
          "Tomás Reñones"
        ],
        "a": 0,
        "hint": "El centrocampista y capitán formado en la cantera pulverizó los 553 partidos que Adelardo tenía desde hacía décadas, y siguió sumando.",
        "en": "Koke"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Atlético?",
      "tasterPh": "Toca una opción para empezar",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Atlético",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Preguntas frecuentes",
      "aboutQ": "Sobre las preguntas",
      "bandH": "¿Crees que sabes del Atlético? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Atlético. La original, en inglés, está aquí:",
      "alsoLink": "Atlético Madrid quiz (English)",
      "statsLine": "Del Metropolitano al Calderón: la historia rojiblanca, pregunta a pregunta."
    }
  },
  {
    "club": "Real Betis",
    "slug": "real-betis",
    "lang": "es",
    "name": "Real Betis",
    "h1": "Quiz del Real Betis",
    "title": "Quiz del Real Betis — Trivia verdiblanca | Ball IQ",
    "description": "Quiz gratis del Real Betis con respuestas explicadas: la Liga de 1935, las Copas del Rey de 1977, 2005 y 2022, Joaquín y El Gran Derbi.",
    "kind": "Quiz de club",
    "statLine": "Gratis · Preguntas del Betis con respuestas explicadas · sin registro",
    "playLabel": "Jugar el quiz",
    "intro": [
      "El Real Betis Balompié nació en Sevilla en 1907 y desde entonces vive el fútbol como pocos clubes del mundo. Este quiz gratuito recorre todo el arco verdiblanco: la Liga de 1934-35 con Patrick O'Connell en el banquillo, la Copa del Rey de 1977 decidida en una tanda de penaltis interminable, la de 2005, la de 2022 levantada en La Cartuja ante el Valencia y, en 2025, la primera gran final europea de la historia del club.",
      "Las preguntas se ponen difíciles de verdad: el récord mundial de traspaso que el Betis pagó por Denílson en 1998, el descenso de la 1999-2000, el 1-0 al Chelsea en casa en su estreno en la Liga de Campeones, los 521 partidos de Joaquín. Cuando un dato no se puede verificar, la pregunta no se publica.",
      "Cada respuesta trae una explicación escrita, así que fallar también enseña algo sobre cómo el Betis llegó hasta aquí — y sobre por qué en Sevilla se canta '¡Viva el Betis manque pierda!'."
    ],
    "faq": [
      {
        "q": "¿El quiz del Real Betis es gratis?",
        "a": "Sí. Se juega aquí mismo, en el navegador, sin registro y sin descargar nada. Todas las preguntas de esta página son gratuitas."
      },
      {
        "q": "¿Qué temas cubre?",
        "a": "La fundación de 1907 y el origen del nombre, la Liga de 1934-35, las Copas del Rey de 1977, 2005 y 2022, el Benito Villamarín y Heliópolis, la etapa de Denílson, el descenso de la 1999-2000, la Liga de Campeones de 2005-06, Joaquín, Serra Ferrer, Setién y Pellegrini, y El Gran Derbi. Va de fácil a realmente difícil."
      },
      {
        "q": "¿De dónde salen las preguntas?",
        "a": "Están escritas y verificadas a mano, nunca generadas automáticamente. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale."
      },
      {
        "q": "¿La aplicación Ball IQ está en español?",
        "a": "Todavía no: esta página está en español, pero la app está en inglés. Estamos midiendo el interés antes de traducirla; si has llegado hasta aquí, ya nos estás ayudando a decidirlo."
      }
    ],
    "taster": [
      {
        "id": "q_4664f8",
        "q": "¿En qué año se fundó el Real Betis?",
        "o": [
          "1899",
          "1907",
          "1914",
          "1923"
        ],
        "a": 1,
        "hint": "El Real Betis Balompié se fundó en Sevilla el 12 de septiembre de 1907, originalmente con otro nombre.",
        "en": "1907"
      },
      {
        "id": "q_a97efe",
        "q": "En el nombre del Real Betis, ¿cuál es la traducción al inglés de la palabra 'Real'?",
        "o": [
          "Royal",
          "Genuine",
          "River",
          "Regional"
        ],
        "a": 0,
        "hint": "'Real' se traduce al inglés como 'Royal' en los nombres de clubes españoles, y refleja el patronazgo real concedido en 1914.",
        "en": "Royal"
      },
      {
        "id": "q_8715f1",
        "q": "El Real Betis juega con camiseta de rayas verticales de ¿qué dos colores?",
        "o": [
          "Rojo y blanco",
          "Azul y blanco",
          "Verde y blanco",
          "Verde y negro"
        ],
        "a": 2,
        "hint": "El Betis ha vestido rayas verticales verdiblancas a lo largo de toda su historia.",
        "en": "Green and white"
      },
      {
        "id": "q_beb24b",
        "q": "El famoso cántico bético '¡Viva el Betis manque pierda!' expresa ¿qué sentimiento?",
        "o": [
          "El Betis ganará todos los partidos",
          "Viva el Betis aunque pierda",
          "El Betis no teme a ningún rival",
          "El Betis es el orgullo de España"
        ],
        "a": 1,
        "hint": "'Manque pierda' es andaluz por 'aunque pierda': un lema que celebra la lealtad incondicional.",
        "en": "Long live Betis even when they lose"
      },
      {
        "id": "q_222eff",
        "q": "El Real Betis disputa el derbi sevillano, 'El Gran Derbi', ¿contra qué club?",
        "o": [
          "Sevilla FC",
          "Real Zaragoza",
          "Cádiz CF",
          "Málaga CF"
        ],
        "a": 0,
        "hint": "El Gran Derbi es la feroz rivalidad ciudadana entre el Real Betis y el Sevilla FC.",
        "en": "Sevilla FC"
      },
      {
        "id": "q_c3703c",
        "q": "¿En qué año levantó el Real Betis la Copa del Rey por primera vez?",
        "o": [
          "1968",
          "1977",
          "1985",
          "1992"
        ],
        "a": 1,
        "hint": "El Betis ganó su primera Copa del Rey en 1977 tras una final dramática.",
        "en": "1977"
      },
      {
        "id": "q_e4c9f5",
        "q": "En 1998, el Real Betis sorprendió al fútbol pagando un récord mundial de traspaso por ¿qué delantero brasileño?",
        "o": [
          "Sávio",
          "Denílson",
          "Amoroso",
          "Élber"
        ],
        "a": 1,
        "hint": "El Betis batió el récord mundial de traspasos para fichar al joven extremo brasileño Denílson en 1998.",
        "en": "Denílson"
      },
      {
        "id": "q_5d4580",
        "q": "El Real Betis Balompié compite en la primera división del fútbol de ¿qué país?",
        "o": [
          "Portugal",
          "España",
          "Italia",
          "México"
        ],
        "a": 1,
        "hint": "El Betis es uno de los clubes históricos del fútbol español, con sede en Sevilla.",
        "en": "Spain"
      },
      {
        "id": "q_50f994",
        "q": "'Balompié', en el nombre Real Betis Balompié, es una palabra española que designa ¿qué deporte?",
        "o": [
          "Baloncesto",
          "Balonmano",
          "Fútbol",
          "Fútbol sala"
        ],
        "a": 2,
        "hint": "'Balompié' (literalmente 'balón-pie') es un término antiguo en español para el fútbol.",
        "en": "Football"
      },
      {
        "id": "q_391de4",
        "q": "El Gran Derbi, una de las rivalidades más pasionales de España, es un derbi ciudadano que se disputa en ¿qué ciudad?",
        "o": [
          "Madrid",
          "Valencia",
          "Sevilla",
          "Bilbao"
        ],
        "a": 2,
        "hint": "El Gran Derbi es el derbi de la ciudad de Sevilla entre sus dos grandes clubes.",
        "en": "Seville"
      }
    ],
    "sample": [
      {
        "id": "q_0c5f58",
        "q": "¿Con qué apodo, basado en sus colores, se conoce ampliamente al Real Betis?",
        "o": [
          "Blaugrana",
          "Verdiblancos",
          "Rojiblancos",
          "Colchoneros"
        ],
        "a": 1,
        "hint": "'Verdiblancos' es el apodo tradicional del club sevillano Real Betis.",
        "en": "Verdiblancos"
      },
      {
        "id": "q_28d628",
        "q": "El 'Betis' del nombre del club viene de Baetis, el nombre romano de ¿qué río andaluz?",
        "o": [
          "Ebro",
          "Guadiana",
          "Tajo",
          "Guadalquivir"
        ],
        "a": 3,
        "hint": "Baetis era el nombre romano del gran río que atraviesa Sevilla.",
        "en": "Guadalquivir"
      },
      {
        "id": "q_330f59",
        "q": "El Real Betis ganó el título de Liga por primera vez, ¿en qué temporada?",
        "o": [
          "1929-30",
          "1934-35",
          "1948-49",
          "1962-63"
        ],
        "a": 1,
        "hint": "A las órdenes del entrenador irlandés Patrick O'Connell, el Betis se proclamó campeón de España en la temporada 1934-35.",
        "en": "1934-35"
      },
      {
        "id": "q_289209",
        "q": "En 1961, el estadio del Real Betis pasó a llamarse como ¿qué expresidente del club, que había comprado el campo?",
        "o": [
          "Ramón Sánchez-Pizjuán",
          "Benito Villamarín",
          "Manuel Ruiz de Lopera",
          "Luis del Sol"
        ],
        "a": 1,
        "hint": "Benito Villamarín, presidente entre 1955 y 1965, compró el estadio, y en 1961 el campo pasó a llevar su nombre en su honor.",
        "en": "Benito Villamarín"
      },
      {
        "id": "q_39acdb",
        "q": "Al Real Betis se le asocia tradicionalmente con las raíces obreras de ¿qué barrio de Sevilla?",
        "o": [
          "Santa Cruz",
          "El Arenal",
          "Triana",
          "Nervión"
        ],
        "a": 2,
        "hint": "El Betis tiene apoyo histórico en zonas obreras de Sevilla como Triana.",
        "en": "Triana"
      },
      {
        "id": "q_c706d3",
        "q": "El Real Betis ganó su primera Copa del Rey en 1977 con una victoria en la final ante ¿qué club?",
        "o": [
          "Real Sociedad",
          "Deportivo Alavés",
          "Athletic Bilbao",
          "Racing de Santander"
        ],
        "a": 2,
        "hint": "El Betis derrotó al Athletic Bilbao para conquistar su primera Copa del Rey en 1977.",
        "en": "Athletic Bilbao"
      },
      {
        "id": "q_7c8718",
        "q": "La final de la Copa del Rey de 1977, primer título copero del Real Betis, ¿cómo se decidió finalmente tras un 2-2?",
        "o": [
          "Un partido de desempate",
          "Una tanda de penaltis",
          "Un gol de oro",
          "Un sorteo a cara o cruz"
        ],
        "a": 1,
        "hint": "Tras el 2-2 en la prórroga, el Betis se impuso en una interminable tanda de penaltis para ganar su primera Copa del Rey.",
        "en": "A penalty shootout"
      },
      {
        "id": "q_043441",
        "q": "El Real Betis ganó la final de la Copa del Rey de 2005 ante ¿qué club?",
        "o": [
          "Espanyol",
          "Getafe",
          "Osasuna",
          "Real Zaragoza"
        ],
        "a": 2,
        "hint": "El Betis ganó 2-1 a Osasuna en la prórroga para conquistar la Copa del Rey de 2005.",
        "en": "Osasuna"
      },
      {
        "id": "q_d4f0fa",
        "q": "Incluyendo el triunfo de 2005, ¿cuántas Copas del Rey había ganado el Real Betis a finales de 2005?",
        "o": [
          "Una",
          "Dos",
          "Tres",
          "Cuatro"
        ],
        "a": 1,
        "hint": "En 2005 el Betis había levantado la Copa del Rey dos veces: el triunfo de 2005 se sumaba a otro de varias décadas antes.",
        "en": "Two"
      },
      {
        "id": "q_98d71f",
        "q": "El Real Betis ganó la final de la Copa del Rey de 2022, ¿ante qué club?",
        "o": [
          "Levante",
          "Espanyol",
          "Valencia",
          "Real Sociedad"
        ],
        "a": 2,
        "hint": "El Betis venció al Valencia en la tanda de penaltis para levantar la Copa del Rey de 2022.",
        "en": "Valencia"
      },
      {
        "id": "q_a91e9d",
        "q": "La final de la Copa del Rey de 2022 que ganó el Real Betis se disputó en ¿qué estadio de Sevilla?",
        "o": [
          "Estadio de La Cartuja",
          "Ramón Sánchez-Pizjuán",
          "Santiago Bernabéu",
          "La Rosaleda"
        ],
        "a": 0,
        "hint": "La final de 2022 se jugó en el Estadio de La Cartuja, en Sevilla.",
        "en": "Estadio de La Cartuja"
      },
      {
        "id": "q_128cca",
        "q": "¿Qué rey de España entregó el trofeo al capitán del Real Betis tras la final de la Copa del Rey de 2022?",
        "o": [
          "Juan Carlos I",
          "Felipe VI",
          "Alfonso XIII",
          "Felipe V"
        ],
        "a": 1,
        "hint": "El rey Felipe VI entregó la Copa del Rey de 2022 al capitán bético, vencedor de la final.",
        "en": "Felipe VI"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Betis?",
      "tasterPh": "Preguntas rápidas para medir tu Ball IQ bético.",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Betis",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Quiz del Real Betis — Preguntas frecuentes",
      "aboutQ": "Sobre el quiz del Real Betis",
      "bandH": "¿Crees que sabes del Betis? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Betis. La original, en inglés, está aquí:",
      "alsoLink": "Real Betis quiz (English)",
      "statsLine": "Gratis · Preguntas del Betis con respuestas explicadas · sin registro"
    }
  },
  {
    "club": "Athletic Bilbao",
    "slug": "athletic-bilbao",
    "lang": "es",
    "name": "Athletic Bilbao",
    "h1": "Quiz del Athletic de Bilbao",
    "title": "Quiz del Athletic de Bilbao — Los Leones | Ball IQ",
    "description": "Quiz gratis del Athletic de Bilbao con respuestas explicadas: la cantera, San Mamés, Clemente, Bielsa, la Copa del Rey de 2024 y La Gabarra.",
    "kind": "Quiz de club",
    "statLine": "Gratis · Preguntas del Athletic con respuestas explicadas · sin registro",
    "playLabel": "Jugar el quiz",
    "intro": [
      "El Athletic Club nació en 1898 y desde entonces juega a otra cosa. Los Leones visten unas de las rayas rojiblancas más reconocibles de España, fueron uno de los clubes fundadores de la Primera División en 1929 y siguen fieles a una filosofía poco común entre los grandes: solo fichan a jugadores nacidos en el País Vasco o formados allí. La cantera se trabaja en Lezama, abierto en 1971, y el escaparate es San Mamés: el original se inauguró en 1913 y el actual, en 2013, con un aforo cercano a los 53.000. Ni el nombre se libró de la historia, porque la castellanización franquista obligó a cambiar el 'Athletic' inglés por 'Atlético de Bilbao' antes de que el club recuperara el suyo. Y el partido que de verdad para la semana es el derbi vasco contra la Real Sociedad.",
      "La sala de trofeos se llenó pronto. El primer título de Liga llegó en 1929-30, en los primeros años de la competición, y el equipo dominador de finales de los veinte y principios de los treinta lo construyó un inglés con bombín, Fred Pentland, al que en Bilbao aún se recuerda como 'el Bombín'. A mediados de los cuarenta llegaron tres Copas seguidas —1943, 1944 y 1945— y en 1955-56 el eslovaco Ferdinand Daučík firmó el doblete, ganando la Liga por un solo punto. El último gran ciclo lo dirigió Javier Clemente: campeón en 1982-83, campeón otra vez en 1983-84 y doblete con la Copa. A mediados de los ochenta el Athletic acumulaba ocho campeonatos de Primera y disputaba la Copa de Europa como vigente campeón de España.",
      "En Europa la historia va de noches grandes y finales que se escaparon. En 1977 el Athletic llegó a la final de la Copa de la UEFA y la perdió contra la Juventus por el valor doble de los goles a domicilio, con 2-2 en el global. El subcampeonato de Liga de 1997-98, con Luis Fernández en el banquillo, devolvió al club a la Liga de Campeones. En 2012, el Athletic de Marcelo Bielsa alcanzó la final de la Liga Europa —perdida 3-0 en Bucarest ante el Atlético de Madrid— y también la de Copa. Dos años después, eliminó al Nápoles en la previa y selló en el nuevo San Mamés el billete a la fase de grupos. En 2015 llegó la Supercopa de España, con triplete de Aritz Aduriz en la ida. La final de Copa de 2021 acabó en 4-0 para el Barcelona, con doblete de Messi; la de 2024, en La Cartuja y ante el Mallorca, se decidió en los penaltis por 4-2 y devolvió la Copa a Bilbao con Ernesto Valverde. La gabarra volvió a bajar por la ría, como viene haciendo desde 1983.",
      "Y luego están los nombres. Telmo Zarra, cuyo apellido da nombre al trofeo del máximo goleador español. José Ángel Iribar, portero y capitán, que ayudó a sacar al campo la ikurriña cuando todavía estaba prohibida, en diciembre de 1976. Andoni Goikoetxea, 'el Carnicero de Bilbao' desde aquella entrada a Maradona en el Camp Nou en 1983. Julen Guerrero, ídolo absoluto de los noventa. Andoni Zubizarreta, cuatro Mundiales con España. Fernando Llorente, campeón del mundo en 2010 siendo jugador del Athletic, y Nico Williams, canterano y campeón de la Eurocopa 2024. Por el camino, Lezama surtió al fútbol europeo: Javi Martínez al Bayern de Múnich en 2012, Ander Herrera al Manchester United en 2014, Aymeric Laporte al Manchester City y Kepa al Chelsea en 2018 por un récord mundial para un portero. Ahora toca ver cuánto de todo esto te sabes de verdad.\n"
    ],
    "faq": [
      {
        "q": "¿El quiz del Athletic de Bilbao es gratis?",
        "a": "Sí. Se juega aquí mismo, en el navegador, sin registro y sin descargar nada. Todas las preguntas de esta página son gratuitas."
      },
      {
        "q": "¿Qué temas cubre?",
        "a": "La historia del club desde 1898, la filosofía de cantera y Lezama, los dos San Mamés, las Ligas de Pentland y de Javier Clemente, las Copas de los años cuarenta y el doblete de 1955-56, las noches europeas de 1977, 2012 y 2014, la Copa del Rey de 2024 y los ídolos: Zarra, Iribar, Guerrero, Zubizarreta, Llorente, Aduriz, Kepa, Laporte y Nico Williams. Va de fácil a realmente difícil."
      },
      {
        "q": "¿De dónde salen las preguntas?",
        "a": "Están escritas y verificadas a mano, nunca generadas automáticamente. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale."
      },
      {
        "q": "¿La aplicación Ball IQ está en español?",
        "a": "Todavía no: esta página está en español, pero la app está en inglés. Estamos midiendo el interés antes de traducirla, así que si has llegado hasta aquí ya nos estás ayudando a decidirlo."
      }
    ],
    "taster": [
      {
        "id": "q_49a5a7",
        "q": "¿En qué año se fundó el Athletic Club (Athletic de Bilbao)?",
        "o": [
          "1912",
          "1878",
          "1898",
          "1928"
        ],
        "a": 2,
        "hint": "El Athletic se fundó en 1898, lo que lo convierte en uno de los clubes de fútbol más antiguos de España.",
        "en": "1898"
      },
      {
        "id": "q_b19250",
        "q": "¿Cuál es el apodo del Athletic de Bilbao?",
        "o": [
          "Los Toros",
          "Los Leones",
          "Las Águilas",
          "Los Lobos"
        ],
        "a": 1,
        "hint": "Se les conoce como Los Leones.",
        "en": "The Lions (Los Leones)"
      },
      {
        "id": "q_ec0a38",
        "q": "¿Cuáles son los colores tradicionales de la primera equipación del Athletic de Bilbao?",
        "o": [
          "Rayas azules y blancas",
          "Todo de rojo",
          "Rayas blancas y negras",
          "Rayas verticales rojiblancas"
        ],
        "a": 3,
        "hint": "Su camiseta a rayas rojiblancas es una de las más reconocibles de España.",
        "en": "Red-and-white vertical stripes"
      },
      {
        "id": "q_a501aa",
        "q": "La particular filosofía de fichajes del Athletic de Bilbao limita sus incorporaciones a jugadores con ¿qué característica?",
        "o": [
          "Solo nacionalidad española",
          "Raíces vascas o formación en el País Vasco",
          "Solo canteranos del club",
          "Solo jugadores sub-23"
        ],
        "a": 1,
        "hint": "La célebre política de cantera limita la plantilla a jugadores nacidos en el País Vasco o formados allí.",
        "en": "Basque roots or developed in the Basque region"
      },
      {
        "id": "q_bf668b",
        "q": "El Athletic de Bilbao fue uno de los clubes fundadores de la Primera División española, que arrancó ¿en qué año?",
        "o": [
          "1929",
          "1902",
          "1945",
          "1953"
        ],
        "a": 0,
        "hint": "Fue uno de los clubes fundadores de la primera edición de la Primera División, en 1929.",
        "en": "1929"
      },
      {
        "id": "q_fe937c",
        "q": "¿Cómo celebra tradicionalmente el Athletic de Bilbao sus grandes títulos en la ciudad?",
        "o": [
          "En una gabarra por la ría (La Gabarra)",
          "En autobuses descubiertos",
          "A caballo por el casco viejo",
          "Con una procesión de antorchas por el monte"
        ],
        "a": 0,
        "hint": "La Gabarra, una barcaza fluvial, pasea los títulos por la ría del Nervión desde 1983.",
        "en": "On a barge (La Gabarra) along the river"
      },
      {
        "id": "q_78bdfa",
        "q": "El disputadísimo 'derbi vasco' del Athletic de Bilbao se juega contra ¿qué club vecino?",
        "o": [
          "Real Sociedad",
          "Osasuna",
          "Deportivo Alavés",
          "SD Eibar"
        ],
        "a": 0,
        "hint": "La Real Sociedad, de San Sebastián, es el gran rival vasco del Athletic.",
        "en": "Real Sociedad"
      },
      {
        "id": "q_d74071",
        "q": "¿Qué extremo formado en el Athletic de Bilbao ganó la Eurocopa 2024 con España?",
        "o": [
          "Nico Williams",
          "Iker Muniain",
          "Óscar de Marcos",
          "Unai Gómez"
        ],
        "a": 0,
        "hint": "Nico Williams, canterano del Athletic, marcó en la final de la Eurocopa 2024 que ganó España.",
        "en": "Nico Williams"
      },
      {
        "id": "q_9f86b8",
        "q": "En enero de 2018 el Athletic de Bilbao vendió al defensa Aymeric Laporte, entonces la venta más cara de su historia, ¿a qué club?",
        "o": [
          "Manchester City",
          "Chelsea",
          "Paris Saint-Germain",
          "Bayern de Múnich"
        ],
        "a": 0,
        "hint": "Laporte fichó por el Manchester City por unos 65 millones de euros, el mayor traspaso cobrado por el Athletic hasta entonces.",
        "en": "Manchester City"
      },
      {
        "id": "q_c64db6",
        "q": "Como vigente campeón de la Liga española, ¿en qué competición europea participó el Athletic de Bilbao a mediados de los años ochenta?",
        "o": [
          "La Recopa de Europa",
          "La Copa de la UEFA",
          "La Copa de Europa",
          "La Copa Intertoto"
        ],
        "a": 2,
        "hint": "Los campeones nacionales de aquella época entraban en la Copa de Europa, antecesora de la Liga de Campeones.",
        "en": "The European Cup"
      }
    ],
    "sample": [
      {
        "id": "q_b87434",
        "q": "El estadio original de San Mamés se inauguró ¿en qué año?",
        "o": [
          "1898",
          "1927",
          "1913",
          "1950"
        ],
        "a": 2,
        "hint": "El primer San Mamés se inauguró en 1913 y acogió en sus inicios un partido contra el Racing de Irún.",
        "en": "1913"
      },
      {
        "id": "q_9b259e",
        "q": "El actual San Mamés, ya reconstruido, se inauguró ¿en qué año?",
        "o": [
          "2004",
          "2013",
          "2016",
          "2009"
        ],
        "a": 1,
        "hint": "El nuevo San Mamés se inauguró en 2013 con un aforo cercano a los 53.000 espectadores.",
        "en": "2013"
      },
      {
        "id": "q_df92a5",
        "q": "La cantera y la ciudad deportiva del Athletic de Bilbao están en ¿qué localidad cercana a Bilbao?",
        "o": [
          "Zubieta",
          "Valdebebas",
          "Lezama",
          "Sant Joan Despí"
        ],
        "a": 2,
        "hint": "Lezama, abierto en 1971, es el corazón de la célebre cantera del Athletic.",
        "en": "Lezama"
      },
      {
        "id": "q_cf44a2",
        "q": "A mediados de los años cuarenta el Athletic ganó la Copa tres años seguidos, empezando ¿en qué año?",
        "o": [
          "1943",
          "1930",
          "1950",
          "1958"
        ],
        "a": 0,
        "hint": "El Athletic levantó la Copa (entonces Copa del Generalísimo) en 1943, 1944 y 1945.",
        "en": "1943"
      },
      {
        "id": "q_646173",
        "q": "¿En qué temporada ganó el Athletic de Bilbao su primer título de Liga?",
        "o": [
          "1934-35",
          "1929-30",
          "1942-43",
          "1955-56"
        ],
        "a": 1,
        "hint": "El Athletic se proclamó campeón de España por primera vez en 1929-30, en los primeros años de la Liga.",
        "en": "1929–30"
      },
      {
        "id": "q_ae203f",
        "q": "¿En qué temporada ganó el Athletic de Bilbao el segundo de sus dos títulos de Liga consecutivos de principios de los ochenta?",
        "o": [
          "1983-84",
          "1955-56",
          "1997-98",
          "2020-21"
        ],
        "a": 0,
        "hint": "Tras el campeonato de 1982-83, el Athletic revalidó el título de Liga en 1983-84.",
        "en": "1983–84"
      },
      {
        "id": "q_19d0f3",
        "q": "A mediados de los años ochenta, ¿cuántos títulos de Liga había ganado el Athletic de Bilbao?",
        "o": [
          "Tres",
          "Cinco",
          "Ocho",
          "Doce"
        ],
        "a": 2,
        "hint": "El Athletic sumaba ocho campeonatos de Primera a mediados de los ochenta.",
        "en": "Eight"
      },
      {
        "id": "q_e8d4db",
        "q": "El Athletic de Bilbao ganó la final de la Copa del Rey de 2024 en los penaltis ¿contra qué club?",
        "o": [
          "Sevilla",
          "Real Betis",
          "Valencia",
          "Mallorca"
        ],
        "a": 3,
        "hint": "El Athletic se impuso al Mallorca por 4-2 en los penaltis tras el 1-1.",
        "en": "Mallorca"
      },
      {
        "id": "q_804c9b",
        "q": "¿En qué estadio se disputó la final de la Copa del Rey de 2024?",
        "o": [
          "La Cartuja, Sevilla",
          "Santiago Bernabéu",
          "Metropolitano",
          "Mestalla"
        ],
        "a": 0,
        "hint": "La final se jugó en el estadio neutral de La Cartuja, en Sevilla.",
        "en": "La Cartuja, Seville"
      },
      {
        "id": "q_a601fe",
        "q": "El premio de la Liga al máximo goleador español lleva el nombre de ¿qué delantero del Athletic de Bilbao?",
        "o": [
          "Telmo Zarra",
          "José Ángel Iribar",
          "Julen Guerrero",
          "Dani"
        ],
        "a": 0,
        "hint": "El Trofeo Zarra homenajea a Telmo Zarra, un delantero muy goleador de los años cuarenta y cincuenta.",
        "en": "Telmo Zarra"
      },
      {
        "id": "q_51d1f7",
        "q": "¿Qué mediapunta de un solo club fue el emblema y el ídolo de la afición del Athletic de Bilbao durante los años noventa?",
        "o": [
          "Julen Guerrero",
          "Markel Susaeta",
          "Ander Iturraspe",
          "Iker Muniain"
        ],
        "a": 0,
        "hint": "Julen Guerrero, organizador salido de la cantera, se convirtió en icono de los noventa e internacional con España.",
        "en": "Julen Guerrero"
      },
      {
        "id": "q_774246",
        "q": "¿Qué veterano delantero marcó un triplete en el partido de ida de la Supercopa de España que el Athletic de Bilbao ganó en 2015?",
        "o": [
          "Iker Muniain",
          "Aritz Aduriz",
          "Iñaki Williams",
          "Markel Susaeta"
        ],
        "a": 1,
        "hint": "Aritz Aduriz, todavía muy goleador cerca de los cuarenta, marcó tres en la goleada de la ida.",
        "en": "Aritz Aduriz"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Athletic?",
      "tasterPh": "Unas preguntas rápidas para medir tu Ball IQ del Athletic.",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Athletic",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Quiz del Athletic de Bilbao — Preguntas frecuentes",
      "aboutQ": "Sobre el quiz del Athletic de Bilbao",
      "bandH": "¿Crees que sabes del Athletic? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Athletic. La original, en inglés, está aquí:",
      "alsoLink": "Athletic Bilbao quiz (English)",
      "statsLine": "Gratis · Preguntas del Athletic con respuestas explicadas · sin registro"
    }
  },
  {
    "club": "Valencia",
    "slug": "valencia",
    "lang": "es",
    "name": "Valencia",
    "h1": "Quiz del Valencia CF",
    "title": "Quiz del Valencia CF — Trivia de Mestalla | Ball IQ",
    "description": "Quiz gratis del Valencia CF con respuestas explicadas: Mestalla, las finales de 2000 y 2001, la era Benítez, David Villa y la Copa del Rey de 2019.",
    "kind": "Quiz de club",
    "statLine": "Gratis · Preguntas del Valencia con respuestas explicadas · sin registro",
    "playLabel": "Jugar el quiz",
    "intro": [
      "Pocos campos de España se levantan como Mestalla. El Valencia juega ahí desde 1923, con el murciélago en el escudo y Los Che empujando desde la grada. Este quiz gratuito recorre todo el arco moderno del club: las dos finales seguidas de la Liga de Campeones con Héctor Cúper en 2000 y 2001, el doblete de Rafael Benítez en 2003-04 con la Liga y la Copa de la UEFA, los goles de David Villa, y la Copa del Rey levantada en 2019, la temporada del centenario.",
      "Las preguntas van en serio. Empiezan por lo que sabe cualquier aficionado —el estadio, el apodo, el escudo— y acaban en la tanda de penaltis de Milán: quién falló el último lanzamiento y quién se lo paró. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale.",
      "Todas las respuestas del set del Valencia llevan una explicación escrita, así que fallar también enseña algo: por qué Benítez ganó lo que ganó, cómo acabó Alfredo Di Stéfano en el banquillo de Mestalla o de dónde salió aquel murciélago. Si os creéis que os lo sabéis todo del Valencia, aquí se ve rápido."
    ],
    "faq": [
      {
        "q": "¿El quiz del Valencia CF es gratis?",
        "a": "Sí. Se juega aquí mismo en el navegador, sin registro y sin descargar nada. Todas las preguntas de esta página son gratuitas."
      },
      {
        "q": "¿Qué temas cubre?",
        "a": "Historia del club, Mestalla y el escudo, la Copa de Ferias de los años sesenta, la Recopa de 1980, Mario Kempes, las finales europeas de 2000 y 2001, el doblete de Benítez en 2004, David Villa y David Silva, la Copa del Rey de 2019 y los récords del club. Va de fácil a realmente difícil."
      },
      {
        "q": "¿De dónde salen las preguntas?",
        "a": "Están escritas y verificadas a mano, nunca generadas automáticamente. Cada dato pasa por dos revisiones independientes antes de publicarse, y cuando algo no se puede verificar, la pregunta no sale."
      },
      {
        "q": "¿La aplicación Ball IQ está en español?",
        "a": "Todavía no: esta página está en español, pero la app está en inglés. Estamos midiendo el interés antes de traducirla, así que si has llegado hasta aquí ya nos estás ayudando a decidirlo."
      }
    ],
    "taster": [
      {
        "id": "q_8364ea",
        "q": "¿Cómo se llama el estadio del Valencia?",
        "o": [
          "La Rosaleda",
          "Mestalla",
          "El Sadar",
          "Balaídos"
        ],
        "a": 1,
        "hint": "El Valencia juega en Mestalla desde 1923; el nombre viene de la acequia que pasaba junto al solar.",
        "en": "Mestalla"
      },
      {
        "id": "q_12003a",
        "q": "¿Con qué apodo se conoce habitualmente al Valencia CF?",
        "o": [
          "Los Colchoneros",
          "Los Leones",
          "Los Che",
          "Los Blanquiazules"
        ],
        "a": 2,
        "hint": "«Che» es una interjección valenciana, y tanto el club como su afición son conocidos desde hace mucho como Los Che.",
        "en": "Los Che"
      },
      {
        "id": "q_3ba968",
        "q": "¿Qué animal aparece en el escudo del Valencia CF?",
        "o": [
          "Un murciélago",
          "Un águila",
          "Un león",
          "Un toro"
        ],
        "a": 0,
        "hint": "El murciélago corona el escudo del Valencia, tomado del escudo de armas de la ciudad de Valencia.",
        "en": "A bat"
      },
      {
        "id": "q_8b7c4f",
        "q": "El Valencia perdió la final de la Liga de Campeones de 2000 ante ¿qué club?",
        "o": [
          "Barcelona",
          "Atlético Madrid",
          "Deportivo La Coruña",
          "Real Madrid"
        ],
        "a": 3,
        "hint": "El Real Madrid ganó 3-0 al Valencia en París en la primera final de la Copa de Europa entre dos equipos españoles.",
        "en": "Real Madrid"
      },
      {
        "id": "q_2cbf81",
        "q": "El Valencia perdió la final de la Liga de Campeones de 2001 ante ¿qué club?",
        "o": [
          "Bayern Munich",
          "Juventus",
          "AC Milan",
          "Borussia Dortmund"
        ],
        "a": 0,
        "hint": "El Bayern Munich ganó al Valencia en los penaltis tras un 1-1, la segunda final perdida de forma consecutiva por el equipo español.",
        "en": "Bayern Munich"
      },
      {
        "id": "q_f59f7e",
        "q": "¿A qué delantero fichó el Valencia procedente del Real Zaragoza en 2005, que acabaría marcando más de 100 goles con el club?",
        "o": [
          "Roberto Soldado",
          "David Villa",
          "Fernando Morientes",
          "Nikola Žigić"
        ],
        "a": 1,
        "hint": "David Villa marcó unos 129 goles en cinco temporadas en el Valencia tras llegar del Zaragoza en 2005.",
        "en": "David Villa"
      },
      {
        "id": "q_5ad687",
        "q": "¿A qué club fichó David Silva cuando dejó el Valencia en 2010?",
        "o": [
          "Chelsea",
          "Arsenal",
          "Manchester City",
          "Manchester United"
        ],
        "a": 2,
        "hint": "Silva pasó del Valencia al Manchester City en el verano de 2010 y estuvo allí una década.",
        "en": "Manchester City"
      },
      {
        "id": "q_2fec56",
        "q": "¿Quién era el entrenador del Valencia cuando ganó la Copa de la UEFA de 2004?",
        "o": [
          "Héctor Cúper",
          "Unai Emery",
          "Claudio Ranieri",
          "Rafael Benítez"
        ],
        "a": 3,
        "hint": "Rafael Benítez ganó la Liga y la Copa de la UEFA con el Valencia en 2003-04 antes de marcharse al Liverpool.",
        "en": "Rafael Benítez"
      },
      {
        "id": "q_4e7e86",
        "q": "¿En qué década se fundó el Valencia CF?",
        "o": [
          "Década de 1890",
          "Década de 1910",
          "Década de 1930",
          "Década de 1950"
        ],
        "a": 1,
        "hint": "El Valencia CF se fundó en marzo de 1919 y celebró su centenario en la temporada 2018-19.",
        "en": "1910s"
      },
      {
        "id": "q_4d4954",
        "q": "¿Qué club es el rival ciudadano del Valencia en el derbi valenciano?",
        "o": [
          "Villarreal",
          "Hércules",
          "Elche",
          "Levante"
        ],
        "a": 3,
        "hint": "El Levante UD es el otro gran club de la ciudad de Valencia, lo que convierte ese partido en el verdadero derbi de la ciudad.",
        "en": "Levante"
      }
    ],
    "sample": [
      {
        "id": "q_3dbe59",
        "q": "¿A qué club ganó el Valencia en la final de la Copa de la UEFA de 2004?",
        "o": [
          "Newcastle United",
          "Bordeaux",
          "Marseille",
          "Villarreal"
        ],
        "a": 2,
        "hint": "El Valencia ganó 2-0 al Marseille en la final de Gotemburgo para completar el doblete de Liga y Copa de la UEFA.",
        "en": "Marseille"
      },
      {
        "id": "q_38b80c",
        "q": "¿A qué club fichó Gaizka Mendieta cuando dejó el Valencia en 2001?",
        "o": [
          "Lazio",
          "Roma",
          "Juventus",
          "Internazionale"
        ],
        "a": 0,
        "hint": "Mendieta dejó el Valencia por la Lazio en 2001, en uno de los mayores traspasos de la época.",
        "en": "Lazio"
      },
      {
        "id": "q_cf0bdc",
        "q": "¿Qué entrenador llevó al Valencia a las finales de la Liga de Campeones de 2000 y 2001?",
        "o": [
          "Claudio Ranieri",
          "Héctor Cúper",
          "Luis Aragonés",
          "Rafael Benítez"
        ],
        "a": 1,
        "hint": "El entrenador argentino Héctor Cúper llevó al Valencia a dos finales consecutivas de la Copa de Europa antes de fichar por el Inter.",
        "en": "Héctor Cúper"
      },
      {
        "id": "q_fb7dbf",
        "q": "¿Qué portero llegó al Valencia procedente del Real Madrid en 1998 y acabó pasando una década en el club?",
        "o": [
          "Andrés Palop",
          "Diego Alves",
          "Santiago Cañizares",
          "Vicente Guaita"
        ],
        "a": 2,
        "hint": "Santiago Cañizares dejó el Real Madrid por el Valencia en 1998 y se quedó hasta 2008, atravesando los años de títulos de Cúper y Benítez.",
        "en": "Santiago Cañizares"
      },
      {
        "id": "q_ee11f2",
        "q": "¿En qué estadio se disputó la final de la Liga de Campeones de 2001, en la que el Valencia fue derrotado?",
        "o": [
          "Old Trafford, Mánchester",
          "San Siro, Milán",
          "Stade de France, París",
          "Estadio Olímpico, Atenas"
        ],
        "a": 1,
        "hint": "La final de 2001 entre el Bayern Munich y el Valencia se jugó en San Siro, en Milán.",
        "en": "San Siro, Milan"
      },
      {
        "id": "q_fbb4eb",
        "q": "¿Qué central argentino llegó al Valencia en 2000 y se convirtió en un pilar de la defensa que ganó la Liga?",
        "o": [
          "Walter Samuel",
          "Nicolás Otamendi",
          "Fabricio Coloccini",
          "Roberto Ayala"
        ],
        "a": 3,
        "hint": "Roberto Ayala llegó del Milan en 2000 y fue el ancla de la defensa del Valencia en los dos títulos de Liga.",
        "en": "Roberto Ayala"
      },
      {
        "id": "q_cd8fbb",
        "q": "¿A qué club ganó el Valencia en la final de la Copa del Rey de 2019?",
        "o": [
          "Real Madrid",
          "Barcelona",
          "Sevilla",
          "Atlético Madrid"
        ],
        "a": 1,
        "hint": "El Valencia ganó 2-1 al Barcelona en Sevilla y se llevó la Copa del Rey en su temporada del centenario.",
        "en": "Barcelona"
      },
      {
        "id": "q_299902",
        "q": "El Valencia ganó la Copa de Ferias en ¿qué dos años consecutivos?",
        "o": [
          "1958 y 1959",
          "1962 y 1963",
          "1965 y 1966",
          "1968 y 1969"
        ],
        "a": 1,
        "hint": "El Valencia ganó la Copa de Ferias en 1962 y la revalidó en 1963; después perdió la final de 1964.",
        "en": "1962 and 1963"
      },
      {
        "id": "q_cbe275",
        "q": "¿Qué centrocampista formó pareja en el centro del campo del Valencia con David Albelda a las órdenes de Rafael Benítez?",
        "o": [
          "Pablo Aimar",
          "Miguel Ángel Angulo",
          "Rubén Baraja",
          "Vicente Rodríguez"
        ],
        "a": 2,
        "hint": "Rubén Baraja y David Albelda fueron el doble pivote detrás de los títulos de Liga del Valencia de 2002 y 2004.",
        "en": "Rubén Baraja"
      },
      {
        "id": "q_8c9f62",
        "q": "¿A qué delantero noruego fichó el Valencia procedente del Rosenborg en 2000?",
        "o": [
          "Tore André Flo",
          "Jostein Flo",
          "Ole Gunnar Solskjær",
          "John Carew"
        ],
        "a": 3,
        "hint": "John Carew llegó al Valencia desde el Rosenborg en 2000 y jugó la final de la Liga de Campeones de 2001.",
        "en": "John Carew"
      },
      {
        "id": "q_6bcd28",
        "q": "¿Cuántas temporadas consecutivas terminó el Valencia tercero en Liga con Unai Emery?",
        "o": [
          "Dos",
          "Cuatro",
          "Una",
          "Tres"
        ],
        "a": 3,
        "hint": "El Valencia de Emery terminó tercero en 2009-10, 2010-11 y 2011-12, por detrás del Barcelona y el Real Madrid en cada una.",
        "en": "Three"
      },
      {
        "id": "q_8001d6",
        "q": "¿A qué club inglés eliminó el Valencia en las semifinales de la Liga de Campeones 2000-01?",
        "o": [
          "Leeds United",
          "Arsenal",
          "Manchester United",
          "Liverpool"
        ],
        "a": 0,
        "hint": "El Valencia empató 0-0 en Elland Road y ganó la vuelta 3-0 en Mestalla para eliminar al Leeds United y llegar a la final de 2001.",
        "en": "Leeds United"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes del Valencia?",
      "tasterPh": "Unas preguntas rápidas para medir tu Ball IQ del Valencia.",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz del Valencia",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Quiz del Valencia CF — Preguntas frecuentes",
      "aboutQ": "Sobre el quiz del Valencia CF",
      "bandH": "¿Crees que sabes del Valencia? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz del Valencia. La original, en inglés, está aquí:",
      "alsoLink": "Valencia quiz (English)",
      "statsLine": "Gratis · Preguntas del Valencia con respuestas explicadas · sin registro"
    }
  },
  {
    "club": "Real Sociedad",
    "slug": "real-sociedad",
    "lang": "es",
    "name": "Real Sociedad",
    "h1": "Quiz de la Real Sociedad",
    "title": "Quiz de la Real Sociedad | Ball IQ",
    "description": "Pon a prueba lo que sabes de la Real Sociedad: las Ligas de Ormaetxea, la Copa de La Cartuja, Arconada, Xabi Alonso e Isak.",
    "kind": "Quiz de club",
    "statLine": "Ligas, Copas y cantera: de Atotxa al Reale Arena",
    "playLabel": "Jugar el quiz",
    "intro": [
      "De Atotxa al Reale Arena, de las dos Ligas seguidas de principios de los ochenta a la Copa del Rey levantada a puerta cerrada en La Cartuja: la historia de la Real Sociedad tiene capítulos que cualquier txuri-urdin se sabe de memoria y detalles que separan al aficionado del erudito.",
      "Aquí hay preguntas sobre el gol de Zamora en El Molinón, sobre el título que se decidió por el particular con el Real Madrid, sobre la falta de Platini que persigue a Luis Arconada y sobre el fichaje de John Aldridge que cambió para siempre la política de cantera del club.",
      "También sobre lo moderno: la Real de Denoueix que aguantó hasta la última jornada, el penalti de Oyarzabal, la noche de Old Trafford y los traspasos de Xabi Alonso, Griezmann e Isak.",
      "Todas las respuestas están verificadas y cada pregunta lleva su pista. Juega y descubre hasta dónde llega tu Ball IQ realista."
    ],
    "faq": [
      {
        "q": "¿Cuántas Ligas ha ganado la Real Sociedad?",
        "a": "Dos, ganadas de forma consecutiva en la 1980-81 y la 1981-82, ambas con Alberto Ormaetxea en el banquillo. La primera se decidió por el particular ante el Real Madrid tras acabar empatados a 45 puntos."
      },
      {
        "q": "¿Cuándo dejó la Real Sociedad de fichar solo a jugadores vascos?",
        "a": "En 1989, con la llegada del delantero irlandés John Aldridge desde el Liverpool. Fue el primer jugador no vasco fichado por el club en más de cuatro décadas; Dalian Atkinson llegó al año siguiente."
      },
      {
        "q": "¿Qué gran título ganó la Real Sociedad en 2020?",
        "a": "La Copa del Rey de 2020, disputada en abril de 2021 en La Cartuja y ganada por 1-0 al Athletic Club con un penalti de Mikel Oyarzabal. Era su primer título importante desde la Copa de 1987."
      },
      {
        "q": "¿Dónde juega la Real Sociedad?",
        "a": "En el Reale Arena de San Sebastián, inaugurado en 1993 como Anoeta. La reforma terminada en octubre de 2019 eliminó la pista de atletismo y dejó el aforo en unos 40.000 espectadores."
      }
    ],
    "taster": [
      {
        "id": "q_6fe7d2",
        "q": "¿En qué año se fundó formalmente la Real Sociedad?",
        "o": [
          "1898",
          "1902",
          "1909",
          "1919"
        ],
        "a": 2,
        "hint": "El club se constituyó el 7 de septiembre de 1909, a partir del San Sebastián Recreation Club. El rey Alfonso XIII le concedió el título de 'Real' unos meses después, en febrero de 1910.",
        "en": "1909"
      },
      {
        "id": "q_d86e6b",
        "q": "¿Cuántas veces se ha proclamado campeona de Liga la Real Sociedad?",
        "o": [
          "Una vez",
          "Dos veces",
          "Tres veces",
          "Cuatro veces"
        ],
        "a": 1,
        "hint": "La Real Sociedad tiene dos títulos de Liga, ganados de forma consecutiva a principios de los años ochenta con Alberto Ormaetxea en el banquillo. No ha vuelto a ganarla desde entonces.",
        "en": "Twice"
      },
      {
        "id": "q_5f0bf6",
        "q": "La Real Sociedad jugó su último partido en Atotxa en 1993. ¿Qué estadio pasó a ser su nueva casa?",
        "o": [
          "San Mamés",
          "El Sadar",
          "Mendizorroza",
          "Anoeta"
        ],
        "a": 3,
        "hint": "Anoeta se inauguró en agosto de 1993 y hoy se conoce como Reale Arena. San Mamés pertenece al Athletic Club, El Sadar a Osasuna y Mendizorroza al Alavés.",
        "en": "Anoeta"
      },
      {
        "id": "q_c34330",
        "q": "John Aldridge fue el fichaje que puso fin a la larga tradición de la Real Sociedad de alinear solo a jugadores vascos. ¿A qué club se lo compró?",
        "o": [
          "Oxford United",
          "Liverpool",
          "Everton",
          "Newcastle United"
        ],
        "a": 1,
        "hint": "Aldridge pasó del Liverpool a la Real Sociedad el 14 de septiembre de 1989 por unos 1,25 millones de libras, y se convirtió en el primer jugador no vasco fichado por el club en más de cuatro décadas. Había llegado al Liverpool desde el Oxford United en enero de 1987, y por eso el Oxford es una respuesta errónea tan tentadora.",
        "en": "Liverpool"
      },
      {
        "id": "q_4f4af2",
        "q": "La final de la Copa del Rey de 2020 de la Real Sociedad se acabó jugando en abril de 2021 en La Cartuja, en Sevilla, y se resolvió por 1-0. ¿A qué equipo ganó para levantar el título?",
        "o": [
          "Valencia",
          "Athletic Club",
          "Real Betis",
          "Sevilla"
        ],
        "a": 1,
        "hint": "La Real Sociedad ganó 1-0 al Athletic Club en la primera final de Copa del Rey entre dos equipos vascos desde 1927, disputada a puerta cerrada por la pandemia.",
        "en": "Athletic Club"
      },
      {
        "id": "q_394a3e",
        "q": "¿Quién transformó el penalti del minuto 63 que dio a la Real Sociedad la Copa del Rey de 2020?",
        "o": [
          "Alexander Isak",
          "David Silva",
          "Mikel Oyarzabal",
          "Mikel Merino"
        ],
        "a": 2,
        "hint": "El capitán Mikel Oyarzabal engañó a Unai Simón desde los once metros después de que Portu fuera derribado en el área.",
        "en": "Mikel Oyarzabal"
      },
      {
        "id": "q_a1f3c3",
        "q": "Xabi Alonso se formó en la cantera de la Real Sociedad y dejó el club en agosto de 2004. ¿Qué equipo lo fichó?",
        "o": [
          "Liverpool",
          "Chelsea",
          "Real Madrid",
          "Bayern de Múnich"
        ],
        "a": 0,
        "hint": "El Liverpool pagó unos 10,5 millones de libras por él en 2004; sus traspasos al Real Madrid (2009) y al Bayern de Múnich (2014) llegaron mucho después.",
        "en": "Liverpool"
      },
      {
        "id": "q_268f2b",
        "q": "Antoine Griezmann, que entró en la cantera de la Real Sociedad siendo adolescente, fue traspasado en el verano de 2014. ¿Adónde fue?",
        "o": [
          "Barcelona",
          "Atlético de Madrid",
          "Valencia",
          "Real Madrid"
        ],
        "a": 1,
        "hint": "El Atlético de Madrid pagó unos 30 millones de euros en 2014 tras una temporada de 16 goles de Griezmann en Liga; su marcha al Barcelona no llegó hasta 2019.",
        "en": "Atlético Madrid"
      },
      {
        "id": "q_d76673",
        "q": "En agosto de 2022 la Real Sociedad ingresó el mayor traspaso de su historia por Alexander Isak. ¿Qué club lo compró?",
        "o": [
          "Arsenal",
          "Tottenham Hotspur",
          "Liverpool",
          "Newcastle United"
        ],
        "a": 3,
        "hint": "El Newcastle United pagó 70 millones de euros, entonces récord del club; la Real Sociedad había fichado a Isak del Borussia Dortmund por unos 10 millones en 2019.",
        "en": "Newcastle United"
      },
      {
        "id": "q_051ee5",
        "q": "¿En qué ciudad disputa la Real Sociedad sus partidos como local en el Reale Arena?",
        "o": [
          "Bilbao",
          "Vitoria-Gasteiz",
          "San Sebastián",
          "Pamplona"
        ],
        "a": 2,
        "hint": "El campo, conocido durante mucho tiempo simplemente como su estadio, está en San Sebastián (Donostia), capital de Gipuzkoa.",
        "en": "San Sebastián"
      }
    ],
    "sample": [
      {
        "id": "q_1aa6db",
        "q": "¿En qué año abandonó la Real Sociedad su política de fichar únicamente a jugadores vascos?",
        "o": [
          "1979",
          "1985",
          "1989",
          "1994"
        ],
        "a": 2,
        "hint": "La política se mantuvo hasta 1989, cuando el club fichó al delantero de la República de Irlanda John Aldridge, nacido en Liverpool. Dalian Atkinson llegó en 1990.",
        "en": "1989"
      },
      {
        "id": "q_238299",
        "q": "Un gol del empate en el último suspiro en el campo del Sporting de Gijón, en la última jornada de la 1980-81, dio a la Real Sociedad su primer título de Liga. ¿Quién lo marcó?",
        "o": [
          "Roberto López Ufarte",
          "Jesús María Zamora",
          "Jesús María Satrústegui",
          "Periko Alonso"
        ],
        "a": 1,
        "hint": "Jesús María Zamora marcó en los segundos finales en El Molinón para poner el 2-2 y arrebatar el campeonato. El Real Madrid había ganado su partido y llegó a creer por un momento que el título era suyo.",
        "en": "Jesús María Zamora"
      },
      {
        "id": "q_57b341",
        "q": "La Real Sociedad se llevó el campeonato de la 1980-81 por el particular tras acabar empatada a puntos con el subcampeón. ¿Qué club se quedó sin el título?",
        "o": [
          "Barcelona",
          "Atlético de Madrid",
          "Real Madrid",
          "Athletic Club"
        ],
        "a": 2,
        "hint": "Tanto la Real Sociedad como el Real Madrid terminaron con 45 puntos. El 3-1 de la Real en casa ante el Madrid pesó más que su derrota por 1-0 en la capital, y le dio el título.",
        "en": "Real Madrid"
      },
      {
        "id": "q_067903",
        "q": "¿Qué entrenador dirigía a la Real Sociedad en sus dos títulos de Liga?",
        "o": [
          "John Toshack",
          "Javier Clemente",
          "Miguel Muñoz",
          "Alberto Ormaetxea"
        ],
        "a": 3,
        "hint": "Alberto Ormaetxea, exjugador de la Real Sociedad, dirigió al equipo en el subcampeonato agónico de la 1979-80 y después en los títulos de la 1980-81 y la 1981-82.",
        "en": "Alberto Ormaetxea"
      },
      {
        "id": "q_cb7d3b",
        "q": "¿Quién era el entrenador de la Real Sociedad cuando ganó la Copa del Rey de 1987?",
        "o": [
          "Alberto Ormaetxea",
          "Luis Aragonés",
          "John Toshack",
          "Javier Clemente"
        ],
        "a": 2,
        "hint": "El galés John Toshack dirigió a la Real Sociedad entre 1985 y 1989 y ganó la Copa del Rey 1986-87, batiendo al Atlético de Madrid por 4-2 en los penaltis tras un 2-2 en La Romareda. Se marchó al Real Madrid en 1989 y más tarde volvió a San Sebastián en dos ocasiones.",
        "en": "John Toshack"
      },
      {
        "id": "q_ce5078",
        "q": "Dalian Atkinson, fichado del Sheffield Wednesday en 1990 una vez que la Real Sociedad abrió sus puertas a los no vascos, se quedó una sola temporada. ¿A qué club inglés fue después?",
        "o": [
          "Manchester City",
          "Aston Villa",
          "Ipswich Town",
          "Coventry City"
        ],
        "a": 1,
        "hint": "Atkinson fichó por el Aston Villa en 1991 por unos 1,6 millones de libras y en octubre de 1992 marcó en Wimbledon el gol en solitario elegido mejor gol de la temporada en la primera campaña de la Premier League. El Ipswich Town había sido su primer club.",
        "en": "Aston Villa"
      },
      {
        "id": "q_3b3d25",
        "q": "El momento más repetido de Luis Arconada llegó en la final de la Eurocopa de 1984, cuando una falta se le coló por debajo del cuerpo. ¿Quién la lanzó?",
        "o": [
          "Michel Platini",
          "Alain Giresse",
          "Jean Tigana",
          "Luis Fernández"
        ],
        "a": 0,
        "hint": "La falta de Michel Platini se deslizó por debajo del portero de la Real Sociedad y Francia acabó ganando por 2-0. En España el gol se sigue conociendo simplemente como 'el Arconada'.",
        "en": "Michel Platini"
      },
      {
        "id": "q_103183",
        "q": "¿Qué entrenador dirigía a la Real Sociedad que peleó la Liga hasta el final con el Real Madrid en la 2002-03?",
        "o": [
          "John Toshack",
          "Raynald Denoueix",
          "Philippe Montanier",
          "Martín Lasarte"
        ],
        "a": 1,
        "hint": "El francés Raynald Denoueix, antes en el Nantes, llevó a la Real Sociedad al segundo puesto en su primera temporada en España.",
        "en": "Raynald Denoueix"
      },
      {
        "id": "q_dfe900",
        "q": "La Real Sociedad terminó subcampeona de Liga en la 2002-03. ¿A cuánto acabó del campeón, el Real Madrid?",
        "o": [
          "Dos puntos",
          "Un punto",
          "Seis puntos",
          "Nueve puntos"
        ],
        "a": 0,
        "hint": "El Real Madrid terminó con 78 puntos por los 76 de la Real Sociedad, y cerró el título en la última jornada ante el Athletic.",
        "en": "Two points"
      },
      {
        "id": "q_5aec3d",
        "q": "Junto al turco Nihat Kahveci, el ataque de la Real Sociedad de la 2002-03 lo lideraba un delantero serbio que vivía su segunda etapa en el club. ¿Quién era?",
        "o": [
          "Savo Milošević",
          "Darko Kovačević",
          "Mateja Kežman",
          "Nikola Žigić"
        ],
        "a": 1,
        "hint": "Darko Kovačević jugó primero en la Real Sociedad entre 1996 y 1999, y volvió a mitad de la temporada 2001-02 tras sus etapas en la Juventus y la Lazio.",
        "en": "Darko Kovačević"
      },
      {
        "id": "q_e2ffb7",
        "q": "¿En qué temporada descendió la Real Sociedad de Primera a Segunda División?",
        "o": [
          "2004-05",
          "2008-09",
          "2006-07",
          "2001-02"
        ],
        "a": 2,
        "hint": "Terminó decimonovena en la 2006-07 y bajó a la segunda categoría, donde permaneció tres temporadas.",
        "en": "2006-07"
      },
      {
        "id": "q_55cdb2",
        "q": "La Copa del Rey levantada en La Cartuja fue el primer título importante de la Real Sociedad desde... ¿qué año?",
        "o": [
          "1987",
          "1982",
          "1993",
          "2003"
        ],
        "a": 0,
        "hint": "Su título anterior era la Copa del Rey de 1987; las dos Ligas consecutivas de 1981 y 1982 son todavía anteriores.",
        "en": "1987"
      }
    ],
    "copy": {
      "tasterEyebrow": "Muestra gratis · Sin registro",
      "tasterH": "¿Cuánto sabes de la Real Sociedad?",
      "tasterPh": "Prueba una pregunta antes de empezar",
      "tasterNote": "Preguntas de muestra — el quiz completo tiene muchas más.",
      "playSection": "Juega el quiz de la Real Sociedad",
      "playSub": "Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.",
      "faqH": "Preguntas frecuentes sobre la Real Sociedad",
      "aboutQ": "Sobre este quiz de la Real Sociedad",
      "bandH": "¿Crees que sabes de la Real Sociedad? Demuéstralo en la app.",
      "bandP": "Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.",
      "alsoH": "La misma página en inglés",
      "alsoP": "Esta página es la versión en español de nuestro quiz de la Real Sociedad. La original, en inglés, está aquí:",
      "alsoLink": "Real Sociedad quiz (English)",
      "statsLine": "Ligas, Copas y cantera: de Atotxa al Reale Arena"
    }
  }
];

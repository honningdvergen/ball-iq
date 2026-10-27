// grid-club-countries.mjs — which country a club plays in, for the grid's
// "played in Germany" squares (build-grid-pool.mjs, buildDailyPool).
//
// ⚠️ WRITTEN BY HAND, NOT DERIVED. mysteryPool.json carries a `country` beside
// each player's club, and it looks like the club's country. It is not: it is the
// player's. "Barcelona" appears with Spain, United Kingdom, Croatia, Germany,
// Ecuador and Denmark. leagues.mjs knows only this season's top flights, under
// page names rather than career names. So every club below was placed by hand,
// by its exact career-dictionary name (mysteryCareers.json).
//
// ⚠️ A MISSING CLUB IS SAFE, A WRONG ONE IS NOT. A spell at a club that is not
// listed simply does not count, and the judge says it cannot confirm the
// player. A club listed under the wrong country would accept a player who never
// played there. So when in doubt, a club is left out:
//   - AS Monaco plays in the French league but is in Monaco: not under France.
//   - Cardiff and Swansea play in the English league but are in Wales: not
//     under England.
//   - Reserve and B sides (Valencia Mestalla, Jong Ajax) are left out, like the
//     pool leaves them out of club squares.
//   - Names shared by clubs in two countries ("América Futebol Clube") are left out.
export const CLUB_COUNTRIES = {
  England: [
    'Chelsea F.C.', 'Liverpool F.C.', 'Manchester United F.C.', 'Manchester City F.C.', 'Arsenal F.C.',
    'Tottenham Hotspur F.C.', 'West Ham United F.C.', 'Aston Villa F.C.', 'Newcastle United F.C.', 'Fulham F.C.',
    'Everton F.C.', 'Sunderland A.F.C.', 'Crystal Palace F.C.', 'Nottingham Forest F.C.', 'Leicester City F.C.',
    'Leeds United F.C.', 'Southampton F.C.', 'Birmingham City F.C.', 'West Bromwich Albion F.C.',
    'Blackburn Rovers F.C.', 'Middlesbrough F.C.', 'Watford F.C.', 'Wolverhampton Wanderers F.C.',
    'Bolton Wanderers F.C.', 'Stoke City F.C.', 'Queens Park Rangers F.C.', 'Hull City A.F.C.', 'Derby County F.C.',
    'Wigan Athletic F.C.', 'Norwich City F.C.', 'Brighton & Hove Albion F.C.', 'Reading F.C.', 'Portsmouth F.C.',
    'Burnley F.C.', 'AFC Bournemouth', 'Ipswich Town F.C.', 'Charlton Athletic F.C.', 'Sheffield United F.C.',
    'Coventry City F.C.', 'Sheffield Wednesday F.C.', 'Brentford F.C.', 'Blackpool F.C.', 'Preston North End F.C.',
    'Bristol City F.C.', 'Huddersfield Town A.F.C.', 'Barnsley F.C.', 'Millwall F.C.',
  ],
  Spain: [
    'FC Barcelona', 'Real Madrid Club de Fútbol', 'Atlético Madrid', 'Valencia CF', 'Sevilla FC', 'Villarreal CF',
    'RCD Espanyol de Barcelona', 'Real Betis Balompié', 'Deportivo de A Coruña', 'RC Celta de Vigo', 'Real Sociedad',
    'RCD Mallorca', 'Real Zaragoza', 'Levante UD', 'Rayo Vallecano', 'Getafe CF', 'Málaga CF', 'Real Valladolid',
    'Deportivo Alavés', 'Granada CF', 'Racing de Santander', 'Athletic Club', 'Club Atlético Osasuna', 'Girona FC',
    'Sporting de Gijón', 'UD Las Palmas', 'Elche CF', 'Unión Deportiva Almería', 'SD Eibar', 'Albacete Balompié',
    'C.D. Tenerife',
  ],
  Italy: [
    'Inter Milan', 'AC Milan', 'Juventus FC', 'AS Roma', 'ACF Fiorentina', 'SSC Napoli', 'Genoa CFC', 'SS Lazio',
    'U.C. Sampdoria', 'Torino FC', 'Parma Calcio 1913', 'Atalanta BC', 'Udinese Calcio', 'Bologna F.C. 1909',
    'Hellas Verona FC', 'Cagliari Calcio', 'Palermo F.C.', 'Empoli FC', 'Brescia Calcio', 'AC ChievoVerona',
    'A.C. Perugia Calcio', 'US Sassuolo Calcio', 'US Lecce', 'AC Cesena', 'SSC Bari', 'Delfino Pescara 1936',
    'Como 1907', 'Siena FC', 'Calcio Padova', 'Catania FC',
  ],
  Germany: [
    'FC Bayern Munich', 'Bayer 04 Leverkusen', 'Borussia Dortmund', 'VfB Stuttgart', 'Hamburger SV', 'Schalke 04',
    'SV Werder Bremen', 'Borussia Mönchengladbach', 'VfL Wolfsburg', 'Eintracht Frankfurt', '1. FC Köln', 'Hertha BSC',
    'TSG 1899 Hoffenheim', 'Hannover 96', '1. FC Kaiserslautern', '1. FC Nürnberg', '1. FSV Mainz 05', 'RB Leipzig',
    'SC Freiburg', 'VfL Bochum', 'Fortuna Düsseldorf', 'FC Augsburg', 'TSV 1860 München', 'Karlsruher SC',
    '1. FC Union Berlin',
  ],
  France: [
    'Olympique de Marseille', 'Paris Saint-Germain FC', 'Olympique Lyonnais', 'FC Girondins de Bordeaux', 'Lille OSC',
    'Stade Rennais F.C.', 'AS Saint-Étienne', 'OGC Nice', 'FC Nantes', 'Toulouse FC', 'R.C. Lens', 'AJ Auxerre',
    'FC Metz', 'RC Strasbourg Alsace', 'FC Sochaux-Montbéliard', 'F.C. Lorient', 'Montpellier Hérault Sport Club',
    'SC Bastia', 'Stade de Reims', 'Le Havre AC',
  ],
  Netherlands: [
    'AFC Ajax', 'PSV Eindhoven', 'Feyenoord Rotterdam', 'FC Twente', 'AZ Alkmaar', 'SBV Vitesse', 'SC Heerenveen',
    'FC Utrecht', 'FC Groningen',
  ],
  Portugal: ['S.L. Benfica', 'FC Porto', 'Sporting CP', 'S.C. Braga'],
  Brazil: [
    'São Paulo FC', 'Clube de Regatas do Flamengo', 'S.C. Corinthians Paulista', 'Santos F.C.',
    'Sociedade Esportiva Palmeiras', 'Cruzeiro E.C.', 'Grêmio FBPA', 'CR Vasco da Gama', 'S.C. Internacional',
    'Clube Atlético Mineiro', 'Fluminense F.C.', 'Botafogo F.R.', 'Club Athletico Paranaense', 'Guarani Futebol Clube',
    'E.C. Vitória', 'Esporte Clube Bahia', 'Coritiba F.C.', 'Associação Portuguesa de Desportos',
    'Sport Club do Recife', 'Goiás Esporte Clube', 'Figueirense Futebol Clube', 'Esporte Clube Juventude',
    'Associação Atlética Ponte Preta', 'Associação Desportiva São Caetano',
  ],
  Argentina: [
    'Club Atlético River Plate', 'Boca Juniors', 'Club Atlético Independiente', 'San Lorenzo de Almagro',
    'Estudiantes de La Plata', "Newell's Old Boys", 'Argentinos Juniors', 'Club Atlético Rosario Central',
    'Club Atlético Vélez Sarsfield',
  ],
  Turkey: [
    'Galatasaray S.K.', 'Fenerbahçe Istanbul', 'Beşiktaş J.K. (Football)', 'Trabzonspor', 'İstanbul Başakşehir F.K.',
    'Bursaspor', 'Gençlerbirliği S.K.',
  ],
};

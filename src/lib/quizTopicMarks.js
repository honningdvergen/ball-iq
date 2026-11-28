// A quiz topic's lead mark: a league's country flag, every other topic one grey
// line icon. Moved out of screens/QuizScreen.jsx on 26 Nov 2026 so the question
// card (screens/QuizEngine.jsx) can wear the same marks without pulling the
// Quiz topic screen and its stylesheet into the engine's chunk. One set, two
// screens: QuizScreen re-exports both tables, so quiz-topic.test.js still holds
// them in step with src/data/nationFlags.json.
//
// The flags are the files src/data/nationFlags.json names (England's own cross,
// not the Union flag), written out here so the 151-nation table stays off both
// chunks. Fetched as plain pictures. Never a league's logo: those are the
// leagues' trademarks, and the app has no licence.
import { ClipboardList, Globe, Medal, ScrollText, Star, Trophy } from "lucide-react";

export const QUIZ_LEAGUE_FLAGS = {
  PL: "flags/england.png", LaLiga: "flags/spain.png", SerieA: "flags/italy.png",
  Bundesliga: "flags/germany.png", Ligue1: "flags/france.png", SuperLig: "flags/turkey.png",
  Primeira: "flags/portugal.png",
};
// THE TOPIC LINE MUST NOT ANSWER THE QUESTION (28 Nov 2026). The question card
// says its topic with the league's flag: "Süper Lig" and Turkey's flag stood
// over "In which country's top division does Beşiktaş play?" in Alex's Daily 7
// ("Obvious everyone knows it is turkey"). When the right answer names the
// topic's country or the topic itself, the card says the round's name instead.
// In a quiz the player picked by that topic, the line stays: they chose it.
export const QUIZ_LEAGUE_COUNTRY = {
  PL: "England", LaLiga: "Spain", SerieA: "Italy", Bundesliga: "Germany",
  Ligue1: "France", SuperLig: "Turkey", Primeira: "Portugal",
};
const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
export function topicAnswersQuestion(q, topicLabel) {
  if (!q?.cat) return false;
  const right = Array.isArray(q.o) && typeof q.a === "number" ? q.o[q.a] : q.typed_a;
  const r = fold(right);
  if (!r) return false;
  return [QUIZ_LEAGUE_COUNTRY[q.cat], topicLabel].map(fold).filter(Boolean)
    .some((w) => r === w || r.includes(w) || (r.length >= 4 && w.includes(r)));
}
// Every other topic: one plain grey line icon.
export const QUIZ_TOPIC_ICONS = { UCL: Trophy, WorldCup: Globe, Euros: Star, Managers: ClipboardList, Records: Medal };
// Legends is a topic of its own on the question card (the bank's cat "Legends");
// on the Quiz topic screen it sits in Mix with this same icon.
export const LEGENDS_ICON = ScrollText;

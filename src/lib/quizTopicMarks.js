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
// Every other topic: one plain grey line icon.
export const QUIZ_TOPIC_ICONS = { UCL: Trophy, WorldCup: Globe, Euros: Star, Managers: ClipboardList, Records: Medal };
// Legends is a topic of its own on the question card (the bank's cat "Legends");
// on the Quiz topic screen it sits in Mix with this same icon.
export const LEGENDS_ICON = ScrollText;

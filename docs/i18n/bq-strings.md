# .bq quiz widget — UI strings for review

Drafted 2026-09-05 (Claude). The 46 localised club pages switch from the old taster to the .bq widget **per language, once its column is approved** — set the language in `BQ_I18N_REVIEWED` (scripts/seo/bq-i18n.mjs). English is the engine's built-in default. `{placeholders}` are filled at runtime and must stay.

Source: `scripts/seo/bq-i18n.mjs`. Edit there, not here; this file is a view.

## es

| key | English | es |
|---|---|---|
| `question` | Question | Pregunta |
| `of` | of | de |
| `next` | Next question → | Siguiente → |
| `seeResult` | See your result → | Ver tu resultado → |
| `srCorrect` | Correct.  | Correcto.  |
| `srWrong` | Incorrect. The answer is  | Incorrecto. La respuesta es  |
| `ariaCorrect` | Correct answer:  | Respuesta correcta:  |
| `ariaWrong` | Your answer, incorrect:  | Tu respuesta, incorrecta:  |
| `why` | Why | Por qué |
| `streakWord` | streak | seguidas |
| `yourIq` | Your {name} IQ | Tu Ball IQ de {name} |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} de {n} correctas · {pct}% · mejor racha {best} |
| `daysRow` | {d} days in a row | {d} días seguidos |
| `keepGoing` | Keep going — {more} more → | Seguir — {more} más → |
| `playAgain` | Play again | Jugar otra vez |
| `share` | Share your {name} IQ | Compartir tu Ball IQ de {name} |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Esas son todas las preguntas de {name} que tenemos aquí — mañana, en otro orden. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | También en la app — rachas, recordatorios y 1v1 en directo → |
| `footleTitle` | Today's Footle | El Footle de hoy |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Adivina el futbolista en seis. Un nombre nuevo a medianoche, el mismo para todos. |
| `play` | Play → | Jugar → |
| `namePrompt` | Add your first name to the score card? (optional) | ¿Añadir tu nombre a la tarjeta de puntuación? (opcional) |
| `copied` | Copied ✓ | Copiado ✓ |
| `copyPrompt` | Copy your score | Copia tu puntuación |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Mi Ball IQ de {name} es {iq} — {tier} ({sc}/{n}). Supéralo. |
| `quizTitle` | {name} quiz | Quiz de {name} |
| `lenLabel` | Change the length | Cambiar la longitud |
| `fullSet` | Full set | Todas |
| `quick` | {n} Quick | {n} rápidas |
| `standard` | {n} Standard | {n} estándar |
| `todaySet` | Today's {name} set | Set de {name} de hoy |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — un orden nuevo cada día |
| `yourStreak` | Your streak | Tu racha |
| `dayOk` | day {n} ✓ | día {n} ✓ |
| `dayKeep` | day {n} — keep it going | día {n} — no la pierdas |
| `youPlayed` | You played | Ya jugaste |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | hoy antes {sc} de {n}, IQ {iq} |
| `diff_easy` | easy | fácil |
| `diff_medium` | medium | media |
| `diff_hard` | hard | difícil |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | De paso · Aficionado · Abonado · Local y visitante · Historiador del club · Leyenda del club |

## de

| key | English | de |
|---|---|---|
| `question` | Question | Frage |
| `of` | of | von |
| `next` | Next question → | Weiter → |
| `seeResult` | See your result → | Ergebnis ansehen → |
| `srCorrect` | Correct.  | Richtig.  |
| `srWrong` | Incorrect. The answer is  | Falsch. Die Antwort ist  |
| `ariaCorrect` | Correct answer:  | Richtige Antwort:  |
| `ariaWrong` | Your answer, incorrect:  | Deine Antwort, falsch:  |
| `why` | Why | Warum |
| `streakWord` | streak | in Folge |
| `yourIq` | Your {name} IQ | Dein {name}-Ball IQ |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} von {n} richtig · {pct}% · beste Serie {best} |
| `daysRow` | {d} days in a row | {d} Tage in Folge |
| `keepGoing` | Keep going — {more} more → | Weitermachen — noch {more} → |
| `playAgain` | Play again | Nochmal spielen |
| `share` | Share your {name} IQ | Deinen {name}-Ball IQ teilen |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Das waren alle {name}-Fragen, die wir hier haben — morgen in neuer Reihenfolge. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Auch in der App — Serien, Erinnerungen und Live-1v1 → |
| `footleTitle` | Today's Footle | Das Footle von heute |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Errate den Fußballer in sechs Versuchen. Um Mitternacht ein neuer Name, für alle derselbe. |
| `play` | Play → | Spielen → |
| `namePrompt` | Add your first name to the score card? (optional) | Vornamen auf die Ergebniskarte setzen? (optional) |
| `copied` | Copied ✓ | Kopiert ✓ |
| `copyPrompt` | Copy your score | Kopiere dein Ergebnis |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Mein {name}-Ball IQ ist {iq} — {tier} ({sc}/{n}). Schlag das. |
| `quizTitle` | {name} quiz | {name}-Quiz |
| `lenLabel` | Change the length | Länge ändern |
| `fullSet` | Full set | Alle |
| `quick` | {n} Quick | {n} kurz |
| `standard` | {n} Standard | {n} standard |
| `todaySet` | Today's {name} set | Das {name}-Set von heute |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — jeden Tag eine neue Reihenfolge |
| `yourStreak` | Your streak | Deine Serie |
| `dayOk` | day {n} ✓ | Tag {n} ✓ |
| `dayKeep` | day {n} — keep it going | Tag {n} — halt sie am Leben |
| `youPlayed` | You played | Du hast gespielt |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | heute schon {sc} von {n}, IQ {iq} |
| `diff_easy` | easy | leicht |
| `diff_medium` | medium | mittel |
| `diff_hard` | hard | schwer |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | Tagesgast · Gelegenheitsfan · Dauerkarte · Heim und Auswärts · Vereinshistoriker · Vereinslegende |

## nl

| key | English | nl |
|---|---|---|
| `question` | Question | Vraag |
| `of` | of | van |
| `next` | Next question → | Volgende → |
| `seeResult` | See your result → | Bekijk je score → |
| `srCorrect` | Correct.  | Goed.  |
| `srWrong` | Incorrect. The answer is  | Fout. Het antwoord is  |
| `ariaCorrect` | Correct answer:  | Juiste antwoord:  |
| `ariaWrong` | Your answer, incorrect:  | Jouw antwoord, fout:  |
| `why` | Why | Waarom |
| `streakWord` | streak | op rij |
| `yourIq` | Your {name} IQ | Jouw {name} Ball IQ |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} van {n} goed · {pct}% · beste reeks {best} |
| `daysRow` | {d} days in a row | {d} dagen op rij |
| `keepGoing` | Keep going — {more} more → | Doorgaan — nog {more} → |
| `playAgain` | Play again | Nog een keer |
| `share` | Share your {name} IQ | Deel je {name} Ball IQ |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Dat waren alle {name}-vragen die we hier hebben — morgen in een nieuwe volgorde. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Ook in de app — reeksen, herinneringen en live 1v1 → |
| `footleTitle` | Today's Footle | De Footle van vandaag |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Raad de voetballer in zes beurten. Om middernacht een nieuwe naam, dezelfde voor iedereen. |
| `play` | Play → | Spelen → |
| `namePrompt` | Add your first name to the score card? (optional) | Je voornaam op de scorekaart? (optioneel) |
| `copied` | Copied ✓ | Gekopieerd ✓ |
| `copyPrompt` | Copy your score | Kopieer je score |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Mijn {name} Ball IQ is {iq} — {tier} ({sc}/{n}). Doe beter. |
| `quizTitle` | {name} quiz | {name}-quiz |
| `lenLabel` | Change the length | Lengte aanpassen |
| `fullSet` | Full set | Alles |
| `quick` | {n} Quick | {n} snel |
| `standard` | {n} Standard | {n} standaard |
| `todaySet` | Today's {name} set | De {name}-set van vandaag |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — elke dag een nieuwe volgorde |
| `yourStreak` | Your streak | Je reeks |
| `dayOk` | day {n} ✓ | dag {n} ✓ |
| `dayKeep` | day {n} — keep it going | dag {n} — houd hem vast |
| `youPlayed` | You played | Je speelde |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | eerder vandaag {sc} van {n}, IQ {iq} |
| `diff_easy` | easy | makkelijk |
| `diff_medium` | medium | gemiddeld |
| `diff_hard` | hard | moeilijk |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | Dagjesmens · Gewone fan · Seizoenkaart · Thuis en uit · Clubhistoricus · Clublegende |

## fr

| key | English | fr |
|---|---|---|
| `question` | Question | Question |
| `of` | of | sur |
| `next` | Next question → | Suivant → |
| `seeResult` | See your result → | Voir ton résultat → |
| `srCorrect` | Correct.  | Correct.  |
| `srWrong` | Incorrect. The answer is  | Faux. La réponse est  |
| `ariaCorrect` | Correct answer:  | Bonne réponse :  |
| `ariaWrong` | Your answer, incorrect:  | Ta réponse, fausse :  |
| `why` | Why | Pourquoi |
| `streakWord` | streak | d’affilée |
| `yourIq` | Your {name} IQ | Ton Ball IQ {name} |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} sur {n} bonnes · {pct}% · meilleure série {best} |
| `daysRow` | {d} days in a row | {d} jours d’affilée |
| `keepGoing` | Keep going — {more} more → | Continuer — encore {more} → |
| `playAgain` | Play again | Rejouer |
| `share` | Share your {name} IQ | Partager ton Ball IQ {name} |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | C’étaient toutes les questions {name} que nous avons ici — un nouvel ordre demain. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Aussi dans l’appli — séries, rappels et 1v1 en direct → |
| `footleTitle` | Today's Footle | Le Footle du jour |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Devine le footballeur en six essais. Un nouveau nom à minuit, le même pour tous. |
| `play` | Play → | Jouer → |
| `namePrompt` | Add your first name to the score card? (optional) | Ajouter ton prénom sur la carte de score ? (facultatif) |
| `copied` | Copied ✓ | Copié ✓ |
| `copyPrompt` | Copy your score | Copie ton score |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Mon Ball IQ {name} est de {iq} — {tier} ({sc}/{n}). Fais mieux. |
| `quizTitle` | {name} quiz | Quiz {name} |
| `lenLabel` | Change the length | Changer la longueur |
| `fullSet` | Full set | Toutes |
| `quick` | {n} Quick | {n} rapides |
| `standard` | {n} Standard | {n} standard |
| `todaySet` | Today's {name} set | La série {name} du jour |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — un nouvel ordre chaque jour |
| `yourStreak` | Your streak | Ta série |
| `dayOk` | day {n} ✓ | jour {n} ✓ |
| `dayKeep` | day {n} — keep it going | jour {n} — ne la lâche pas |
| `youPlayed` | You played | Tu as joué |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | plus tôt aujourd’hui {sc} sur {n}, IQ {iq} |
| `diff_easy` | easy | facile |
| `diff_medium` | medium | moyen |
| `diff_hard` | hard | difficile |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | De passage · Supporter occasionnel · Abonné · Domicile et extérieur · Historien du club · Légende du club |

## it

| key | English | it |
|---|---|---|
| `question` | Question | Domanda |
| `of` | of | di |
| `next` | Next question → | Avanti → |
| `seeResult` | See your result → | Vedi il tuo risultato → |
| `srCorrect` | Correct.  | Giusto.  |
| `srWrong` | Incorrect. The answer is  | Sbagliato. La risposta è  |
| `ariaCorrect` | Correct answer:  | Risposta giusta:  |
| `ariaWrong` | Your answer, incorrect:  | La tua risposta, sbagliata:  |
| `why` | Why | Perché |
| `streakWord` | streak | di fila |
| `yourIq` | Your {name} IQ | Il tuo Ball IQ {name} |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} su {n} giuste · {pct}% · miglior serie {best} |
| `daysRow` | {d} days in a row | {d} giorni di fila |
| `keepGoing` | Keep going — {more} more → | Continua — altre {more} → |
| `playAgain` | Play again | Gioca ancora |
| `share` | Share your {name} IQ | Condividi il tuo Ball IQ {name} |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Erano tutte le domande su {name} che abbiamo qui — domani in un nuovo ordine. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Anche nell’app — serie, promemoria e 1v1 dal vivo → |
| `footleTitle` | Today's Footle | Il Footle di oggi |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Indovina il calciatore in sei tentativi. Un nome nuovo a mezzanotte, lo stesso per tutti. |
| `play` | Play → | Gioca → |
| `namePrompt` | Add your first name to the score card? (optional) | Aggiungere il tuo nome alla card del punteggio? (facoltativo) |
| `copied` | Copied ✓ | Copiato ✓ |
| `copyPrompt` | Copy your score | Copia il tuo punteggio |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Il mio Ball IQ {name} è {iq} — {tier} ({sc}/{n}). Battilo. |
| `quizTitle` | {name} quiz | Quiz {name} |
| `lenLabel` | Change the length | Cambia la lunghezza |
| `fullSet` | Full set | Tutte |
| `quick` | {n} Quick | {n} veloci |
| `standard` | {n} Standard | {n} standard |
| `todaySet` | Today's {name} set | Il set {name} di oggi |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — un ordine nuovo ogni giorno |
| `yourStreak` | Your streak | La tua serie |
| `dayOk` | day {n} ✓ | giorno {n} ✓ |
| `dayKeep` | day {n} — keep it going | giorno {n} — non fermarti |
| `youPlayed` | You played | Hai giocato |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | prima oggi {sc} su {n}, IQ {iq} |
| `diff_easy` | easy | facile |
| `diff_medium` | medium | media |
| `diff_hard` | hard | difficile |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | Di passaggio · Tifoso occasionale · Abbonato · Casa e trasferta · Storico del club · Leggenda del club |

## pt

| key | English | pt |
|---|---|---|
| `question` | Question | Pergunta |
| `of` | of | de |
| `next` | Next question → | Próxima → |
| `seeResult` | See your result → | Ver seu resultado → |
| `srCorrect` | Correct.  | Certo.  |
| `srWrong` | Incorrect. The answer is  | Errado. A resposta é  |
| `ariaCorrect` | Correct answer:  | Resposta certa:  |
| `ariaWrong` | Your answer, incorrect:  | Sua resposta, errada:  |
| `why` | Why | Por quê |
| `streakWord` | streak | seguidas |
| `yourIq` | Your {name} IQ | Seu Ball IQ do {name} |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} de {n} certas · {pct}% · melhor sequência {best} |
| `daysRow` | {d} days in a row | {d} dias seguidos |
| `keepGoing` | Keep going — {more} more → | Continuar — mais {more} → |
| `playAgain` | Play again | Jogar de novo |
| `share` | Share your {name} IQ | Compartilhar seu Ball IQ do {name} |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Essas são todas as perguntas do {name} que temos aqui — amanhã, em outra ordem. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Também no app — sequências, lembretes e 1v1 ao vivo → |
| `footleTitle` | Today's Footle | O Footle de hoje |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Adivinhe o jogador em seis tentativas. Um nome novo à meia-noite, o mesmo para todos. |
| `play` | Play → | Jogar → |
| `namePrompt` | Add your first name to the score card? (optional) | Adicionar seu nome ao cartão de pontuação? (opcional) |
| `copied` | Copied ✓ | Copiado ✓ |
| `copyPrompt` | Copy your score | Copie sua pontuação |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Meu Ball IQ do {name} é {iq} — {tier} ({sc}/{n}). Supera essa. |
| `quizTitle` | {name} quiz | Quiz do {name} |
| `lenLabel` | Change the length | Mudar a quantidade |
| `fullSet` | Full set | Todas |
| `quick` | {n} Quick | {n} rápidas |
| `standard` | {n} Standard | {n} padrão |
| `todaySet` | Today's {name} set | O set do {name} de hoje |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — uma ordem nova todo dia |
| `yourStreak` | Your streak | Sua sequência |
| `dayOk` | day {n} ✓ | dia {n} ✓ |
| `dayKeep` | day {n} — keep it going | dia {n} — não perca |
| `youPlayed` | You played | Você jogou |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | hoje mais cedo {sc} de {n}, IQ {iq} |
| `diff_easy` | easy | fácil |
| `diff_medium` | medium | média |
| `diff_hard` | hard | difícil |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | De passagem · Torcedor casual · Sócio-torcedor · Em casa e fora · Historiador do clube · Lenda do clube |

## tr

| key | English | tr |
|---|---|---|
| `question` | Question | Soru |
| `of` | of | / |
| `next` | Next question → | Sonraki → |
| `seeResult` | See your result → | Sonucunu gör → |
| `srCorrect` | Correct.  | Doğru.  |
| `srWrong` | Incorrect. The answer is  | Yanlış. Cevap:  |
| `ariaCorrect` | Correct answer:  | Doğru cevap:  |
| `ariaWrong` | Your answer, incorrect:  | Senin cevabın, yanlış:  |
| `why` | Why | Neden |
| `streakWord` | streak | seri |
| `yourIq` | Your {name} IQ | {name} Ball IQ’n |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {n} sorudan {sc} doğru · %{pct} · en iyi seri {best} |
| `daysRow` | {d} days in a row | {d} gün üst üste |
| `keepGoing` | Keep going — {more} more → | Devam et — {more} soru daha → |
| `playAgain` | Play again | Tekrar oyna |
| `share` | Share your {name} IQ | {name} Ball IQ’ni paylaş |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Buradaki tüm {name} soruları bunlardı — yarın yeni bir sırayla. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Uygulamada da — seriler, hatırlatmalar ve canlı 1v1 → |
| `footleTitle` | Today's Footle | Bugünün Footle’ı |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Futbolcuyu altı denemede tahmin et. Gece yarısı yeni bir isim, herkes için aynı. |
| `play` | Play → | Oyna → |
| `namePrompt` | Add your first name to the score card? (optional) | Skor kartına adını ekleyelim mi? (isteğe bağlı) |
| `copied` | Copied ✓ | Kopyalandı ✓ |
| `copyPrompt` | Copy your score | Skorunu kopyala |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | {name} Ball IQ’m {iq} — {tier} ({sc}/{n}). Geç bakalım. |
| `quizTitle` | {name} quiz | {name} quizi |
| `lenLabel` | Change the length | Uzunluğu değiştir |
| `fullSet` | Full set | Hepsi |
| `quick` | {n} Quick | {n} hızlı |
| `standard` | {n} Standard | {n} standart |
| `todaySet` | Today's {name} set | Bugünün {name} seti |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — her gün yeni bir sıra |
| `yourStreak` | Your streak | Serin |
| `dayOk` | day {n} ✓ | {n}. gün ✓ |
| `dayKeep` | day {n} — keep it going | {n}. gün — devam et |
| `youPlayed` | You played | Oynadın |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | bugün daha önce {n} sorudan {sc}, IQ {iq} |
| `diff_easy` | easy | kolay |
| `diff_medium` | medium | orta |
| `diff_hard` | hard | zor |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | Günübirlik · Sıradan taraftar · Kombineli · İç saha ve deplasman · Kulüp tarihçisi · Kulüp efsanesi |

## id

| key | English | id |
|---|---|---|
| `question` | Question | Pertanyaan |
| `of` | of | dari |
| `next` | Next question → | Berikutnya → |
| `seeResult` | See your result → | Lihat skormu → |
| `srCorrect` | Correct.  | Benar.  |
| `srWrong` | Incorrect. The answer is  | Salah. Jawabannya adalah  |
| `ariaCorrect` | Correct answer:  | Jawaban benar:  |
| `ariaWrong` | Your answer, incorrect:  | Jawabanmu, salah:  |
| `why` | Why | Kenapa |
| `streakWord` | streak | berturut-turut |
| `yourIq` | Your {name} IQ | Ball IQ {name} kamu |
| `right` | {sc} of {n} right · {pct}% · best streak {best} | {sc} dari {n} benar · {pct}% · rentetan terbaik {best} |
| `daysRow` | {d} days in a row | {d} hari berturut-turut |
| `keepGoing` | Keep going — {more} more → | Lanjut — {more} lagi → |
| `playAgain` | Play again | Main lagi |
| `share` | Share your {name} IQ | Bagikan Ball IQ {name} kamu |
| `allDone` | That is every {name} question we have here — a fresh order tomorrow. | Itu semua pertanyaan {name} yang kami punya di sini — besok dengan urutan baru. |
| `appLine` | Also in the app — streaks, reminders and live 1v1 → | Juga di aplikasi — rentetan, pengingat, dan 1v1 langsung → |
| `footleTitle` | Today's Footle | Footle hari ini |
| `footleLine` | Guess the footballer in six. A new name at midnight, the same for everyone. | Tebak pesepakbolanya dalam enam percobaan. Nama baru tiap tengah malam, sama untuk semua. |
| `play` | Play → | Main → |
| `namePrompt` | Add your first name to the score card? (optional) | Tambahkan namamu ke kartu skor? (opsional) |
| `copied` | Copied ✓ | Tersalin ✓ |
| `copyPrompt` | Copy your score | Salin skormu |
| `shareTxt` | My {name} IQ is {iq} — {tier} ({sc}/{n}). Beat that. | Ball IQ {name} saya {iq} — {tier} ({sc}/{n}). Kalahkan itu. |
| `quizTitle` | {name} quiz | Kuis {name} |
| `lenLabel` | Change the length | Ubah jumlah soal |
| `fullSet` | Full set | Semua |
| `quick` | {n} Quick | {n} cepat |
| `standard` | {n} Standard | {n} standar |
| `todaySet` | Today's {name} set | Set {name} hari ini |
| `freshOrder` |  · {date} — a fresh order every day |  · {date} — urutan baru setiap hari |
| `yourStreak` | Your streak | Rentetanmu |
| `dayOk` | day {n} ✓ | hari ke-{n} ✓ |
| `dayKeep` | day {n} — keep it going | hari ke-{n} — jangan putus |
| `youPlayed` | You played | Kamu sudah main |
| `earlier` | earlier today {sc} of {n}, IQ {iq} | tadi {sc} dari {n}, IQ {iq} |
| `diff_easy` | easy | mudah |
| `diff_medium` | medium | sedang |
| `diff_hard` | hard | sulit |
| `tiers` | Day Tripper · Casual Fan · Season Ticket · Home & Away · Club Historian · Club Legend | Sekali lewat · Fan santai · Pemegang tiket musiman · Kandang dan tandang · Sejarawan klub · Legenda klub |


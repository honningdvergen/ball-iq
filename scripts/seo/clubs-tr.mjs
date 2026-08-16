// Turkish club pages — PILOT (one page: Galatasaray).
//
// WHY TURKISH, AND WHY IT IS FIRST
//
// It is the counter-intuitive pick, and that is the point of testing it. The
// naive order for localisation is by fanbase size, which would put Bayern and
// Real Madrid first. But a localised page only pays where the audience would
// otherwise FAIL TO FIND US, or would search in a THINNER SERP — and on both
// counts Turkey outranks the bigger badges:
//
//   - Lower English proficiency than Germany or the Netherlands, so the English
//     page genuinely does not reach the same people.
//   - Fanatical, high-engagement audiences.
//   - A thin Turkish football-quiz SERP compared with the English one, which is
//     crowded with established quiz sites.
//   - We already hold all four Süper Lig clubs at 38-45 verified questions each
//     (Galatasaray 45, Trabzonspor 45, Beşiktaş 39, Fenerbahçe 38), so there is
//     no content cost to testing it.
//
// ONE club, not four. The hypothesis under test is the MARKET, not the badge —
// a second Turkish club would tell us nothing the first does not. If Turkish
// converts, the other three are a cheap follow-up.
//
// ⚠️ CONTEXT WHEN READING THIS LATER: on 2026-07-29 GSC reported 15 pages as
// "Discovered – currently not indexed". That is Google saying it knows about
// those URLs and has chosen not to index them, which is the one condition under
// which adding page VOLUME reliably does not help. So this file is an
// experiment, deliberately small, not the start of a rollout.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as clubs-es.mjs and clubs-pt.mjs. Every entry carries `id`, the
// id of the English question in src/questions.js it was translated from, and
// gen-seo-pages.mjs enforces at build time that the id still resolves and that
// the answer keys still agree. Translated prose answers declare the exact
// English string via `en`, which is the tripwire if the original is reworded.
//
// So this file asserts no new facts. Each already survived the three-stage forge
// in English; translating preserves a fact rather than inventing one.
//
// Turkish register: the club's own vocabulary, because this page exists for
// people who use it — Cimbom, Aslan, Süper Lig, UEFA Kupası, Türkiye Kupası.
// Football terms follow Turkish usage: "teknik direktör" not "menajer",
// "kaleci", "forvet", "orta saha". Diacritics are correct and load-bearing
// (Şükür, Beşiktaş, Fenerbahçe, İstanbul) — getting them wrong is exactly the
// tell that a page was machine-translated.

export const CLUBS_TR = [
  {
    club: 'Galatasaray',           // must match the `club` field in src/questions.js
    slug: 'galatasaray',           // shared with the English page: /quiz/galatasaray/
    lang: 'tr',
    name: 'Galatasaray',
    h1: 'Galatasaray Quiz',
    title: 'Galatasaray Quiz — Cimbom Bilgi Yarışması | Ball IQ',
    description:
      'Ücretsiz Galatasaray quiz, açıklamalı cevaplarla: 2000 UEFA Kupası, Fatih Terim, Hagi, Metin Oktay ve rekor sezonlar.',
    kind: 'Kulüp quizi',
    statLine: 'Ücretsiz · Açıklamalı Galatasaray soruları · kayıt yok',
    playLabel: 'Quize başla',
    intro: [
      'Türkiye’nin en çok şampiyonluk kazanan kulübü, aynı zamanda Avrupa’da ilk büyük kupayı kazanan Türk takımı. Bu ücretsiz quiz Cimbom’un bütün dönemlerini kapsıyor: Kopenhag’da Arsenal’i penaltılarla geçtiği 2000 UEFA Kupası, Fatih Terim’in o kadrosu, Gheorghe Hagi ve Gheorghe Popescu, Taçsız Kral Metin Oktay, ve 102 puanla tamamlanan 2023-24 sezonu.',
      'Sorular gerçekten zorlaşıyor. Kulüp tarihinin tartışmalı olduğu yerlerde taraf tutmak yerine soruyu hiç yayınlamamayı tercih ediyoruz. Yayınlanan, doğrulanabilen şeydir.',
      'Galatasaray setindeki her cevabın yazılı bir açıklaması var; yani yanlış bir cevap da size kulübün kazandıklarını nasıl kazandığını anlatıyor.',
    ],
    faq: [
      {
        q: 'Galatasaray quiz ücretsiz mi?',
        a: 'Evet. Doğrudan tarayıcıda oynanıyor, kayıt olmadan ve hiçbir şey indirmeden. Bu sayfadaki bütün sorular ücretsiz.',
      },
      {
        q: 'Quiz hangi konuları kapsıyor?',
        a: 'Kulüp tarihi, 2000 UEFA Kupası ve UEFA Süper Kupası, Fatih Terim dönemi, Hagi ve Popescu, Metin Oktay, Hakan Şükür, Muslera, Okan Buruk ile gelen şampiyonluklar, 2023-24’ün rekor sezonu ve Fenerbahçe derbileri. Kolaydan gerçekten zora doğru ilerliyor.',
      },
      {
        q: 'Sorular nereden geliyor?',
        a: 'Hepsi elle yazılıyor ve elle doğrulanıyor, hiçbiri otomatik üretilmiyor. Her bilgi yayınlanmadan önce iki bağımsız kontrolden geçiyor; doğrulanamayan bir şey varsa o soru yayınlanmıyor.',
      },
      {
        // The honest disclosure — and the single most useful thing this pilot
        // can measure. Same line as the Spanish and Portuguese pages.
        q: 'Ball IQ uygulaması Türkçe mi?',
        a: 'Henüz değil: bu sayfa Türkçe, ama uygulama İngilizce. Çeviri yapmadan önce ilgiyi ölçüyoruz — buraya kadar geldiyseniz, bu kararı vermemize zaten yardım ediyorsunuz.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_8aacfc', en: 'Istanbul', q: 'Galatasaray hangi şehirde kurulu bir futbol kulübü?', o: ['Ankara', 'İzmir', 'İstanbul', 'Bursa'], a: 2, hint: 'Kulüp 1905’te bir lisede kuruldu ve maçlarını şehrin Avrupa yakasında oynuyor.' },
      { id: 'q_8f00c6', en: 'Red and yellow', q: 'Galatasaray’ın geleneksel kulüp renkleri hangileri?', o: ['Kırmızı ve sarı', 'Mavi ve sarı', 'Siyah ve beyaz', 'Yeşil ve kırmızı'], a: 0, hint: 'Bu renkler 1908’de benimsendi ve kulübe “sarı-kırmızılılar” denmesinin sebebi.' },
      { id: 'q_40751a', q: '2025 itibarıyla en fazla Süper Lig şampiyonluğu rekoru hangi kulübe aitti?', o: ['Fenerbahçe', 'Beşiktaş', 'Galatasaray', 'Trabzonspor'], a: 2, hint: 'Rekor, 2023-24’teki şampiyonlukla birlikte bir kez daha uzatıldı.' },
      { id: 'q_6a9fe2', q: '2000 UEFA Kupası finalinde Kopenhag’da penaltılarla hangi İngiliz kulübünü yendi?', o: ['Leeds United', 'Arsenal', 'Liverpool', 'Chelsea'], a: 1, hint: 'Maç 120 dakika sonunda golsüz bitti ve seri penaltılara gitti.' },
      { id: 'q_63e6a5', q: '2000 UEFA Kupası’nı kazandığında Galatasaray’ın teknik direktörü kimdi?', o: ['Mircea Lucescu', 'Fatih Terim', 'Frank Rijkaard', 'Cesare Prandelli'], a: 1, hint: '“İmparator” lakaplı teknik direktör, aynı sezon ligi de kazanarak ayrıldı.' },
      { id: 'q_c31705', q: 'Hangi Galatasaray efsanesi 2002’de sadece 10,8 saniyede Dünya Kupası tarihinin en hızlı golünü attı?', o: ['Hakan Şükür', 'Hasan Şaş', 'Ümit Davala', 'Arda Turan'], a: 0, hint: 'Gol, Güney Kore’ye karşı üçüncülük maçında geldi ve rekor hâlâ kırılmadı.' },
      { id: 'q_4c498e', q: 'Romen playmaker Gheorghe Hagi 1996’da hangi İspanyol kulübünden Galatasaray’a geldi?', o: ['Real Madrid', 'Barcelona', 'Valencia', 'Atlético Madrid'], a: 1, hint: 'Kariyerinde iki büyük İspanyol kulübünde de oynadı; İstanbul’a ikincisinden geldi.' },
      { id: 'q_402213', q: '2011-2024 arasında Galatasaray formasıyla 400’den fazla maç oynayan Uruguaylı kaleci kim?', o: ['Fernando Muslera', 'Martín Campaña', 'Sebastián Sosa', 'Sergio Rochet'], a: 0, hint: 'On üç yıl kalede kaldı ve kulüp tarihinin en çok maç yapan yabancı oyuncularından biri oldu.' },
      { id: 'q_220fba', en: 'Cimbom', q: 'Galatasaray’ın taraftarların ilk yıllardan beri kullandığı en bilinen takma adı hangisi?', o: ['Kanaryalar', 'Cimbom', 'Kara Kartallar', 'Fırtına'], a: 1, hint: 'Diğer üç lakap Fenerbahçe, Beşiktaş ve Trabzonspor’a ait.' },
      { id: 'q_dc1c98', en: 'Lion', q: '2001’de kurulan UltrAslan, “Ultras” kelimesini Türkçedeki hangi kelimeyle birleştiriyor?', o: ['Kartal', 'Aslan', 'Ateş', 'Fırtına'], a: 1, hint: 'Aynı hayvan kulübün sembolü ve tribünlerin en çok kullandığı imge.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_be65f3', q: '2000 UEFA Kupası finalinin penaltılarında Galatasaray adına iki kurtarış yapan Dünya Kupası şampiyonu Brezilyalı kaleci kim?', o: ['Claudio Taffarel', 'Dida', 'Júlio César', 'Marcos'], a: 0, hint: '1994’te Brezilya ile dünya şampiyonu olmuştu ve Kopenhag’da seriyi çeviren kurtarışları yaptı.' },
      { id: 'q_ef99a0', q: 'Arsenal’e karşı 2000 UEFA Kupası finalinin penaltı serisinde belirleyici vuruşu kim yaptı?', o: ['Gheorghe Hagi', 'Gheorghe Popescu', 'Hakan Şükür', 'Ergün Penbe'], a: 1, hint: 'Aynı ülkeden gelen iki Gheorghe’den defansta oynayan olan attı.' },
      { id: 'q_6dc7b9', q: 'Mário Jardel’in altın golüyle kazanılan 2000 UEFA Süper Kupası’nda rakip hangi kulüptü?', o: ['Real Madrid', 'Bayern Münih', 'Manchester United', 'Barcelona'], a: 0, hint: 'Rakip o yılın Şampiyonlar Ligi şampiyonuydu ve maç Monako’da oynandı.' },
      { id: 'q_7799d5', q: '1993-94 Şampiyonlar Ligi’nde, taraftarların “Welcome to Hell” pankartıyla karşıladığı hangi kulüp Galatasaray’a elendi?', o: ['Manchester United', 'Arsenal', 'Barcelona', 'AC Milan'], a: 0, hint: 'İlk maç Manchester’da 3-3 bitti, İstanbul’daki 0-0 turu getirdi.' },
      { id: 'q_e83f39', q: 'Altı kez gol kralı olan ve “Taçsız Kral” diye anılan 1960’ların Galatasaray forveti kim?', o: ['Metin Oktay', 'Hakan Şükür', 'Tanju Çolak', 'Cevad Prekazi'], a: 0, hint: 'Eski stadın önündeki heykel ona ait ve adı kulüp kültürünün merkezinde.' },
      { id: 'q_b4e72d', q: 'Galatasaray formasıyla 39 lig golü atarak 1987-88 Avrupa Altın Ayakkabı’sını kazanan Türk forvet kim?', o: ['Hakan Şükür', 'Tanju Çolak', 'Aykut Kocaman', 'Feyyaz Uçar'], a: 1, hint: 'Bu ödülü kazanan tek Türk futbolcu ve o sezon ligde rakipsizdi.' },
      { id: 'q_376072', q: '2023-24 Süper Lig’i kazanırken Galatasaray kaç puan topladı — dönemin Türkiye rekoru?', o: ['96', '99', '102', '105'], a: 2, hint: 'Şampiyonluk son haftaya kadar Fenerbahçe ile başa baş gitti ve iki takım da 99 puanın üzerine çıktı.' },
      { id: 'q_5ee512', q: '1996 Türkiye Kupası finalini kazandıktan sonra Fenerbahçe’nin sahasına kulüp bayrağı diken teknik direktör kim?', o: ['Fatih Terim', 'Graeme Souness', 'Mircea Lucescu', 'Gheorghe Hagi'], a: 1, hint: 'İskoç teknik direktör, Liverpool ve Rangers’ta oynadıktan sonra kısa bir dönem İstanbul’da çalıştı.' },
      { id: 'q_77d21e', q: 'Haziran 2022’de teknik direktör olan ve 2022-23 Süper Lig şampiyonluğunu kazandıran eski Galatasaray orta saha oyuncusu kim?', o: ['Okan Buruk', 'Hasan Şaş', 'Tugay Kerimoğlu', 'Arda Turan'], a: 0, hint: '2000 UEFA Kupası’nı kazanan kadronun içindeydi ve yıllar sonra aynı kulübe teknik direktör olarak döndü.' },
      { id: 'q_2b2200', q: '2011’de Atlético Madrid’e satılan ve sonra Türkiye’nin kaptanlığını yapan Galatasaray altyapı oyuncusu kim?', o: ['Arda Turan', 'Selçuk İnan', 'Hamit Altıntop', 'Sabri Sarıoğlu'], a: 0, hint: 'İspanya’da hem Madrid’in iki kulübünden birinde hem de Barcelona’da forma giydi.' },
      { id: 'q_78b8cc', q: '2000 UEFA Kupası finalinde omzu çıkmış hâlde oynamaya devam eden ve sonra kupayı kaldıran Galatasaray kaptanı kim?', o: ['Ergün Penbe', 'Bülent Korkmaz', 'Ümit Davala', 'Suat Kaya'], a: 1, hint: 'Stoper, kulüpte on beş yıldan fazla kaldı ve kariyerinin tamamına yakınını burada geçirdi.' },
      { id: 'q_a5dbad', en: 'Heavy snowfall', q: 'Aralık 2013’te Juventus ile oynanan Şampiyonlar Ligi maçı yaklaşık yarım saat sonra hangi sebeple tatil edildi?', o: ['Aydınlatma arızası', 'Yoğun kar yağışı', 'Tribün olayları', 'Sahanın su tutması'], a: 1, hint: 'Maç ertesi gün kaldığı yerden oynandı ve Galatasaray turu geçti.' },
    ],
    copy: {
      tasterEyebrow: 'Ücretsiz deneme · Kayıt yok',
      tasterH: 'Galatasaray’ı ne kadar iyi biliyorsun?',
      tasterPh: 'Cimbom Ball IQ’nu ölçmek için on hızlı soru.',
      tasterNote: 'Örnek sorular — quizin tamamında çok daha fazlası var.',
      playSection: 'Galatasaray quizini oyna',
      playSub: 'Kontrol etmek için bir cevaba dokun — anında doğru/yanlış ve arkasındaki hikâye.',
      faqH: 'Galatasaray Quiz — Sıkça sorulan sorular',
      aboutQ: 'Galatasaray quizi hakkında',
      bandH: 'Cimbom’u bildiğini mi düşünüyorsun? Uygulamada kanıtla.',
      bandP: 'Serileri, canlı 1v1, 99 üzerinden bir puan — ve bütün quizler tek uygulamada. Uygulama İngilizce.',
      alsoH: 'Aynı sayfanın İngilizcesi',
      alsoP: 'Bu sayfa Galatasaray quizimizin Türkçe sürümü. Soruların tamamı orijinalinde:',
      alsoLink: 'Galatasaray quiz (English)',
      statsLine: 'Ball IQ’daki Galatasaray soruları üç zorluk seviyesinde: kolay, orta ve zor — hepsi açıklamalı.',
    },
  },
];

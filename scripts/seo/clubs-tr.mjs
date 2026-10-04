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
        a: 'Hepsi kaynaklara dayanılarak araştırılıyor ve tek tek doğrulanıyor. Her bilgi yayınlanmadan önce iki bağımsız kontrolden geçiyor; doğrulanamayan bir şey varsa o soru yayınlanmıyor.',
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
  // ── THE OTHER THREE (2026-10-04) ───────────────────────────────────────────
  // The pilot above said that if Turkish converts, Fenerbahçe, Beşiktaş and
  // Trabzonspor are a cheap follow-up. These are that follow-up, under the same
  // contract: every taster and sample row is a translation of a bank id.
  {
    club: 'Fenerbahçe',
    slug: 'fenerbahce',
    lang: 'tr',
    name: 'Fenerbahçe',
    h1: 'Fenerbahçe Quiz',
    title: 'Fenerbahçe Quiz — Sarı Kanaryalar Bilgi Yarışması | Ball IQ',
    description:
      'Ücretsiz Fenerbahçe quiz, açıklamalı cevaplarla: Lefter, Alex de Souza, Bolić’in Old Trafford golü ve Zico’yla 2008 çeyrek finali.',
    kind: 'Kulüp quizi',
    statLine: 'Ücretsiz · Açıklamalı Fenerbahçe soruları · kayıt yok',
    playLabel: 'Quize başla',
    intro: [
      'Fenerbahçe 1907’de İstanbul’un Anadolu yakasında, Kadıköy’de kuruldu; kurucuları Ziya Songülen, Ayetullah Bey ve Necip Okaner’di. Bu ücretsiz quiz Sarı Kanaryalar’ın bütün hikâyesini kapsıyor: sarı-lacivert renkler, Şükrü Saracoğlu’nun uğultusu, Lefter’den Alex de Souza’ya uzanan efsaneler, Bolić’in Old Trafford golü ve Zico’yla gelen 2008 Şampiyonlar Ligi çeyrek finali.',
      'Sorular orta zorlukta başlıyor ve giderek gerçekten zorlaşıyor: Avrupa geceleri, transferler, teknik direktörler ve Galatasaray’la oynanan Kıtalararası Derbi. Kulüp tarihinin tartışmalı olduğu bir yerde taraf tutmaktansa o soruyu yayınlamamayı seçiyoruz; burada gördüğünüz her bilgi doğrulanabilir.',
      'Fenerbahçe setindeki her cevabın yazılı bir açıklaması var; yani yanlış bir cevap bile size bir şey anlatıyor: Bolić’in 1996’daki golünün neden bu kadar önemli olduğunu ya da 2013-14’te gelen 19. Süper Lig şampiyonluğunun hikâyesini.',
    ],
    faq: [
      {
        q: 'Fenerbahçe quiz ücretsiz mi?',
        a: 'Evet. Doğrudan tarayıcıda oynanıyor; kayıt olmanız ya da bir şey indirmeniz gerekmiyor. Bu sayfadaki bütün sorular ücretsiz.',
      },
      {
        q: 'Quiz hangi konuları kapsıyor?',
        a: 'Kulüp tarihi ve 1907’deki kuruluş, Lefter Küçükandonyadis ve Zeki Rıza Sporel, Alex de Souza dönemi, 1996’da Old Trafford’da alınan 1-0, Zico ile 2007-08 Şampiyonlar Ligi çeyrek finali, Christoph Daum’un üst üste şampiyonlukları, Şükrü Saracoğlu ve Galatasaray’la Kıtalararası Derbi. Zorluk giderek artıyor.',
      },
      {
        q: 'Sorular nereden geliyor?',
        a: 'Her soru kaynaklara dayanılarak araştırılıyor ve doğrulanıyor. Her bilgi yayınlanmadan önce iki bağımsız kontrolden geçiyor; doğrulanamayan bir bilgi varsa o soru yayınlanmıyor.',
      },
      {
        q: 'Ball IQ uygulaması Türkçe mi?',
        a: 'Henüz değil: bu sayfa Türkçe, fakat uygulama İngilizce. Çeviriye geçmeden önce ilgiyi ölçüyoruz; bu sayfaya kadar geldiyseniz, o kararı vermemize şimdiden yardım ediyorsunuz.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_b92b40', q: 'Fenerbahçe Spor Kulübü hangi yıl kuruldu?', o: ['1903', '1905', '1907', '1911'], a: 2, hint: 'Fenerbahçe 1907’de İstanbul’un Kadıköy semtinde kuruldu.' },
      { id: 'q_7b887e', q: 'Fenerbahçe, sonradan Süper Lig adını alacak ilk Türkiye milli liginin şampiyonluğunu hangi yıl kazandı?', o: ['1957', '1959', '1961', '1963'], a: 1, hint: 'Fenerbahçe, 1959’da oynanan ilk Türkiye ligi sezonunun şampiyonu oldu.' },
      { id: 'q_b23d78', q: 'Fenerbahçe, kulüp efsanesi Alex de Souza’yı 2004’te hangi Brezilya kulübünden transfer etti?', o: ['Palmeiras', 'Cruzeiro', 'Corinthians', 'São Paulo'], a: 1, hint: 'Alex, 2004’te yaklaşık 5 milyon euroya Cruzeiro’dan Fenerbahçe’ye geldi.' },
      { id: 'q_167fb0', q: '1996’da Old Trafford’da attığı golle Fenerbahçe’ye 1-0’lık galibiyeti getiren ve Manchester United’ın Avrupa’da onlarca yıllık iç saha yenilmezliğini bitiren oyuncu kim?', o: ['Elvir Bolić', 'Aykut Kocaman', 'Saffet Sancaklı', 'Tayfun Korkut'], a: 0, hint: 'Elvir Bolić’in 1996’daki golü, United’ın Old Trafford’daki Avrupa yenilmezlik serisini sona erdirdi.' },
      { id: 'q_93366b', q: '2007-08 Şampiyonlar Ligi’nde çeyrek finale uzanan yolda Fenerbahçe’nin teknik direktörü olan Brezilyalı efsane kim?', o: ['Christoph Daum', 'Zico', 'Luiz Felipe Scolari', 'Vanderlei Luxemburgo'], a: 1, hint: 'Zico, 2007-08’de Fenerbahçe’yi Şampiyonlar Ligi’nde ilk kez çeyrek finale taşıdı.' },
      { id: 'q_ba16e6', q: '2008’de Sevilla’daki penaltı atışlarında üç penaltı kurtararak Fenerbahçe’yi ilk Şampiyonlar Ligi çeyrek finaline gönderen kaleci kim?', o: ['Rüştü Reçber', 'Volkan Demirel', 'Serdar Kulbilge', 'Mert Günok'], a: 1, hint: 'Volkan Demirel, Sevilla karşısındaki seride üç penaltı kurtardı.' },
      { id: 'q_734340', q: '2007-08 Şampiyonlar Ligi çeyrek finalinin ilk maçında Fenerbahçe evinde hangi İngiliz kulübünü 2-1 yendi?', o: ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester United'], a: 1, hint: 'Fenerbahçe, 2008 çeyrek finalinin ilk maçında Chelsea’yi evinde 2-1 yendi.' },
      { id: 'q_96f47f', q: 'Fenerbahçe’nin Kadıköy’deki stadına Şükrü Saracoğlu’nun adı hangi yıl verildi?', o: ['1988', '1995', '1998', '2002'], a: 2, hint: 'Stadın adı 1998’de Şükrü Saracoğlu Stadyumu olarak değiştirildi.' },
      { id: 'q_170e7e', en: 'The Intercontinental Derby', q: 'Fenerbahçe ile Galatasaray arasındaki ateşli rekabet halk arasında hangi adla bilinir?', o: ['Kıtalararası Derbi', 'Ebedi Derbi', 'Old Firm', 'Boğaziçi Clásico'], a: 0, hint: 'Fenerbahçe-Galatasaray maçı Kıtalararası Derbi olarak bilinir.' },
      { id: 'q_9c9aa3', q: 'Fenerbahçe, Robin van Persie’yi 2015’te hangi kulüpten transfer etti?', o: ['Arsenal', 'Manchester United', 'Manchester City', 'Feyenoord'], a: 1, hint: 'Van Persie, 2015’te Manchester United’dan Fenerbahçe’ye geldi.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_fd1fb9', q: 'Fenerbahçe 2007-08’de ilk kez Şampiyonlar Ligi çeyrek finaline yükselirken son 16 turunda hangi takımı penaltılarla geçti?', o: ['Valencia', 'Sevilla', 'Villarreal', 'Roma'], a: 1, hint: 'Fenerbahçe, toplamda 5-5 biten eşleşmede Sevilla’yı penaltılarla geçip son sekize kaldı.' },
      { id: 'q_ea99a9', q: '2008 Şampiyonlar Ligi son 16 turu ilk maçında Sevilla’ya karşı evinde kazanılan 3-2’lik maçta oyuna sonradan girip geç gelen galibiyet golünü kim attı?', o: ['Alex de Souza', 'Semih Şentürk', 'Mateja Kežman', 'Deivid'], a: 1, hint: 'Yedek kulübesinden gelen Semih Şentürk, 87. dakikada Sevilla’ya karşı galibiyet golünü attı.' },
      { id: 'q_aa647e', q: 'Alex de Souza, şampiyonlukla biten 2010-11 sezonunda Süper Lig gol krallığını kaç golle kazandı?', o: ['22', '25', '28', '31'], a: 2, hint: 'Alex, 2010-11 Süper Lig’ini 28 golle gol kralı olarak tamamladı.' },
      { id: 'q_175b03', q: 'Alex de Souza, Mayıs 2011’de bir Süper Lig maçında hangi rakibe beş gol attı?', o: ['Gençlerbirliği', 'Ankaragücü', 'Kayserispor', 'Bursaspor'], a: 1, hint: 'Alex, Mayıs 2011’de Ankaragücü’ne üçü penaltıdan olmak üzere beş gol attı.' },
      { id: 'q_e32b44', q: 'Fenerbahçe taraftarları efsane Lefter Küçükandonyadis’e, normalde seçkin profesörlere verilen hangi unvanı lakap olarak taktı?', o: ['Ordinaryüs', 'İmparator', 'Sultan', 'Efsane'], a: 0, hint: 'Taraftarlar, zekice oyununu onurlandırmak için Lefter’e ‘Ordinaryüs’ dedi.' },
      { id: 'q_0f208a', q: 'Fenerbahçe formasıyla 140 Süper Lig golü atan ve sonradan kulübü teknik direktör olarak da çalıştıran eski Fenerbahçe forveti kim?', o: ['Alex de Souza', 'Aykut Kocaman', 'Semih Şentürk', 'Zeki Rıza Sporel'], a: 1, hint: 'Aykut Kocaman, Fenerbahçe’de 140 Süper Lig golü attı ve daha sonra kulübün teknik direktörlüğünü yaptı.' },
      { id: 'q_479d63', q: '1996’da Old Trafford’da alınan ünlü Şampiyonlar Ligi galibiyetinde Fenerbahçe’nin Brezilyalı teknik direktörü kimdi?', o: ['Sebastião Lazaroni', 'Zico', 'Carlos Alberto Parreira', 'Vanderlei Luxemburgo'], a: 0, hint: 'Sebastião Lazaroni, 1996’daki Old Trafford galibiyetinde Fenerbahçe’nin teknik direktörüydü.' },
      { id: 'q_a0dde6', q: '1968-69 Avrupa Kupası ilk turunda Fenerbahçe, o dönemin İngiltere şampiyonu olan hangi kulübü eledi?', o: ['Leeds United', 'Manchester City', 'Manchester United', 'Liverpool'], a: 1, hint: 'Fenerbahçe, 1968-69 Avrupa Kupası’nda İngiltere şampiyonu Manchester City’yi eledi.' },
      { id: 'q_3d0bac', en: '2003-04 and 2004-05', q: 'Christoph Daum, Fenerbahçe’ye hangi iki sezonda üst üste Süper Lig şampiyonluğu yaşattı?', o: ['2001-02 ve 2002-03', '2003-04 ve 2004-05', '2004-05 ve 2005-06', '2005-06 ve 2006-07'], a: 1, hint: 'Daum, Fenerbahçe ile 2003-04 ve 2004-05’te üst üste şampiyon oldu.' },
      { id: 'q_66dc8d', q: 'Dünya Kupası şampiyonu sol bek Roberto Carlos hangi dönemde Fenerbahçe’de oynadı?', o: ['2005-2007', '2006-2008', '2007-2009', '2008-2010'], a: 2, hint: 'Roberto Carlos, 2007-2009 arasında Fenerbahçe forması giydi.' },
      { id: 'q_ba84c3', q: 'Fenerbahçe 2012-13’te ilk kez bir Avrupa kupasında yarı finale çıktı ve toplam skorda hangi kulübe elendi?', o: ['Benfica', 'Porto', 'Chelsea', 'Basel'], a: 0, hint: 'Benfica, 2012-13 Avrupa Ligi yarı finalinde Fenerbahçe’yi toplam skorda geçti.' },
      { id: 'q_1997c4', q: 'Robin van Persie, Kasım 2016’da Galatasaray’a karşı evinde kazanılan derbide iki gol attı; maç kaç kaç bitti?', o: ['2-0', '3-1', '2-1', '4-2'], a: 0, hint: 'Van Persie’nin iki golü, Kasım 2016’da Fenerbahçe’ye Galatasaray karşısında 2-0’lık derbi galibiyeti getirdi.' },
    ],
    copy: {
      tasterEyebrow: 'Ücretsiz deneme · Kayıt yok',
      tasterH: 'Fenerbahçe’yi ne kadar iyi biliyorsun?',
      tasterPh: 'Kanarya Ball IQ’nu ölçmek için on hızlı soru.',
      tasterNote: 'Örnek sorular — quizin tamamında çok daha fazlası var.',
      playSection: 'Fenerbahçe quizini oyna',
      playSub: 'Kontrol etmek için bir cevaba dokun — anında doğru/yanlış ve arkasındaki hikâye.',
      faqH: 'Fenerbahçe Quiz — Sıkça sorulan sorular',
      aboutQ: 'Fenerbahçe quizi hakkında',
      bandH: 'Sarı Kanaryalar’ı bildiğini mi düşünüyorsun? Uygulamada kanıtla.',
      bandP: 'Serileri, canlı 1v1, 99 üzerinden bir puan — ve bütün quizler tek uygulamada. Uygulama İngilizce.',
      alsoH: 'Aynı sayfanın İngilizcesi',
      alsoP: 'Bu sayfa Fenerbahçe quizimizin Türkçe sürümü. Soruların tamamı orijinalinde:',
      alsoLink: 'Fenerbahçe quiz (English)',
      statsLine: 'Ball IQ’daki Fenerbahçe soruları farklı zorluk seviyelerinde — hepsi açıklamalı.',
    },
  },
  {
    club: 'Besiktas',
    slug: 'besiktas',
    lang: 'tr',
    name: 'Beşiktaş',
    h1: 'Beşiktaş Quiz',
    title: 'Beşiktaş Quiz — Kara Kartal Bilgi Yarışması | Ball IQ',
    description:
      'Ücretsiz Beşiktaş quiz, açıklamalı cevaplarla: yenilgisiz 1991-92 sezonu, Çarşı, Kara Kartal, Metin-Ali-Feyyaz ve İstanbul derbileri.',
    kind: 'Kulüp quizi',
    statLine: 'Ücretsiz · Açıklamalı Beşiktaş soruları · kayıt yok',
    playLabel: 'Quize başla',
    intro: [
      'Beşiktaş 1903’te kuruldu, futbol şubesi 1911’de geldi ve kulüp tarihinin büyük bölümünü Boğaz’ın Avrupa yakasında, Dolmabahçe Sarayı’nın gölgesinde geçirdi. Bu ücretsiz quiz Kara Kartal’ın bütün hikâyesini kapsıyor: siyah-beyaz çubuklar, Çarşı tribünü, Gordon Milne’in yenilgisiz 1991-92 sezonu ve İstanbul derbileri.',
      'Sorular kolay başlıyor ama gerçekten zorlaşıyor: Metin-Ali-Feyyaz üçlüsü, Avrupa geceleri, teknik direktörler ve kulübün kült kahramanları. Kulüp tarihinin tartışmalı olduğu bir yerde taraf tutmak yerine o soruyu yayınlamıyoruz; yayınlanan her bilgi doğrulanabilir.',
      'Beşiktaş setindeki her cevabın yazılı bir açıklaması var; yanlış bir cevap bile size bir şey öğretiyor: 1991-92’de hiç yenilmeyen kadroyu, Sergen Yalçın’ın 2020-21’de teknik direktör olarak getirdiği lig ve kupa çiftini ya da 2016’da eski İnönü Stadı’nın yerinde yeniden inşa edilen statı.',
    ],
    faq: [
      {
        q: 'Beşiktaş quiz ücretsiz mi?',
        a: 'Evet. Doğrudan tarayıcıda oynanıyor; kayıt olmanız ya da bir şey indirmeniz gerekmiyor. Bu sayfadaki bütün sorular ücretsiz.',
      },
      {
        q: 'Quiz hangi konuları kapsıyor?',
        a: 'Kulüp tarihi ve 1903’teki kuruluş, Kara Kartal lakabı ve siyah-beyaz renkler, Çarşı, İnönü Stadı, Gordon Milne’in yenilgisiz 1991-92 sezonu, Metin-Ali-Feyyaz üçlüsü, Sergen Yalçın, Avrupa geceleri ve Fenerbahçe ile Galatasaray derbileri. Kolaydan gerçekten zora doğru ilerliyor.',
      },
      {
        q: 'Sorular nereden geliyor?',
        a: 'Her soru kaynaklara dayanılarak araştırılıyor ve doğrulanıyor. Her bilgi yayınlanmadan önce iki bağımsız kontrolden geçiyor; doğrulanamayan bir bilgi varsa o soru yayınlanmıyor.',
      },
      {
        q: 'Ball IQ uygulaması Türkçe mi?',
        a: 'Henüz değil: bu sayfa Türkçe, fakat uygulama İngilizce. Çeviriye geçmeden önce ilgiyi ölçüyoruz; bu sayfaya kadar geldiyseniz, o kararı vermemize şimdiden yardım ediyorsunuz.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_aa5ac0', q: 'Beşiktaş hangi şehrin kulübü?', o: ['Ankara', 'İstanbul', 'İzmir', 'Bursa'], a: 1, hint: 'Beşiktaş, İstanbul’un Avrupa yakasında bir ilçe; kulüp adını oradan alıyor.' },
      { id: 'q_569905', en: 'Black and white', q: 'Beşiktaş’ın geleneksel kulüp renkleri hangileri?', o: ['Sarı ve lacivert', 'Kırmızı ve sarı', 'Siyah ve beyaz', 'Bordo ve mavi'], a: 2, hint: 'Beşiktaş siyah-beyaz çubuklu formayla oynuyor; Siyah Beyazlılar denmesinin sebebi de bu.' },
      { id: 'q_49a0ec', q: 'Beşiktaş hangi yıl kuruldu?', o: ['1903', '1891', '1923', '1911'], a: 0, hint: 'Kulübün kökeni, Serencebey’de bir jimnastik derneğinin kurulduğu Mart 1903’e dayanıyor.' },
      { id: 'q_c5fd15', en: 'Galatasaray and Fenerbahçe', q: 'Beşiktaş, İstanbul’un “üç büyükleri”nden biri. Diğer ikisi hangileri?', o: ['Trabzonspor ve Bursaspor', 'Galatasaray ve Fenerbahçe', 'Başakşehir ve Kasımpaşa', 'Göztepe ve Altay'], a: 1, hint: 'Galatasaray, Fenerbahçe ve Beşiktaş, Türk futbolunun İstanbul’daki üç tarihi devi.' },
      { id: 'q_661602', q: 'Beşiktaş’ın ünlü taraftar grubunun adı ne?', o: ['Ultras Nord', 'Çarşı', 'Genç Fenerbahçeliler', 'UltrAslan'], a: 1, hint: '‘Pazar yeri’ anlamına gelen Çarşı, adını Beşiktaş ilçesinin merkezindeki çarşıdan alıyor.' },
      { id: 'q_3168a8', en: 'İnönü Stadium', q: '2013’te yıkılana kadar Beşiktaş’ın evi olan stat hangisiydi?', o: ['İnönü Stadı', 'Şeref Stadı', 'Kadıköy Stadı', 'Alsancak Stadı'], a: 0, hint: 'İnönü Stadı, 1947’den yeni bir arenaya yer açmak için yıkıldığı 2013’e kadar Beşiktaş’a ev sahipliği yaptı.' },
      { id: 'q_7cd803', q: '2017’de Real Madrid’den bedelsiz olarak Beşiktaş’a gelen Portekizli stoper kim?', o: ['Bruno Alves', 'Pepe', 'Ricardo Carvalho', 'José Fonte'], a: 1, hint: 'Pepe, 2016-17 sezonunun sonunda Real Madrid’den ayrıldı ve Beşiktaş’la bedelsiz anlaştı.' },
      { id: 'q_a84cc9', q: '2013-2023 arasında on yıl Beşiktaş’ta oynayan Kanadalı orta saha oyuncusu kim?', o: ['Jonathan Osorio', 'Junior Hoilett', 'Atiba Hutchinson', 'Cyle Larin'], a: 2, hint: 'Atiba Hutchinson 2013’te geldi, takımın kaptanlığını yaptı ve İstanbul’daki on yılın ardından ayrıldı.' },
      { id: 'q_56e38a', q: 'Beşiktaş hangi sezonda Süper Lig’i hiç maç kaybetmeden kazandı?', o: ['1989-90', '1994-95', '1991-92', '1990-91'], a: 2, hint: 'Beşiktaş 1991-92’yi yenilgisiz tamamladı: 30 maçta 23 galibiyet, 7 beraberlik.' },
      { id: 'q_18ef62', q: '1989-90’dan 1991-92’ye kadar Beşiktaş’ı üst üste üç Süper Lig şampiyonluğuna taşıyan İngiliz teknik direktör kim?', o: ['Gordon Milne', 'Terry Venables', 'Bobby Robson', 'Roy Hodgson'], a: 0, hint: 'Gordon Milne 1987’de göreve geldi ve üst üste üç şampiyonluk getirdi.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_ccb0db', en: 'Their centenary', q: 'Beşiktaş 2002-03’te Süper Lig şampiyonu oldu; bu sezon kulübün hangi yıl dönümüne denk geldi?', o: ['75. yıl dönümü', '50. yıl dönümü', '125. yıl dönümü', '100. yıl dönümü'], a: 3, hint: '1903’te kurulan Beşiktaş, 100. yılını 2002-03 şampiyonluğuyla kutladı.' },
      { id: 'q_beba30', q: 'Beşiktaş’ı 2002-03 Süper Lig şampiyonluğuna taşıyan Romen teknik direktör kim?', o: ['Mircea Lucescu', 'Anghel Iordănescu', 'László Bölöni', 'Cosmin Contra'], a: 0, hint: 'Mircea Lucescu’nun Beşiktaş’ı 2002-03’te 85 puanla, Galatasaray’ın sekiz puan önünde şampiyon oldu.' },
      { id: 'q_758a73', q: '2015-16 ve 2016-17’de Beşiktaş’la üst üste Süper Lig şampiyonluğu kazanan teknik direktör kim?', o: ['Slaven Bilić', 'Şenol Güneş', 'Sergen Yalçın', 'Mircea Lucescu'], a: 1, hint: 'Şenol Güneş Haziran 2015’te göreve geldi ve ilk iki sezonunda da ligi kazandı.' },
      { id: 'q_e7170c', q: 'Beşiktaş, 2007-08 Şampiyonlar Ligi grup aşamasında İnönü Stadı’nda hangi İngiliz kulübünü 2-1 yendi?', o: ['Arsenal', 'Chelsea', 'Manchester United', 'Liverpool'], a: 3, hint: 'Beşiktaş, Ekim 2007’de İstanbul’da Liverpool’u 2-1 yendi; İnönü’nün büyük Avrupa gecelerinden biri.' },
      { id: 'q_d0f739', q: 'Beşiktaş, Kasım 2009’da Şampiyonlar Ligi’nde Old Trafford’da hangi skorla kazandı?', o: ['1-0', '2-1', '3-2', '2-0'], a: 0, hint: 'Beşiktaş, 25 Kasım 2009’da Old Trafford’da Manchester United’ı 1-0 yendi.' },
      { id: 'q_de0e5e', q: 'Kasım 2009’da Old Trafford’da kazanılan 1-0’lık maçta Beşiktaş’ın golünü kim attı?', o: ['Bobô', 'Rodrigo Tello', 'Ricardo Quaresma', 'İsmail Köybaşı'], a: 1, hint: 'Şilili orta saha oyuncusu Rodrigo Tello, 20. dakikada attığı golle Manchester United’ı yıktı.' },
      { id: 'q_b71675', q: '2017-18’de Beşiktaş, Şampiyonlar Ligi’nde grubunu lider bitiren ilk Türk kulübü oldu. Grupta onların arkasında ikinci sırayı hangi kulüp aldı?', o: ['Sevilla', 'RB Leipzig', 'Porto', 'Monaco'], a: 2, hint: 'Beşiktaş G Grubu’nu yenilgisiz lider bitirdi; Porto ikinci sıradan tur atladı.' },
      { id: 'q_e665cc', q: 'Beşiktaş 1903’te hangi adla kuruldu?', o: ['Valideçeşme Football Club', 'Serencebey Spor Kulübü', 'Bereket Jimnastik Kulübü', 'Beşiktaş Bahriye Kulübü'], a: 2, hint: 'Kulüp, Beşiktaş adını almadan önce bir jimnastik derneği olan Bereket Jimnastik Kulübü olarak başladı.' },
      { id: 'q_e9f055', q: 'Ekim 1989’da Adana Demirspor’u 10-0 yenen Beşiktaş’ta dört gol atan kim?', o: ['Metin Tekin', 'Feyyaz Uçar', 'Ali Gültiken', 'Rıza Çalımbay'], a: 2, hint: 'Ali Gültiken dört gol attı; 10-0’lık maçta Metin Tekin ve Feyyaz Uçar da üçer gol kaydetti.' },
      { id: 'q_c0f5e6', q: 'Yorulmak bilmeyen enerjisi yüzünden taraftarların ‘Atom Karınca’ lakabını taktığı Beşiktaşlı orta saha oyuncusu kim?', o: ['Metin Tekin', 'Sergen Yalçın', 'Rıza Çalımbay', 'Ali Gültiken'], a: 2, hint: 'Rıza Çalımbay, orta sahadaki tükenmek bilmeyen koşuları sayesinde ‘Atom Karınca’ lakabını aldı.' },
      { id: 'q_123cdd', en: 'As a player and as manager', q: 'Sergen Yalçın, Beşiktaş’la Süper Lig’i hangi iki rolde kazanan ilk kişi olarak biliniyor?', o: ['Futbolcu ve kulüp başkanı olarak', 'Futbolcu ve teknik direktör olarak', 'Teknik direktör ve kulüp başkanı olarak', 'Kaleci ve saha oyuncusu olarak'], a: 1, hint: 'Yalçın ligi önce Beşiktaş’ın oyuncusu olarak, daha sonra 2020-21’de teknik direktörü olarak kazandı.' },
      { id: 'q_e28f4f', q: '1986-87 Avrupa Kupası’nda Beşiktaş’ı çeyrek finalde hangi kulüp eledi?', o: ['Bayern Münih', 'Real Madrid', 'Porto', 'Dynamo Kyiv'], a: 3, hint: 'Dynamo Kyiv, iki maçta Beşiktaş’ı farklı geçerek 1986-87’de yarı finale yükseldi.' },
    ],
    copy: {
      tasterEyebrow: 'Ücretsiz deneme · Kayıt yok',
      tasterH: 'Beşiktaş’ı ne kadar iyi biliyorsun?',
      tasterPh: 'Kara Kartal Ball IQ’nu ölçmek için on hızlı soru.',
      tasterNote: 'Örnek sorular — quizin tamamında çok daha fazlası var.',
      playSection: 'Beşiktaş quizini oyna',
      playSub: 'Kontrol etmek için bir cevaba dokun — anında doğru/yanlış ve arkasındaki hikâye.',
      faqH: 'Beşiktaş Quiz — Sıkça sorulan sorular',
      aboutQ: 'Beşiktaş quizi hakkında',
      bandH: 'Kara Kartal’ı bildiğini mi düşünüyorsun? Uygulamada kanıtla.',
      bandP: 'Serileri, canlı 1v1, 99 üzerinden bir puan — ve bütün quizler tek uygulamada. Uygulama İngilizce.',
      alsoH: 'Aynı sayfanın İngilizcesi',
      alsoP: 'Bu sayfa Beşiktaş quizimizin Türkçe sürümü. Soruların tamamı orijinalinde:',
      alsoLink: 'Beşiktaş quiz (English)',
      statsLine: 'Ball IQ’daki Beşiktaş soruları üç zorluk seviyesinde: kolay, orta ve zor — hepsi açıklamalı.',
    },
  },
  {
    club: 'Trabzonspor',
    slug: 'trabzonspor',
    lang: 'tr',
    name: 'Trabzonspor',
    h1: 'Trabzonspor Quiz',
    title: 'Trabzonspor Quiz — Bordo-Mavili Bilgi Yarışması | Ball IQ',
    description:
      'Ücretsiz Trabzonspor quiz, açıklamalı cevaplarla: İstanbul tekelini kıran 1976 şampiyonluğu, Şenol Güneş, Cemil Usta ve 2022 şampiyonluğu.',
    kind: 'Kulüp quizi',
    statLine: 'Ücretsiz · Açıklamalı Trabzonspor soruları · kayıt yok',
    playLabel: 'Quize başla',
    intro: [
      'Trabzonspor 1967’de Karadeniz kıyısında kuruldu ve on yıl dolmadan, kendisinden önce hiçbir kulübün başaramadığını başardı. Bu ücretsiz quiz Bordo-Mavili ekibin bütün hikâyesini kapsıyor: bordo-mavi renkler, Karadeniz Fırtınası lakabı, İstanbul’un şampiyonluk tekelini kıran 1975–76 sezonu ve önce kaleci, sonra teknik direktör olarak kulübe hizmet eden Şenol Güneş.',
      'Sorular kolay başlıyor, sonra gerçekten zorlaşıyor: altın çağın şampiyonlukları, Avrupa geceleri, gol kralları ve 38 yıllık bekleyişin ardından gelen 2021–22 şampiyonluğu. Kulüp tarihinin tartışmalı olduğu bir yerde taraf tutmaktansa o soruyu yayınlamamayı seçiyoruz; yayınlanan her bilgi doğrulanabilir.',
      'Trabzonspor setindeki her cevabın yazılı bir açıklaması var; yanlış bir cevap bile size bir şey öğretiyor: örneğin Şenol Güneş’in 1970’ler ve 80’lerin şampiyon kadrolarında kaleyi koruduğunu, sonra kulübü çalıştırdığını ve Türkiye’yi 2002 Dünya Kupası’nda üçüncülüğe taşıdığını.',
    ],
    faq: [
      {
        q: 'Trabzonspor quiz ücretsiz mi?',
        a: 'Evet. Doğrudan tarayıcıda oynanıyor; kayıt olmanız ya da bir şey indirmeniz gerekmiyor. Bu sayfadaki bütün sorular ücretsiz.',
      },
      {
        q: 'Quiz hangi konuları kapsıyor?',
        a: 'Kulüp tarihi ve 1967’deki kuruluş, İstanbul dışından çıkan ilk şampiyon olunan 1975–76 sezonu, altın çağın üst üste şampiyonlukları, Şenol Güneş, Cemil Usta ve Hami Mandıralı, Avrupa geceleri, Abdullah Avcı ile gelen 2021–22 şampiyonluğu ve Fenerbahçe rekabeti. Kolaydan gerçekten zora doğru ilerliyor.',
      },
      {
        q: 'Sorular nereden geliyor?',
        a: 'Her soru kaynaklara dayanılarak araştırılıyor ve doğrulanıyor. Her bilgi yayınlanmadan önce iki bağımsız kontrolden geçiyor; doğrulanamayan bir bilgi varsa o soru yayınlanmıyor.',
      },
      {
        q: 'Ball IQ uygulaması Türkçe mi?',
        a: 'Henüz değil: bu sayfa Türkçe, fakat uygulama İngilizce. Çeviriye geçmeden önce ilgiyi ölçüyoruz; bu sayfaya kadar geldiyseniz, o kararı vermemize şimdiden yardım ediyorsunuz.',
      },
    ],
    // ── Taster: 10 questions, tappable in the hero ────────────────────────────
    taster: [
      { id: 'q_51a47c', q: 'Trabzonspor hangi yıl kuruldu?', o: ['1947', '1957', '1967', '1977'], a: 2, hint: 'Trabzonspor, 2 Ağustos 1967’de Trabzon’daki yerel kulüplerin birleşmesiyle kuruldu.' },
      { id: 'q_7a6c3b', en: 'The Black Sea', q: 'Trabzonspor’un şehri Trabzon hangi denizin kıyısında?', o: ['Ege Denizi', 'Karadeniz', 'Akdeniz', 'Marmara Denizi'], a: 1, hint: 'Trabzon, Türkiye’nin kuzeyinde Karadeniz kıyısında; kulübe Karadeniz Fırtınası denmesinin sebebi de bu.' },
      { id: 'q_b2e6c5', en: 'Claret and blue', q: 'Trabzonspor’un geleneksel kulüp renkleri hangileri?', o: ['Yeşil ve beyaz', 'Sarı ve lacivert', 'Kırmızı ve siyah', 'Bordo ve mavi'], a: 3, hint: 'Bordo-mavi, 1967’de birleşen kurucu kulüpler arasında bir uzlaşma olarak kabul edildi.' },
      { id: 'q_a5e8a8', q: 'Trabzonspor ilk Türkiye birinci lig şampiyonluğunu hangi sezonda kazandı?', o: ['1969–70', '1975–76', '1980–81', '1983–84'], a: 1, hint: 'Trabzonspor 1975–76 şampiyonluğunu Ahmet Suat Özyazıcı yönetiminde, Fenerbahçe’nin üç puan önünde kazandı.' },
      { id: 'q_571ae5', q: 'Trabzonspor 1975–76’da Türkiye ligini kazandığında, hangi şehrin dışından çıkan ilk şampiyon oldu?', o: ['Ankara', 'İzmir', 'İstanbul', 'Bursa'], a: 2, hint: '1976’ya kadar bütün Türkiye şampiyonlukları İstanbul kulüplerinden birine gitmişti: Fenerbahçe, Galatasaray ya da Beşiktaş.' },
      { id: 'q_e4e71d', q: 'Trabzonspor hangi sezonda 38 yıllık hasreti bitirip yeniden Süper Lig şampiyonu oldu?', o: ['2016–17', '2018–19', '2019–20', '2021–22'], a: 3, hint: 'Trabzonspor 2021–22’de şampiyon oldu; bu, 1983–84’ten bu yana kazandığı ilk lig şampiyonluğuydu.' },
      { id: 'q_749f1a', q: 'Trabzonspor’u 2021–22 Süper Lig şampiyonluğuna taşıyan teknik direktör kim?', o: ['Abdullah Avcı', 'Ersun Yanal', 'Şenol Güneş', 'Ünal Karaman'], a: 0, hint: 'Abdullah Avcı 2020’de göreve geldi ve 2021–22’de şampiyonluğu getirdi.' },
      { id: 'q_ceed2c', q: 'Trabzonspor’un Aralık 2016’da açılan stadı hangi kulüp efsanesinin adını taşıyor?', o: ['Hami Mandıralı', 'Cemil Usta', 'Şenol Güneş', 'Ahmet Suat Özyazıcı'], a: 2, hint: 'Şenol Güneş Spor Kompleksi, Trabzonspor’da on iki yıl geçiren ve sonra kulübü çalıştıran efsaneyi onurlandırıyor.' },
      { id: 'q_1fb1fd', en: 'Turkey', q: 'Eski Trabzonspor kalecisi Şenol Güneş, 2002 Dünya Kupası’nda hangi milli takımı üçüncülüğe taşıdı?', o: ['Güney Kore', 'Türkiye', 'Hırvatistan', 'Senegal'], a: 1, hint: 'Güneş, 2002’de Türkiye’yi üçüncülüğe taşıdı; üçüncülük maçında ev sahiplerinden Güney Kore 3–2 yenildi.' },
      { id: 'q_bb2ce2', q: 'Galatasaray’a gitmeden önce 2011–12’de Trabzonspor formasıyla 33 golle Süper Lig gol kralı olan Türk forvet kim?', o: ['Umut Bulut', 'Semih Şentürk', 'Burak Yılmaz', 'Fatih Tekke'], a: 2, hint: 'Burak Yılmaz 2011–12’de 33 lig golü attı, ardından Temmuz 2012’de Galatasaray’a geçti.' },
    ],
    // ── Sample Q&A: 12 more, listed below the taster ──────────────────────────
    sample: [
      { id: 'q_558f34', q: 'Trabzonspor hangi sezonlarda üst üste üç lig şampiyonluğu kazandı?', o: ['1975–76, 1976–77, 1977–78', '1976–77, 1977–78, 1978–79', '1978–79, 1979–80, 1980–81', '1980–81, 1981–82, 1982–83'], a: 2, hint: 'Üst üste üç şampiyonluk 1978–79, 1979–80 ve 1980–81’de, kulübün altın çağının zirvesinde geldi.' },
      { id: 'q_963cd6', q: 'Trabzonspor 2011–12 Şampiyonlar Ligi’ne hangi İtalyan kulübünü deplasmanda 1–0 yenerek başladı?', o: ['Inter', 'AC Milan', 'Juventus', 'Napoli'], a: 0, hint: 'Ondřej Čelůstka, Eylül 2011’deki ilk maçta San Siro’da son dakikalara doğru attığı golle Inter karşısında 1–0’lık galibiyeti getirdi.' },
      { id: 'q_94bb7f', q: 'Crystal Palace’tan kiralık gelen ve 2019–20’de Trabzonspor formasıyla 24 golle Süper Lig gol kralı olan Norveçli forvet kim?', o: ['Joshua King', 'Alexander Sørloth', 'Erling Haaland', 'Bjørn Maars Johnsen'], a: 1, hint: 'Alexander Sørloth Ağustos 2019’da kiralık olarak geldi ve 24 lig golüyle gol krallığını kazandı.' },
      { id: 'q_738d1a', q: '1990’ların ortasında Trabzonspor’un sevilen oyuncularından biri olan ve 1997’de Ajax’a giden Gürcü forvet kim?', o: ['Shota Arveladze', 'Georgi Kinkladze', 'Kakha Kaladze', 'Levan Kobiashvili'], a: 0, hint: 'Shota Arveladze 1995–96’da Trabzonspor formasıyla Süper Lig’in gol kralı oldu, ardından 1997 yazında Ajax’a imza attı.' },
      { id: 'q_200158', q: '2021’de Trabzonspor’a katılan ve oradaki ilk sezonunda Süper Lig’i kazanan Slovak orta saha oyuncusu kim?', o: ['Miroslav Stoch', 'Juraj Kucka', 'Marek Hamšík', 'Vladimír Weiss'], a: 2, hint: 'Marek Hamšík Haziran 2021’de imza attı ve 2021–22’de Süper Lig’in Yılın Yabancı Oyuncusu seçildi.' },
      { id: 'q_f46935', q: '1980’lerin sonu ve 1990’larda, iki ayrı dönemde Trabzonspor için 200’den fazla gol atan kulüp ikonu kim?', o: ['Necmi Perekli', 'Fatih Tekke', 'Hami Mandıralı', 'Ogün Temizkanoğlu'], a: 2, hint: 'Hami Mandıralı, 1985–1998 ve 1999–2002 dönemlerinde Trabzonspor için 218 gol attı.' },
      { id: 'q_2ca602', q: 'Hangi kulüp turnuvadan men edildikten sonra Trabzonspor 2011–12 Şampiyonlar Ligi grup aşamasına alındı?', o: ['Galatasaray', 'Beşiktaş', 'Bursaspor', 'Fenerbahçe'], a: 3, hint: 'Türkiye Futbol Federasyonu, Ağustos 2011’de şike soruşturması nedeniyle Fenerbahçe’yi turnuvadan çekti ve UEFA yerine Trabzonspor’u aldı.' },
      { id: 'q_878eb5', q: 'Ekim 1976’da Trabzonspor’a Liverpool karşısında 1–0’lık galibiyeti getiren penaltıyı kim attı?', o: ['Cemil Usta', 'Necmi Perekli', 'Şenol Güneş', 'Ali Kemal Denizci'], a: 0, hint: '‘Dozer’ lakaplı kaptan Cemil Usta, 62. dakikada penaltıyı gole çevirdi.' },
      { id: 'q_971a9d', q: 'Trabzonspor ilk Avrupa eşleşmesinde, 1976–77 Avrupa Kupası ilk turunda hangi İzlanda kulübünü yendi?', o: ['Valur', 'KR Reykjavík', 'ÍA Akranes', 'Keflavík'], a: 2, hint: 'Trabzonspor, ikinci turda Liverpool’la karşılaşmadan önce Akranes ekibi ÍA’yı 3–1 ve 3–2 yenerek toplamda 6–3 turu geçti.' },
      { id: 'q_1ddd31', q: '1976–77’de 18 golle Türkiye birinci liginin gol kralı olan ilk Trabzonspor oyuncusu hangi forvet?', o: ['Cemil Usta', 'Ali Kemal Denizci', 'Necmi Perekli', 'Hami Mandıralı'], a: 2, hint: 'Necmi Perekli 22 maçta 18 gol attı; Trabzonspor 1976–77’de şampiyonluğunu korudu.' },
      { id: 'q_8b4b3f', q: '1990–91 Kupa Galipleri Kupası’nda ilk maçı Trabzon’da 1–0 kaybetmesine rağmen Trabzonspor’u eleyen kulüp hangisi?', o: ['Real Madrid', 'Sampdoria', 'Manchester United', 'Barcelona'], a: 3, hint: 'Trabzonspor evinde 1–0 kazandı, ama Barcelona Camp Nou’da 7–2’lik skorla karşılık verip toplamda 7–3 ile turu geçti.' },
      { id: 'q_27ac34', q: '2019–20 Türkiye birinci lig sezonuna resmî olarak hangi Trabzonspor isminin adı verildi?', o: ['Cemil Usta', 'Şenol Güneş', 'Hami Mandıralı', 'Necmi Perekli'], a: 0, hint: 'Türkiye Futbol Federasyonu, sezona merhum Trabzonspor kaptanının anısına ‘Cemil Usta Sezonu’ adını verdi.' },
    ],
    copy: {
      tasterEyebrow: 'Ücretsiz deneme · Kayıt yok',
      tasterH: 'Trabzonspor’u ne kadar iyi biliyorsun?',
      tasterPh: 'Bordo-Mavili Ball IQ’nu ölçmek için on hızlı soru.',
      tasterNote: 'Örnek sorular — quizin tamamında çok daha fazlası var.',
      playSection: 'Trabzonspor quizini oyna',
      playSub: 'Kontrol etmek için bir cevaba dokun — anında doğru/yanlış ve arkasındaki hikâye.',
      faqH: 'Trabzonspor Quiz — Sıkça sorulan sorular',
      aboutQ: 'Trabzonspor quizi hakkında',
      bandH: 'Karadeniz Fırtınası’nı bildiğini mi düşünüyorsun? Uygulamada kanıtla.',
      bandP: 'Serileri, canlı 1v1, 99 üzerinden bir puan — ve bütün quizler tek uygulamada. Uygulama İngilizce.',
      alsoH: 'Aynı sayfanın İngilizcesi',
      alsoP: 'Bu sayfa Trabzonspor quizimizin Türkçe sürümü. Soruların tamamı orijinalinde:',
      alsoLink: 'Trabzonspor quiz (English)',
      statsLine: 'Ball IQ’daki Trabzonspor soruları üç zorluk seviyesinde: kolay, orta ve zor — hepsi açıklamalı.',
    },
  },
];

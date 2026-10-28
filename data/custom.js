/* Salon Defteri — dataset'te kendi kaydı olmayan hareketler.

   A) Görseli dataset medyasından türetilenler (c001, c002)
   exercises-dataset'te düz ön kol plank'ı ve pike şınav ayrı birer kayıt
   değil; ama bu pozları İÇEREN hareketler var. Görseller onların doğru
   karelerinden alındı, böylece diğer 1324 hareketle aynı üslupta duruyorlar:

     c001  ← 0464 "front plank with twist", kare 0 (burulmasız başlangıç pozu)
     c002  ← 3662 "pike-to-cobra push-up", kare 0 ve 6 (hareketin ilk yarısı)

   Kareleri çıkaran betik: tools/ozel-gif-uret.py
   Medya © Gym visual — dataset medyasından türetilmiştir, atıf aynen geçerli.

   B) Özgün animasyonlar (c003-c006, c008-c010, c013-c015, c017, c019)
   Dataset'te karşılığı olmayan, poz karesi de çıkarılamayan hareketler.
   Dataset üslubuna benzeyen anatomik bir 3B figürle yerelde çizildi:
   tools/program-gifs/ (Three.js + Surface Nets). Bir görsel üretme
   servisi kullanılmadı ve dataset medyasından türetilmedi — Gym visual
   atıfı bu dosyalar için geçerli DEĞİLDİR.

   Görseller: images/{id}-{m}.jpg ve videos/{id}-{m}.gif
   Bu dosya data/exercises.js'ten SONRA yüklenir ve ona eklenir;
   exercises.js yeniden üretilse bile bu kayıtlar korunur. */
(function () {
  if (!Array.isArray(window.EXDATA)) window.EXDATA = [];
  window.EXDATA.push(
    {
      i: "c001",
      n: "front plank",
      c: "waist",
      q: "body weight",
      t: "abs",
      s: ["spine", "glutes"],
      m: "custom",
      d: [
        "Dirsekler omuz altında, önkollar yerde.",
        "Ayak parmakları yerde, vücut baştan topuğa düz çizgi.",
        "Kalçayı hafif içeri al, karnı sık, belin çukurlaşmasın.",
        "Normal nefes al. Kalça düşmeye başlayınca seti bitir."
      ]
    },
    {
      i: "c002",
      n: "pike push-up",
      c: "shoulders",
      q: "body weight",
      t: "delts",
      s: ["triceps", "pectorals"],
      m: "custom",
      d: [
        "Şınav pozisyonuna geç, sonra kalçanı yukarı it — vücudun ters V olsun.",
        "Eller omuzdan biraz geniş, bacaklar mümkün olduğunca düz.",
        "Başını ellerinin arasına değil, biraz önüne doğru indir.",
        "Aşağıda 1 saniye dur, iterek başlangıca dön."
      ]
    },
    {
      i: "c003",
      n: "cat-cow",
      c: "back",
      q: "body weight",
      t: "spine",
      s: ["abs", "upper back"],
      m: "anim-v2",
      d: [
        "Dört ayak üstüne gel: eller omuz altında, dizler kalça altında.",
        "Nefes verirken sırtını kedi gibi yukarı yuvarla, çeneyi göğse yaklaştır.",
        "Nefes alırken göğsü öne aç, kuyruk sokumunu yukarı çevir, omurgayı çukurlaştır.",
        "İki uç arasında yavaşça gidip gel — hareket boyundan kuyruk sokumuna kadar tüm omurgada olsun.",
        "Zorlama, ağrısız aralıkta kal. Her yön 3-4 saniye sürsün."
      ]
    },
    {
      i: "c004",
      n: "wall slide",
      c: "shoulders",
      q: "body weight",
      t: "upper back",
      s: ["delts", "traps"],
      m: "anim-v2",
      d: [
        "Sırtın duvarda dur; topuklar duvardan 10-15 cm açıkta olsun.",
        "Bel, sırtın üstü ve başın arkası duvara değsin — çeneyi hafif içeri çek.",
        "Kolları kaldır: dirseklerin ve el sırtların duvara değecek, kollar 'W' harfi gibi dursun.",
        "Temas kaybolmadan kolları yukarı kaydır, 'Y' pozisyonuna doğru uzat.",
        "Yavaşça geri in. Bel duvardan kalkıyorsa daha az yukarı çık — sınırın orası."
      ]
    },
    {
      i: "c005",
      n: "chin tuck",
      c: "neck",
      q: "body weight",
      t: "levator scapulae",
      s: [],
      m: "anim-v2",
      d: [
        "Sırtüstü yat, dizler bükülü, ayaklar yerde. Baş yerde, yüz tavana baksın.",
        "Çeneni içeri çek — aşağı eğme, geriye kaydır. Ense dibinin uzadığını hisset.",
        "Başını yerde tutarak çeneyi hafifçe geri çek ve 5 saniye bekle.",
        "Çeneyi rahat bırak. Bir tekrar bu kadar.",
        "Zorlama. Ağrı veya ense dibinde sıkışma olursa dur; hareket aralığını küçült."
      ]
    }
  );
})();

/* Opsiyonel pazar ev seansı. */
window.EXDATA.push({"i":"c006","n":"Evde hafif ısınma","c":"cardio","q":"body weight","t":"cardiovascular system","s":[],"d":["Ev içinde rahat tempoda yürü; toplam 5 dakika ayır.","Omuzlarını nazikçe çevir ve bileklerini rahat aralıkta hareket ettir.","Konuşabileceğin tempoda kal; yorulmayı hedefleme."]},
{"i":"c007","n":"Kolay şınav — duvarda veya dizler yerde","c":"chest","q":"body weight","t":"pectorals","s":["triceps","delts"],"d":["Duvarda şınavla başla; rahat gelirse dizler yerde şınav yapabilirsin.","Eller omuz genişliğinden biraz açık; gövdeni kontrollü tut.","Dirseklerini tamamen yana açmadan göğsünü desteğe yaklaştır ve geri it.","8–12 tekrar yap, en az 4–5 tekrar yedekte kalsın. İki set arasında 90 saniye dinlen.","Belirgin göğüs, omuz veya triceps yorgunluğu varsa bu hareketi atla."]},
{"i":"c008","n":"Yan yatışta gövde açma — open book","c":"back","q":"body weight","t":"upper back","s":[],"d":["Yan yat; dizlerini büküp üst üste tut, kollarını önünde uzat.","Üstteki kolunu geriye açarken göğsünü rahatça döndür; dizler birlikte kalsın.","Zorlamadan başlangıca dön; her taraf için 6 tekrar yap.","Cat-cow, bu hareket ve wall slide bölümüne geçişlerle yaklaşık 8 dakika ayır."]},
{"i":"c009","n":"Kapı eşiğinde hafif göğüs esnetme","c":"chest","q":"body weight","t":"pectorals","s":["delts"],"d":["Önkolunu sağlam kapı eşiğine rahat bir yükseklikte yerleştir.","Küçük bir adımla öne geç; göğüste hafif gerilme yeterli.","20–30 saniye tut; her tarafta iki kez uygula. Bir set iki tarafı kapsar.","Omuzda sıkışma veya ağrı olursa dur; zorlamadan nefes al."]},
{"i":"c010","n":"Rahat yürüyüş ve sakin nefes","c":"cardio","q":"body weight","t":"cardiovascular system","s":[],"d":["Ev içinde rahat tempoda yürü.","Son birkaç dakikada rahat bir pozisyonda sakin ve doğal nefes al; nefesini tutma.","Bu kapanış bölümüne toplam 9 dakika ayır. Seans yaklaşık 30 dakika; süreyi doldurmak için ekstra şınav ekleme."]});

/* c007 dataset'teki duvar şınavını kullanır; diğerleri özgün animasyon (yukarıdaki not B). */
for (const id of ["c006","c008","c009","c010"]) {
  const e=window.EXDATA.find(x=>x.i===id); if(e) e.m="anim-v2";
}
const wall=window.EXDATA.find(x=>x.i==="c007");
if(wall){wall.m="LEH9jxP";wall.mediaId="0659";}

/* Ekipmansız ev günleri (Ev Gün 1-3): dambıl, bar, bench ve lastik yerine
   masa, sandalye, kapı kasası, duvar ve havlu. Görseli uyan dataset
   hareketinin medyası mediaId ile kullanılıyor; uyan görseli olmayanlar
   (c013, c014, c015, c017, c019) özgün animasyon (yukarıdaki not B). */
window.EXDATA.push(
{"i":"c011","n":"Masa altı ters kürek","c":"back","q":"body weight","t":"upper back","s":["lats","biceps"],"m":"VPPtusI","mediaId":"2300","d":["Sağlam, ağır bir masanın altına sırtüstü uzan; göğsün masa kenarının hizasında olsun.","Masa kenarını omuz genişliğinden biraz geniş, avuçlar aşağı bakacak şekilde tut.","Kalçayı kaldır: omuzdan topuğa düz bir çizgi. Kolaysa dizleri bük, zorsa bacakları düzle.","Kürekleri sıkarak göğsünü masaya çek, tepede 1 saniye bekle.","3 saniyede kontrollü in. Başlamadan önce masanın devrilmeyeceğinden emin ol."]},
{"i":"c012","n":"Kapı kasası tek kol kürek","c":"back","q":"body weight","t":"upper back","s":["lats","biceps"],"m":"O4oIqQD","mediaId":"3161","d":["Açık bir kapının kasasına yan değil, karşıdan dur; bir elinle kasayı göğüs hizasında kavra.","Ayaklarını kasaya yaklaştır ve kolun düzleşene kadar geriye yaslan; gövde düz kalsın.","Dirseği gövdenin yanından geriye çekerek kendini kasaya doğru çek.","Tepede kürek kemiğini 1 saniye sık, yavaşça geri yaslan.","Ayaklar kasaya ne kadar yakınsa hareket o kadar zorlaşır. Diğer kolla tekrarla."]},
{"i":"c013","m":"anim-v2","n":"Yüzüstü Y-T-W kaldırış","c":"shoulders","q":"body weight","t":"upper back","s":["delts","traps"],"d":["Yere yüzüstü uzan, alnını küçük bir havluya koy; boyun nötr kalsın.","Y: Kolları baş üstünde çapraz uzat, başparmaklar yukarı; kolları yerden kaldır, 2 saniye tut.","T: Kolları yanlara aç, aynı şekilde kaldır ve 2 saniye tut.","W: Dirsekleri bük, kürekleri aşağı ve geriye sıkarak kolları kaldır, 2 saniye tut.","Her harften istenen sayı kadar yap. Beli kavislendirme; yükü kürekler alsın."]},
{"i":"c014","m":"anim-v2","n":"Duvara izometrik yan kaldırış","c":"shoulders","q":"body weight","t":"delts","s":["traps"],"d":["Duvarın yanına dur; duvara yakın kolun dirseği hafif bükülü, kolun dışı duvarda.","Kolu yana kaldırmaya çalışır gibi duvarı yana doğru it; gövde duvara yaslanmasın.","Kuvvetin yaklaşık yüzde 70-80'i ile it, süre boyunca bırakma.","Omuzu kulağa doğru kaldırma; normal nefes al.","Süre bitince diğer kola geç. Bir set iki kolu kapsar."]},
{"i":"c015","m":"anim-v2","n":"Kapı kasası biceps curl","c":"upper arms","q":"body weight","t":"biceps","s":["forearms"],"d":["Kapı kasasını tek elle, avucun yukarı bakacak şekilde göğüs hizasında tut.","Ayaklarını kasaya yaklaştır ve kolun düz olacak şekilde geriye yaslan.","Üst kolunu sabit tutup yalnızca dirseği bükerek kendini kasaya doğru çek.","Tepede biceps'i sık, 3 saniyede kontrollü geri yaslan.","Ayaklar kasaya yaklaştıkça zorlaşır. Diğer kolla tekrarla."]},
{"i":"c016","n":"Bulgar split squat (sandalyeyle)","c":"upper legs","q":"body weight","t":"quads","s":["glutes","hamstrings"],"m":"9E25EOx","mediaId":"2368","d":["Duvara dayalı bir sandalyenin önünde dur, bir ayağının üstünü arkadaki sandalyeye koy.","Ön ayak sandalyeden yaklaşık iki adım önde olsun; gövde dik.","Ön diz ayak ucu yönünde kalarak, arka diz yere yaklaşana kadar in.","Ön topuktan iterek yukarı çık.","İstenen tekrar kadar yap, sonra bacak değiştir."]},
{"i":"c017","m":"anim-v2","n":"Tek bacak Romen deadlift","c":"upper legs","q":"body weight","t":"hamstrings","s":["glutes","spine"],"d":["Tek bacak üstünde dur, diz hafif bükülü; dengen için bir elinle duvara hafifçe dokun.","Kalçadan menteşe yap: gövde öne eğilirken boştaki bacak düz şekilde geriye uzansın.","Sırt düz, kalçalar yere paralel kalsın; dönmesin.","Arka bacakta gerilmeyi hissedince dur, kalçayı sıkarak dik pozisyona dön.","Belinde hissedersen hareket aralığını küçült. Diğer bacakla tekrarla."]},
{"i":"c018","n":"Yükseltilmiş pike şınav","c":"shoulders","q":"body weight","t":"delts","s":["triceps","pectorals"],"m":"custom","mediaId":"c002","d":["Ayaklarını sağlam bir sandalyeye koy, ellerini yere omuzdan biraz geniş yerleştir.","Kalçayı yukarı kaldır; gövden ellerin üstünde mümkün olduğunca dik olsun.","Başını ellerinin biraz önüne doğru, kontrollü indir.","Aşağıda 1 saniye dur, iterek başlangıca dön.","Zor gelirse ayakları yere indir ve normal pike şınav yap."]},
{"i":"c019","m":"anim-v2","n":"Havluyla izometrik çekiç curl","c":"upper arms","q":"body weight","t":"biceps","s":["forearms"],"d":["Havlunun ortasına bir ayağınla bas; iki ucunu avuçlar birbirine bakacak şekilde tut.","Dirsekleri yaklaşık 90 derece bük, üst kollar gövdenin yanında.","Havluyu yukarı çekmeye çalış; havlu gergin, dirsek açısı sabit kalsın.","Süre boyunca çekmeye devam et, nefesini tutma.","Gövdeyi geriye atarak destek alma."]},
{"i":"c020","n":"Masa kenarı triceps extension","c":"upper arms","q":"body weight","t":"triceps","s":[],"m":"s0HKO2I","mediaId":"1771","d":["Ellerini sağlam bir masa ya da tezgah kenarına omuz genişliğinde koy, geriye adım at; vücut düz bir çizgi.","Üst kollar sabit kalarak dirsekleri bük ve alnını ellerinin altına doğru indir.","Dirsekler öne baksın, yana açılmasın.","Yalnızca dirsekten iterek kolları düzleştir.","Ayakları geriye aldıkça ya da daha alçak bir yüzey kullandıkça zorlaşır."]}
);

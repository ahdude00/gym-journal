/* Salon Defteri — dataset'te kendi kaydı olmayan hareketler.

   A) Görseli dataset medyasından türetilenler (c001, c002)
   exercises-dataset'te düz ön kol plank'ı ve pike şınav ayrı birer kayıt
   değil; ama bu pozları İÇEREN hareketler var. Görseller onların doğru
   karelerinden alındı, böylece diğer 1324 hareketle aynı üslupta duruyorlar:

     c001  ← 0464 "front plank with twist", kare 0 (burulmasız başlangıç pozu)
     c002  ← 3662 "pike-to-cobra push-up", kare 0 ve 6 (hareketin ilk yarısı)

   Kareleri çıkaran betik: tools/ozel-gif-uret.py
   Medya © Gym visual — dataset medyasından türetilmiştir, atıf aynen geçerli.

   B) Özgün animasyonlar (c003, c004, c005, c006, c008, c009, c010)
   Dataset'te karşılığı olmayan, poz karesi de çıkarılamayan hareketler.
   Dataset üslubuna benzeyen anatomik bir 3B figürle yerelde çizildi:
   tools/program-gifs/ (Three.js + Surface Nets). Bir görsel üretme
   servisi kullanılmadı ve dataset medyasından türetilmedi — Gym visual
   atıfı bu yedi dosya için geçerli DEĞİLDİR.

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

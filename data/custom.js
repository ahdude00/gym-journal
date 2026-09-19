/* Salon Defteri — dataset'te kendi kaydı olmayan hareketler.

   A) Görseli dataset medyasından türetilenler (c001, c002)
   exercises-dataset'te düz ön kol plank'ı ve pike şınav ayrı birer kayıt
   değil; ama bu pozları İÇEREN hareketler var. Görseller onların doğru
   karelerinden alındı, böylece diğer 1324 hareketle aynı üslupta duruyorlar:

     c001  ← 0464 "front plank with twist", kare 0 (burulmasız başlangıç pozu)
     c002  ← 3662 "pike-to-cobra push-up", kare 0 ve 6 (hareketin ilk yarısı)

   Kareleri çıkaran betik: tools/ozel-gif-uret.py
   Medya © Gym visual — dataset medyasından türetilmiştir, atıf aynen geçerli.

   B) Çöp adam çizimi olanlar (c003, c004, c005)
   Bu üç hareket dataset'te hiç yok ve pozlarını İÇEREN bir hareket de yok,
   yani yukarıdaki gibi kare çıkarılamıyor. 1324 hareket hem isim hem Türkçe
   adım metni üzerinden tarandı: kedi-deve, duvarda kol kaydırma ve çene
   içeri çekme geçmiyor; boyun bölgesinde yalnızca iki yana esnetme var.
   Benzemeyen bir hareketin karesini koymak yanıltıcı olurdu, o yüzden
   hareketi doğru anlatan sade çöp adam animasyonları çizildi.

   Çizen betik: tools/cop-adam-uret.py
   DİKKAT: bu üç dosya tamamen o betikte üretiliyor, dataset medyasından
   türetilmemiştir — Gym visual atıfı c003/c004/c005 için geçerli DEĞİLDİR.

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
      m: "custom",
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
      m: "custom",
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
      m: "custom",
      d: [
        "Sırtüstü yat, dizler bükülü, ayaklar yerde. Baş yerde, yüz tavana baksın.",
        "Çeneni içeri çek — aşağı eğme, geriye kaydır. Ense dibinin uzadığını hisset.",
        "Çene içerideyken başını 2 cm kadar yerden kaldır ve 5 saniye tut.",
        "Başı yavaşça indir, çeneyi bırak. Bir tekrar bu kadar.",
        "Boyun önünde titreme normaldir. Ense dibi sıkışıyorsa çeneyi daha çok içeri al."
      ]
    }
  );
})();

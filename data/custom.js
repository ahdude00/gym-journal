/* Salon Defteri — dataset'te kendi kaydı olmayan hareketler.
   exercises-dataset'te düz ön kol plank'ı ve pike şınav ayrı birer kayıt
   değil; ama bu pozları İÇEREN hareketler var. Görseller onların doğru
   karelerinden alındı, böylece diğer 1324 hareketle aynı üslupta duruyorlar:

     c001  ← 0464 "front plank with twist", kare 0 (burulmasız başlangıç pozu)
     c002  ← 3662 "pike-to-cobra push-up", kare 0 ve 6 (hareketin ilk yarısı)

   Kareleri çıkaran betik: tools/ozel-gif-uret.py
   Medya © Gym visual — dataset medyasından türetilmiştir, atıf aynen geçerli.

   Görseller: images/{id}-custom.jpg ve videos/{id}-custom.gif
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
    }
  );
})();

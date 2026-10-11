/* Salon Defteri — gün sonu raporu.

   Günün öğünleri, antrenmanı (hareket hareket, bir önceki seferle
   karşılaştırmalı), adımları ve son 7 günün özeti tek bir JSON'da
   toplanıp yapay zekâya (yemek analizindeki aynı sağlayıcı ve anahtar)
   gönderilir. Dönen değerlendirme state.raporlar[gün] altında saklanır.

   Otomatik çalışma (günün raporu 23:59'da hazırlanır):
   - Uygulama 23:59'da açıksa o an bugünün raporu hazırlanır.
   - Kapalıysa Android 23:59'da bildirim gönderir; dokununca uygulama açılır.
   - Hiçbiri olmadıysa ertesi gün ilk açılışta dünün raporu hazırlanır. Bu dosya index.html'deki ana betikten önce yüklenir;
   fonksiyonlar yalnızca çağrıldıklarında oradaki yardımcıları kullanır. */

const RAPOR_SAAT = 23, RAPOR_DAKIKA = 59;
const raporVakti = (d = new Date()) => d.getHours() * 60 + d.getMinutes() >= RAPOR_SAAT * 60 + RAPOR_DAKIKA;
const RAPOR_SAKLA_GUN = 120;
let raporCalisiyor = null;   // hazırlanan günün anahtarı
let raporIlerleme = "";

function raporGunleri(){ return state.raporlar || (state.raporlar = {}); }
function seansGunu(s){ return gunKey(new Date(s.tarih)); }
function gunSeanslari(gun){ return state.sessions.filter(s => seansGunu(s) === gun); }
function gunKayitSayisi(gun){ return (state.meals[gun] || []).length + gunSeanslari(gun).length; }
function adimOf(gun){
  if (typeof adimDurum === "undefined" || !adimDurum.izin) return null;
  const g = (adimDurum.gunler || []).find(x => x.gun === gun);
  return g ? g.adim : null;
}
function setMetni(x, tip){
  const t = x.tekrar != null ? x.tekrar : "?";
  return (x.kg ? x.kg + " kg × " : "") + t + (tip === "sure" ? " sn" : "");
}
/* Bu seanstan önceki son seansta aynı hareketin setleri */
function oncekiSetler(exId, tarih){
  for (let i = state.sessions.length - 1; i >= 0; i--){
    const s = state.sessions[i];
    if (new Date(s.tarih) >= new Date(tarih)) continue;
    const k = (s.kayitlar || []).find(k => k.id === exId);
    if (k && k.setler && k.setler.length) return { tarih: seansGunu(s), setler: k.setler.map(x => setMetni(x, k.tip || tipOf(k.id))).join(", ") };
  }
  return null;
}

function raporVerisi(gun){
  const d = keyToDate(gun), son7 = [];
  for (let i = 6; i >= 0; i--){
    const k = gunKey(new Date(d.getTime() - i * 864e5)), t = gunToplam(k);
    son7.push({
      tarih: k, gun: GUN_UZUN[keyToDate(k).getDay()],
      protein_g: Math.round(t.p), kalori: Math.round(t.k), ogun_kaydi: t.n,
      adim: adimOf(k),
      antrenman: gunSeanslari(k).map(s => ({ program: (s.program && s.program.ad) || "?", sure_dk: Math.round((s.sure || 0) / 60) }))
    });
  }
  const t = gunToplam(gun);
  const hb = haftaBasi(d), hs = new Date(hb.getTime() + 7 * 864e5);
  const sonraki = sonrakiProgram();
  return {
    kullanici: { yas: 26, boy_cm: 187, kilo_kg: 83, hedef: "kas kazanımı; omuz, sırt ve kol öncelikli program" },
    hedefler: {
      protein_g: state.hedefProtein, kalori: state.hedefKalori,
      adim: ADIM_VAR ? state.hedefAdim : null,
      haftalik_antrenman: state.programs.filter(p => !p.opsiyonel).length
    },
    rapor_gunu: { tarih: gun, gun: GUN_UZUN[d.getDay()] },
    beslenme: {
      toplam_protein_g: Math.round(t.p), toplam_kalori: Math.round(t.k),
      ogunler: (state.meals[gun] || []).map(x => ({
        ad: x.ad, porsiyon: (x.adet || 1) === 1 ? x.por : x.adet + " × " + x.por,
        protein_g: yuvarla(x.p * (x.adet || 1)), kalori: Math.round(x.k * (x.adet || 1))
      }))
    },
    antrenman: gunSeanslari(gun).map(s => ({
      program: (s.program && s.program.ad) || "?", sure_dk: Math.round((s.sure || 0) / 60),
      toplam_hacim_kg: Math.round(s.hacim || 0),
      hareketler: (s.kayitlar || []).map(k => {
        const tip = k.tip || tipOf(k.id), once = oncekiSetler(k.id, s.tarih);
        return { ad: exAd(k.id), setler: k.setler.map(x => setMetni(x, tip)).join(", "), onceki_sefer: once ? once.tarih + ": " + once.setler : "ilk kez" };
      })
    })),
    adim: adimOf(gun),
    bu_hafta_antrenman_sayisi: state.sessions.filter(s => { const x = new Date(s.tarih); return x >= hb && x < hs; }).length,
    siradaki_program: sonraki ? sonraki.ad : null,
    son_7_gun: son7
  };
}

const RAPOR_SISTEM = `Sen kullanıcının kişisel antrenörü ve sporcu beslenmesi uzmanısın. Sana bir günün kayıtlarını JSON olarak veriyorum: öğünler (protein/kalori uygulamadaki tahminlerdir), o günkü antrenman (her hareket için yapılan setler ve bir önceki seferki setler), adım sayısı, hedefler ve son 7 günün özeti.

Görevin günün sonunda kısa, dürüst ve uygulanabilir bir değerlendirme yazmak:
- Sayılarla konuş: hedefe göre ne kadar eksik/fazla, önceki sefere göre ne değişti.
- Antrenmanda ilerleme (ağırlık/tekrar artışı), düşüş ya da yerinde sayma varsa belirt. Antrenman yoksa dinlenme günü olarak değerlendir; programdaki sıradaki günü hatırlat.
- Beslenmede protein hedefi ve kaloriyi değerlendir; öğün kayıtları eksik görünüyorsa (çok az kayıt) bunu söyle, kesin yargıya varma.
- "adim" null ise adım verisi yok demektir; Aktivite alanında bunu kısaca belirt, uydurma.
- Son 7 güne bakarak eğilimi yorumla (ör. protein üst üste düşük, antrenman sıklığı).
- Öneriler yarın için somut olsun (ör. "kahvaltıya 3 yumurta + 200 g yoğurt ekle: ~35 g protein").
- Tıbbi teşhis koyma; ağrı/sakatlık söz konusuysa uzmana yönlendir.
- Türkçe yaz, samimi ama kısa ol. Her yorum en fazla iki cümle.`;

const RAPOR_SEMA = {
  type: "object",
  properties: {
    puan: { type: "integer", description: "Günün genel değerlendirmesi, 1-10" },
    baslik: { type: "string", description: "Günü özetleyen kısa başlık, en fazla 6 kelime" },
    ozet: { type: "string", description: "2-3 cümlelik genel değerlendirme" },
    alanlar: {
      type: "array",
      items: {
        type: "object",
        properties: {
          alan: { type: "string", enum: ["Beslenme", "Antrenman", "Aktivite", "Haftalık gidişat"] },
          durum: { type: "string", enum: ["iyi", "orta", "zayif"] },
          yorum: { type: "string" }
        },
        required: ["alan", "durum", "yorum"]
      }
    },
    oneriler: { type: "array", items: { type: "string" }, description: "Yarın için 2-4 somut öneri" },
    yarin: { type: "string", description: "Yarının tek cümlelik odağı" }
  },
  required: ["puan", "baslik", "ozet", "alanlar", "oneriler", "yarin"]
};

async function raporOlustur(gun, sessiz){
  if (raporCalisiyor) return;
  if (!apiAnahtar()){ if (!sessiz) anahtarSor(); return; }
  raporCalisiyor = gun; raporIlerleme = "Rapor hazırlanıyor"; raporKartiYenile();
  try {
    if (ADIM_VAR) await adimTazele();
    const veri = raporVerisi(gun);
    const r = await yzIstek([{ metin: "Günün kayıtları:\n" + JSON.stringify(veri) }], RAPOR_SEMA, RAPOR_SISTEM, 2500,
      m => { raporIlerleme = m; raporKartiYenile(); });
    const rap = {
      puan: Math.max(1, Math.min(10, Math.round(+r.puan || 5))),
      baslik: String(r.baslik || ""), ozet: String(r.ozet || ""),
      alanlar: Array.isArray(r.alanlar) ? r.alanlar.slice(0, 4).map(a => ({ alan: String(a.alan || ""), durum: ["iyi", "orta", "zayif"].includes(a.durum) ? a.durum : "orta", yorum: String(a.yorum || "") })) : [],
      oneriler: Array.isArray(r.oneriler) ? r.oneriler.slice(0, 4).map(String) : [],
      yarin: String(r.yarin || ""),
      olusturma: Date.now(), model: aktifModel(), kayit: gunKayitSayisi(gun)
    };
    const R = raporGunleri(); R[gun] = rap;
    Object.keys(R).sort().slice(0, Math.max(0, Object.keys(R).length - RAPOR_SAKLA_GUN)).forEach(k => delete R[k]);
    await saveAll();
    if (!sessiz) toast(gunAdi(gun) + " raporu hazır");
  } catch (e) {
    if (!sessiz) toast("Rapor hazırlanamadı: " + (e.message || e));
    raporIlerleme = "";
    raporCalisiyor = null; raporKartiYenile(e.message || String(e)); return;
  }
  raporCalisiyor = null; raporIlerleme = "";
  raporKartiYenile();
}

/* Özet açıldığında: gerekiyorsa sessizce rapor hazırla. Aynı saat içinde
   başarısız bir denemeyi tekrarlamaz (kota/bağlantı sorunu varsa döngüye girmesin). */
function raporOtomatik(){
  if (raporCalisiyor || !apiAnahtar()) return;
  const simdi = new Date(), bugun = gunKey(), dun = gunKey(new Date(Date.now() - 864e5)), R = raporGunleri();
  let hedef = null;
  if (raporVakti(simdi)){ if (!R[bugun] && gunKayitSayisi(bugun)) hedef = bugun; }
  else if (!R[dun] && gunKayitSayisi(dun)) hedef = dun;
  if (!hedef) return;
  const isaret = hedef + ":" + simdi.getHours() + ":" + (simdi.getMinutes() >= 59 ? 59 : 0);
  if (lsGet("salonDefteri.raporDeneme") === isaret) return;
  lsSet("salonDefteri.raporDeneme", isaret);
  raporOlustur(hedef, true);
}

/* Özet'te hangi gün gösterilecek: bugünün raporu, yoksa dünün. */
function raporGosterilecekGun(){
  const R = raporGunleri(), bugun = gunKey(), dun = gunKey(new Date(Date.now() - 864e5));
  if (raporCalisiyor) return raporCalisiyor;
  if (R[bugun]) return bugun;
  if (R[dun]) return dun;
  return null;
}
const DURUM_ETIKET = { iyi: "İyi", orta: "Orta", zayif: "Zayıf" };
function raporGovde(gun, rap){
  return `<div class="raporbas">
      <span class="raporpuan" style="--oran:${rap.puan * 10}%"><b>${rap.puan}</b><small>/10</small></span>
      <div><span class="ek">${besinHtml(gunAdi(gun))} · gün sonu raporu</span><h3>${besinHtml(rap.baslik)}</h3></div>
    </div>
    <p class="raporozet">${besinHtml(rap.ozet)}</p>
    ${rap.alanlar.map(a => `<div class="raporalan"><div class="kbas"><b>${besinHtml(a.alan)}</b><span class="durum ${a.durum}">${DURUM_ETIKET[a.durum]}</span></div><p>${besinHtml(a.yorum)}</p></div>`).join("")}
    ${rap.oneriler.length ? `<div class="raporoneri"><b>Yarın için</b><ul>${rap.oneriler.map(o => `<li>${besinHtml(o)}</li>`).join("")}</ul></div>` : ""}
    ${rap.yarin ? `<p class="raporyarin">${IKON.tik}<span>${besinHtml(rap.yarin)}</span></p>` : ""}`;
}
function raporKartIc(hata){
  const gun = raporGosterilecekGun(), R = raporGunleri();
  if (raporCalisiyor){
    return `<div class="kbas"><h3>Gün sonu raporu</h3><span class="ek">${besinHtml(gunAdi(raporCalisiyor))}</span></div>
      <p class="muted small" style="margin:10px 0 0"><span class="raporspin"></span>${besinHtml(raporIlerleme || "Rapor hazırlanıyor")}…</p>`;
  }
  if (!gun){
    const bugun = gunKey(), veri = gunKayitSayisi(bugun) > 0;
    const anahtar = !!apiAnahtar();
    return `<div class="kbas"><h3>Gün sonu raporu</h3><button class="ek" id="raporGecmis" style="color:var(--accent);font-weight:800;font-size:13px">Geçmiş</button></div>
      <p class="muted small" style="margin:8px 0 12px">${hata ? "Hazırlanamadı: " + besinHtml(hata)
        : !anahtar ? "Rapor için yapay zekâ anahtarı gerekiyor (yemek analizindekiyle aynı)."
        : !veri ? "Bugün henüz kayıt yok."
        : `Bugünün raporu ${RAPOR_SAAT}:${RAPOR_DAKIKA}'da kendiliğinden hazırlanır.`}</p>
      ${veri || !anahtar ? `<button class="btn quiet sm" id="raporSimdi">${anahtar ? "Şimdi hazırla" : "Anahtar gir"}</button>` : ""}`;
  }
  const rap = R[gun], yeni = gun === gunKey() && gunKayitSayisi(gun) > (rap.kayit || 0);
  const saat = new Date(rap.olusturma);
  return raporGovde(gun, rap) + `
    ${hata ? `<p class="muted small" style="color:var(--uyari)">Güncellenemedi: ${besinHtml(hata)}</p>` : ""}
    <div class="raporalt">
      <span>${String(saat.getHours()).padStart(2, "0")}:${String(saat.getMinutes()).padStart(2, "0")} · ${besinHtml(modelAdi(rap.model))}${yeni ? " · sonra yeni kayıt var" : ""}</span>
      <button class="minibtn" id="raporYenile">${yeni ? "Güncelle" : "Yenile"}</button>
      <button class="minibtn" id="raporGecmis">Geçmiş</button>
    </div>`;
}
function raporKartiYenile(hata){
  const kutu = document.getElementById("raporKart"); if (!kutu) return;
  kutu.innerHTML = raporKartIc(hata);
  const simdi = document.getElementById("raporSimdi"), yenile = document.getElementById("raporYenile"), gecmis = document.getElementById("raporGecmis");
  if (simdi) simdi.onclick = () => apiAnahtar() ? raporOlustur(gunKey()) : anahtarSor();
  if (yenile) yenile.onclick = () => raporOlustur(raporGosterilecekGun());
  if (gecmis) gecmis.onclick = raporGecmisiSheet;
}
function raporGecmisiSheet(){
  const R = raporGunleri(), gunler = Object.keys(R).sort().reverse();
  modalAc(`<h2>Geçmiş raporlar</h2>
    ${gunler.length ? gunler.map(g => `<button class="raporsatir" data-rapor="${g}">
        <span class="raporpuan kucuk" style="--oran:${R[g].puan * 10}%"><b>${R[g].puan}</b></span>
        <span><b>${besinHtml(gunAdi(g))}</b><span class="muted small">${besinHtml(R[g].baslik)}</span></span>${IKON.ok}</button>`).join("")
      : `<p class="muted small">Henüz rapor yok.</p>`}
    <button class="btn ghost" id="rgKapat">Kapat</button>`);
  document.querySelectorAll("[data-rapor]").forEach(el => el.onclick = () => {
    const g = el.dataset.rapor;
    modalAc(`${raporGovde(g, R[g])}<button class="btn quiet" id="rgGeri">Geçmişe dön</button><button class="btn ghost" id="rgKapat">Kapat</button>`);
    document.getElementById("rgGeri").onclick = raporGecmisiSheet;
    document.getElementById("rgKapat").onclick = modalKapat;
  });
  document.getElementById("rgKapat").onclick = modalKapat;
}

/* Uygulama açıkken 23:59'u bekle; o an bugünün raporunu hazırla. */
(function raporZamanla(){
  const simdi = new Date(), hedef = new Date(simdi);
  hedef.setHours(RAPOR_SAAT, RAPOR_DAKIKA, 5, 0);
  if (hedef <= simdi) hedef.setDate(hedef.getDate() + 1);
  setTimeout(() => {
    try { raporOtomatik(); } catch (e) {}
    raporZamanla();
  }, Math.min(hedef - simdi, 2147483000));
})();

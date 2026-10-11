/* Öğün düzenleme, favoriler ve fotoğraf arşivi. Ana uygulamanın durumunu kullanır. */
function besinHtml(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function besinSayi(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?n:0;
}
function gramOku(value){
  const m=String(value||'').match(/(?:^|[^\d])([\d]+(?:[.,]\d+)?)\s*(?:gram|gr\b|g\b)/i);
  return m&&+m[1].replace(',','.')>0?+m[1].replace(',','.'):null;
}
function kalemHazirla(item){
  const gram=item.gram!=null&&Number.isFinite(Number(item.gram))&&Number(item.gram)>=0
    ? Number(item.gram) : gramOku(item.porsiyon);
  const p=besinSayi(item.p??item.protein_g), k=besinSayi(item.k??item.kalori);
  return {...item,ad:String(item.ad||'Yiyecek'),gram,
    p,k,bazGram:besinSayi(item.bazGram)||gram,
    bazP:item.bazP==null?p:besinSayi(item.bazP),
    bazK:item.bazK==null?k:besinSayi(item.bazK)};
}
function gramDegistir(item,value){
  if(String(value).trim()==='') return false;
  const gram=Number(value);
  if(!Number.isFinite(gram)||gram<0) return false;
  if(!item.bazGram){
    if(!gram) return false;
    item.bazGram=gram; item.bazP=item.p; item.bazK=item.k;
  }
  item.gram=gram;
  item.p=item.bazP*gram/item.bazGram;
  item.k=item.bazK*gram/item.bazGram;
  item.porsiyon=yuvarla(gram)+' g';
  return true;
}
function kalemToplam(items){
  return items.reduce((a,x)=>({p:a.p+besinSayi(x.p),k:a.k+besinSayi(x.k)}),{p:0,k:0});
}
function duzenlemeKalemleri(meal){
  const items=(meal.kalemler||[]).map(kalemHazirla);
  // Eski ekranda elle değiştirilen öğün toplamını kalemlere dağıtarak koru.
  const toplam=kalemToplam(items);
  for(const key of ['p','k']){
    const hedef=besinSayi(meal[key]);
    if(toplam[key]>0){
      const oran=hedef/toplam[key];
      items.forEach(x=>{x[key]*=oran; x[key==='p'?'bazP':'bazK']*=oran;});
    }else if(hedef>0&&items.length){
      items[0][key]=hedef; items[0][key==='p'?'bazP':'bazK']=hedef;
    }
  }
  return items;
}
async function ogunDetaySheet(gunK,i){
  const meal=(state.meals[gunK]||[])[i]; if(!meal) return;
  const photo=meal.foto?await fotoGetir(meal.id):null;
  const draft=JSON.parse(JSON.stringify(meal));
  draft.kalemler=duzenlemeKalemleri(meal);
  let kalemModu=draft.kalemler.length>0;
  const photos=[...(photo?.oncekiler||[]),...(photo?.kalanlar||[])];
  const oncekiSayisi=photo?.oncekiler?.length||0;
  const ciz=()=>{
    modalAc(`<h2>Öğünü düzenle</h2>
      <p class="muted small">${besinHtml(gunAdi(gunK))} · Değerler tek porsiyon içindir.</p>
      ${draft.guven?`<p class="muted small">Analiz güveni: ${besinHtml({yuksek:'yüksek',orta:'orta',dusuk:'düşük'}[draft.guven]||draft.guven)}</p>`:''}
      ${photos.length?`<div class="fotogrid">${photos.map((b,j)=>`<div class="fotokare"><img src="data:image/jpeg;base64,${b}" alt="Öğün fotoğrafı"><span class="etiket">${j<oncekiSayisi?'önce':'kalan'}</span></div>`).join('')}</div>
        <button class="btn quiet sm" id="dFoto">Fotoğrafı paylaş / indir</button>`:''}
      ${meal.foto&&!photo?'<p class="muted small">Bu kaydın fotoğrafı cihazda bulunamadı. Eski sürümde silinmiş veya fotoğrafsız yedekten gelmiş olabilir.</p>':''}
      ${draft.olcek||draft.aciklama||draft.notu?`<details><summary class="muted small">Analiz açıklaması ve notlar</summary><p class="muted small">${besinHtml(draft.olcek||'')}</p><p class="muted small">${besinHtml(draft.aciklama||'')}</p><p class="muted small">${besinHtml(draft.notu||'')}</p></details>`:''}
      <label>Öğün adı</label><input class="text" id="dAd" value="${besinHtml(draft.ad)}">
      ${kalemModu?`<p class="muted small" style="margin-top:14px">Pişmiş / servis edilmiş gramajı değiştir veya yiyeceği sil. İlk analiz değerleri tahminidir.</p>
        <div id="dKalemler">${draft.kalemler.map((x,j)=>`<div class="food-edit-row">
          <div class="row between"><b>${besinHtml(x.ad)}</b><button class="iconbtn" data-kalem-sil="${j}" aria-label="${besinHtml(x.ad)} sil">✕</button></div>
          <label>${x.bazGram?'Gramaj (g)':'Başlangıç gramajı (g) — eski kayıtta belirtilmemiş'}</label>
          <input class="text" type="number" inputmode="decimal" min="0" step="any" data-gram="${j}" value="${x.gram??''}">
          <p class="muted small" data-kalem-toplam="${j}">${yuvarla(x.p)} g protein · ${Math.round(x.k)} kcal</p>
          <details><summary class="muted small">Besin değerlerini elle düzelt</summary>
            <div class="editgrid"><div><label>Bu miktarın proteini (g)</label><input type="number" min="0" step="any" data-besin-p="${j}" value="${x.p}"></div>
              <div><label>Bu miktarın kalorisi</label><input type="number" min="0" step="any" data-besin-k="${j}" value="${x.k}"></div></div></details>
        </div>`).join('')||'<p class="muted small">Tüm yiyecekler çıkarıldı; toplam sıfır.</p>'}</div>`:
        `<div class="editgrid"><div><label>Protein (g)</label><input type="number" min="0" id="dP" value="${draft.p}"></div>
        <div><label>Kalori</label><input type="number" min="0" id="dK" value="${draft.k}"></div></div>`}
      <label>Adet / porsiyon sayısı</label><input class="text" type="number" min="1" max="99" step="1" id="dAdet" value="${draft.adet||1}">
      <p id="dToplam" class="food-total"></p>
      <button class="btn" id="dKaydet">Kaydet</button>
      <button class="btn quiet" id="dFavori">Favorilere kaydet</button>
      ${photo?.oncekiler?.length?'<button class="btn quiet" id="dKalan">Hepsini yemediysen: kalanını çek</button>':''}
      <button class="btn danger" id="dSil">Bu öğünü sil</button>
      <button class="btn ghost" id="dVaz">Vazgeç</button>`);
    const ad=document.getElementById('dAd'),adet=document.getElementById('dAdet');
    const oku=()=>{
      draft.ad=ad.value.trim()||'Öğün';
      draft.adet=Math.max(1,Math.min(99,Math.floor(besinSayi(adet.value)||1)));
      const total=kalemModu?kalemToplam(draft.kalemler):{p:besinSayi(document.getElementById('dP').value),k:besinSayi(document.getElementById('dK').value)};
      draft.p=total.p; draft.k=total.k;
      if(kalemModu) draft.por=draft.kalemler.map(x=>x.ad+(x.gram!=null?' '+yuvarla(x.gram)+' g':'')).join(', ');
      document.getElementById('dToplam').textContent=`Toplam: ${yuvarla(total.p*draft.adet)} g protein · ${Math.round(total.k*draft.adet)} kcal`;
    };
    ad.oninput=oku; adet.oninput=oku;
    for(const id of ['dP','dK']){const el=document.getElementById(id);if(el)el.oninput=oku;}
    document.querySelectorAll('[data-gram]').forEach(el=>el.oninput=()=>{
      const j=+el.dataset.gram;
      el.setCustomValidity(gramDegistir(draft.kalemler[j],el.value)?'':'Geçerli bir gramaj gir.');
      const x=draft.kalemler[j];
      document.querySelector(`[data-kalem-toplam="${j}"]`).textContent=`${yuvarla(x.p)} g protein · ${Math.round(x.k)} kcal`;
      document.querySelector(`[data-besin-p="${j}"]`).value=yuvarla(x.p);
      document.querySelector(`[data-besin-k="${j}"]`).value=yuvarla(x.k);
      document.querySelector(`[data-besin-p="${j}"]`).setCustomValidity('');
      document.querySelector(`[data-besin-k="${j}"]`).setCustomValidity('');
      oku();
    });
    for(const key of ['p','k']) document.querySelectorAll(`[data-besin-${key}]`).forEach(el=>el.oninput=()=>{
      const j=+el.getAttribute(`data-besin-${key}`),item=draft.kalemler[j];
      if(item.gram===0){el.setCustomValidity('Besin değeri girmek için önce pozitif gramaj gir.');return;}
      el.setCustomValidity('');item[key]=besinSayi(el.value);
      item.bazGram=item.gram;item.bazP=item.p;item.bazK=item.k;
      document.querySelector(`[data-kalem-toplam="${j}"]`).textContent=`${yuvarla(item.p)} g protein · ${Math.round(item.k)} kcal`;oku();
    });
    document.querySelectorAll('[data-kalem-sil]').forEach(el=>el.onclick=()=>{oku();draft.kalemler.splice(+el.dataset.kalemSil,1);ciz();});
    const gecerli=()=>Array.from(document.querySelectorAll('#modalBody input')).every(el=>el.reportValidity());
    document.getElementById('dKaydet').onclick=async()=>{
      if(!gecerli())return;oku();Object.assign(meal,draft);
      const ok=await saveAll();modalKapat();renderFood();toast(ok?'Öğün güncellendi':'Kayıt cihaz hafızasına yazılamadı; yedek al.');
    };
    document.getElementById('dFavori').onclick=async()=>{
      if(!gecerli())return;oku();
      if(!draft.p&&!draft.k){toast('Boş öğün favorilere eklenemez');return;}
      state.favorites.push({...JSON.parse(JSON.stringify(draft)),id:yeniOgunId(),foto:0});
      await saveAll();toast('Favorilere eklendi');
    };
    const kalan=document.getElementById('dKalan');if(kalan)kalan.onclick=()=>kalanAkisi(gunK,photo.oncekiler,meal.notu,meal.id,meal.ad,()=>ogunDetaySheet(gunK,i));
    const foto=document.getElementById('dFoto');if(foto)foto.onclick=()=>fotoPaylasSheet(photos,meal.ad,gunK);
    document.getElementById('dSil').onclick=async()=>{
      await fotoSil(meal.id);state.meals[gunK].splice(i,1);if(!state.meals[gunK].length)delete state.meals[gunK];
      await saveAll();modalKapat();renderFood();toast('Öğün silindi');
    };
    document.getElementById('dVaz').onclick=modalKapat;oku();
  };ciz();
}
function favorilerSheet(gunK){
  modalAc(`<h2>Favori öğünler</h2><p class="muted small">Yeni kayıt bağımsızdır. Ekledikten sonra öğüne dokunarak gramajları düzenleyebilirsin.</p>
    ${state.favorites.map((x,i)=>`<div class="food-edit-row"><b>${besinHtml(x.ad)}</b>
      <p class="muted small">${besinHtml(x.por||'')} · ${yuvarla(x.p*(x.adet||1))} g protein · ${Math.round(x.k*(x.adet||1))} kcal</p>
      <div class="row"><button class="btn quiet sm" data-fav-ekle="${i}">Güne ekle</button><button class="btn ghost sm" data-fav-sil="${i}">Favoriden çıkar</button></div></div>`).join('')||'<p class="muted small">Henüz favori yok. Kayıtlı bir öğünü açıp “Favorilere kaydet” seçeneğini kullan.</p>'}
    <button class="btn ghost" id="favKapat">Kapat</button>`);
  document.querySelectorAll('[data-fav-ekle]').forEach(el=>el.onclick=async()=>{
    const item=JSON.parse(JSON.stringify(state.favorites[+el.dataset.favEkle]));item.id=yeniOgunId();item.foto=0;
    (state.meals[gunK]??=[]).push(item);await saveAll();modalKapat();renderFood();toast('Favori öğün eklendi');
  });
  document.querySelectorAll('[data-fav-sil]').forEach(el=>el.onclick=async()=>{state.favorites.splice(+el.dataset.favSil,1);await saveAll();favorilerSheet(gunK);});
  document.getElementById('favKapat').onclick=modalKapat;
}
function fotoDosyasi(base64,name){
  const raw=atob(base64),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  return new File([bytes],name,{type:'image/jpeg'});
}
function fotoPaylasSheet(photos,name,day){
  const files=photos.map((b,i)=>fotoDosyasi(b,`besin-takip-${day}-${i+1}.jpg`));
  modalAc(`<h2>Fotoğrafları kaydet</h2><p class="muted small">${besinHtml(name)} · ${besinHtml(day)}</p>
    <p class="muted small">Android paylaşım menüsünden uygun uygulamayı seçebilirsin. İndirilen fotoğrafları galerinde “Besin Takip” albümüne elle taşıyabilirsin. Otomatik albüm oluşturulmaz.</p>
    ${files.map((f,i)=>`<div class="food-edit-row"><img class="food-photo" src="data:image/jpeg;base64,${photos[i]}" alt="Öğün fotoğrafı">
      <button class="btn quiet" data-photo-share="${i}">Fotoğrafı paylaş</button><button class="btn ghost" data-photo-download="${i}">JPEG indir</button></div>`).join('')}
    <button class="btn ghost" id="fotoKapat">Kapat</button>`);
  document.querySelectorAll('[data-photo-share]').forEach(el=>{
    const file=files[+el.dataset.photoShare];
    if(!navigator.canShare?.({files:[file]})){el.disabled=true;el.textContent='Bu tarayıcıda paylaşım desteklenmiyor';}
    el.onclick=async()=>{try{await navigator.share({files:[file],title:name});}catch(e){if(e.name!=='AbortError')toast('Paylaşılamadı; JPEG indir seçeneğini kullan.');}};
  });
  document.querySelectorAll('[data-photo-download]').forEach(el=>el.onclick=()=>{
    const file=files[+el.dataset.photoDownload],url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);
  });
  document.getElementById('fotoKapat').onclick=modalKapat;
}
/* Fotoğraflı öğünler, en yeni gün başta. sinir: bu günden (dahil) sonrası. */
async function fotoluOgunler(sinir){
  const stored=await fotoSureSinirli(fotoIslem('readonly',d=>d.getAll()));
  const byId=new Map(stored.map(x=>[x.id,x])),out=[];
  Object.keys(state.meals).filter(d=>!sinir||d>=sinir).sort().reverse().forEach(day=>(state.meals[day]||[]).forEach((meal,i)=>{
    const photo=meal.id&&byId.get(meal.id);if(photo?.oncekiler?.length)out.push({day,meal,i,photo});
  }));
  return out;
}
const haftaSiniri=()=>gunKey(new Date(Date.now()-6*864e5));
let arsivDonem='hafta';
async function fotoArsiviSheet(donem){
  if(typeof donem==='string')arsivDonem=donem;
  let cards;try{cards=await fotoluOgunler(arsivDonem==='hafta'?haftaSiniri():'');}catch(e){toast('Fotoğraf arşivi okunamadı');return;}
  const gunler=[];cards.forEach((x,i)=>{const g=gunler[gunler.length-1];if(g&&g.day===x.day)g.ids.push(i);else gunler.push({day:x.day,ids:[i]});});
  modalAc(`<h2>Fotoğraf arşivi</h2><p class="muted small">Fotoğraflar bu cihazda saklanır. Fotoğrafları da içeren yedek alabilirsin.</p>
    <div class="seg" style="margin:12px 0 4px"><button data-donem="hafta" class="${arsivDonem==='hafta'?'on':''}">Son 7 gün</button><button data-donem="tum" class="${arsivDonem==='tum'?'on':''}">Tümü</button></div>
    ${gunler.map(g=>{const t=gunToplam(g.day);return `<div class="arsivgun"><b>${besinHtml(gunAdi(g.day))}</b><span>${Math.round(t.p)} g protein · ${Math.round(t.k).toLocaleString('tr-TR')} kcal</span></div>
      <div class="food-archive">${g.ids.map(i=>{const x=cards[i];return `<button class="food-archive-card" data-archive="${i}"><img src="data:image/jpeg;base64,${x.photo.oncekiler[0]}" loading="lazy" alt="${besinHtml(x.meal.ad)}"><b>${besinHtml(x.meal.ad)}</b><span class="muted small">${Math.round(x.meal.p*(x.meal.adet||1))} g protein${x.photo.kalanlar?.length?' · kalan var':''}</span></button>`;}).join('')}</div>`;}).join('')}
    ${cards.length?'':`<p class="muted small" style="margin-top:12px">${arsivDonem==='hafta'?'Son 7 günde fotoğrafı çekilmiş öğün yok.':'Henüz saklanan fotoğraf yok. Önceden silinen fotoğraflar geri getirilemez.'}</p>`}
    <button class="btn ghost" id="arsivKapat">Kapat</button>`);
  document.querySelectorAll('[data-donem]').forEach(el=>el.onclick=()=>fotoArsiviSheet(el.dataset.donem));
  document.querySelectorAll('[data-archive]').forEach(el=>el.onclick=()=>{const x=cards[+el.dataset.archive];ogunDetaySheet(x.day,x.i);});
  document.getElementById('arsivKapat').onclick=modalKapat;
}
/* Beslenme ekranındaki "Son 7 gün" fotoğraf şeridi; IndexedDB okunduktan sonra dolar. */
async function haftaFotoSeridi(){
  const kutu=document.getElementById('haftaFoto');if(!kutu)return;
  let cards;try{cards=await fotoluOgunler(haftaSiniri());}catch(e){return;}
  if(!cards.length||!document.body.contains(kutu))return;
  kutu.innerHTML=`<div class="kbas" style="margin-bottom:12px"><h3>Son 7 gün</h3><button class="ek" id="haftaTum" style="color:var(--accent);font-weight:800;font-size:13px">Tümünü gör</button></div>
    <div class="fotoserit">${cards.map((x,i)=>`<button data-hf="${i}"><img src="data:image/jpeg;base64,${x.photo.oncekiler[0]}" loading="lazy" alt="${besinHtml(x.meal.ad)}"><b>${besinHtml(x.meal.ad)}</b><span>${besinHtml(gunAdi(x.day))}</span></button>`).join('')}</div>`;
  kutu.hidden=false;
  kutu.querySelectorAll('[data-hf]').forEach(el=>el.onclick=()=>{const x=cards[+el.dataset.hf];ogunDetaySheet(x.day,x.i);});
  document.getElementById('haftaTum').onclick=()=>fotoArsiviSheet('hafta');
}

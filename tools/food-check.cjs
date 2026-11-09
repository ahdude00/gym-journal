/* Run with Node and Playwright available (Edge installed): node tools/food-check.cjs */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html')));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(error,data)=>{
    if(error){res.writeHead(404).end();return;}
    const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.gif':'image/gif','.png':'image/png'};
    res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const url=`http://127.0.0.1:${server.address().port}/index.html`;
    await page.goto(url);await page.waitForFunction(()=>typeof state!=='undefined'&&state.programs.length);
    await page.evaluate(async()=>{
      state.meals={'2026-10-11':[{id:'test-meal',ad:'Fasulye, pilav ve yoğurt',por:'Bir tabak',p:25,k:800,adet:1,foto:1,
        kalemler:[{ad:'Fasulye',gram:200,p:17,k:500},{ad:'Pilav',gram:150,p:3,k:200},{ad:'Yoğurt',gram:100,p:5,k:100}]}]};
      state.favorites=[];
      const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;canvas.getContext('2d').fillRect(0,0,100,100);
      await fotoKaydet('test-meal',[canvas.toDataURL('image/jpeg').split(',')[1]],[]);
      await fotoIslem('readwrite',store=>{const r=store.get('test-meal');r.onsuccess=()=>store.put({...r.result,gun:'2020-01-01'});return r;});
      await saveAll();state.tab='food';state.besinTarih='2026-10-11';renderFood();
    });
    await page.locator('[data-duz="0"]').click();
    await page.locator('[data-gram="1"]').fill('75');await page.locator('#dVaz').click();
    assert.equal(await page.evaluate(()=>state.meals['2026-10-11'][0].kalemler[1].gram),150,'Cancel must not edit the saved meal');
    await page.locator('[data-duz="0"]').click();
    await page.locator('[data-gram="1"]').fill('100');
    await page.locator('[data-kalem-sil="2"]').click();
    await page.locator('#dAdet').fill('2');
    assert.match(await page.locator('#dToplam').innerText(),/38 g protein/);
    assert.match(await page.locator('#dToplam').innerText(),/1267 kcal/);
    await page.locator('#dKaydet').click();
    const actual=await page.evaluate(()=>state.meals['2026-10-11'][0]);
    assert.equal(actual.kalemler.length,2);assert.equal(actual.p,19);assert(Math.abs(actual.k-633.3333333333334)<1e-8);
    // Repeated edits return to the same baseline, rather than accumulating rounding errors.
    await page.locator('[data-duz="0"]').click();await page.locator('[data-gram="1"]').fill('150');await page.locator('[data-gram="1"]').fill('100');
    await page.locator('#dFavori').click();await page.locator('#dVaz').click();
    await page.locator('#favoriler').click();await page.locator('[data-fav-ekle="0"]').click();
    await page.locator('[data-duz="1"]').click();await page.locator('[data-gram="1"]').fill('50');await page.locator('#dKaydet').click();
    assert.equal(await page.evaluate(()=>state.favorites[0].kalemler[1].gram),100);
    assert.equal(await page.evaluate(()=>state.meals['2026-10-11'][0].kalemler[1].gram),100);
    assert.equal(await page.evaluate(()=>state.meals['2026-10-11'][1].foto),0);
    await page.reload();await page.waitForFunction(()=>state.favorites.length===1);
    assert(await page.evaluate(async()=>!!await fotoGetir('test-meal')),'Old photo must survive reload');
    await page.evaluate(()=>{state.tab='food';state.besinTarih='2026-10-11';renderFood();});
    await page.locator('#arsiv').click();await page.locator('[data-archive="0"]').click();
    await page.locator('#dFoto').click();
    const photoDownload=page.waitForEvent('download');await page.locator('[data-photo-download="0"]').click();
    assert.match((await photoDownload).suggestedFilename(),/besin-takip-2026-10-11-1.jpg/);
    await page.locator('#fotoKapat').click();
    // Archive fits the mobile screen.
    await page.locator('#arsiv').click();assert(await page.evaluate(()=>document.getElementById('modalBody').scrollWidth<=document.getElementById('modalBody').clientWidth));
    await page.screenshot({path:path.join(process.env.TEMP||root,'gym-journal-food-archive.png')});await page.locator('#arsivKapat').click();
    // Manual backup includes photos, favorites and exact item reference values.
    const backupDownload=page.waitForEvent('download');await page.evaluate(()=>dosyayaAktar(false));
    const backup=await backupDownload,backupPath=await backup.path(),saved=JSON.parse(fs.readFileSync(backupPath,'utf8'));
    assert.equal(saved.favorites.length,1);assert.equal(saved.photos.length,1);assert.equal(saved.meals['2026-10-11'][0].kalemler[1].bazGram,150);
    const fresh=await browser.newContext(),restore=await fresh.newPage();await restore.goto(url);await restore.waitForFunction(()=>state.programs.length);
    await restore.evaluate(()=>{state.tab='data';renderData();});await restore.locator('#imp').setInputFiles(backupPath);
    await restore.waitForFunction(()=>state.favorites.length===1&&state.meals['2026-10-11']?.length===2);
    assert(await restore.evaluate(async()=>!!await fotoGetir('test-meal')));
    // Legacy descriptions with grams and unknown grams remain editable.
    assert.equal(await page.evaluate(()=>kalemHazirla({porsiyon:'yaklaşık 125,5 gram',p:5,k:100}).gram),125.5);
    const legacy=await page.evaluate(()=>{const x=kalemHazirla({porsiyon:'Bir kase',p:5,k:100});gramDegistir(x,200);gramDegistir(x,100);return x;});
    assert.equal(legacy.p,2.5);assert.equal(legacy.k,50);
    assert.equal(await page.evaluate(()=>gramDegistir(kalemHazirla({gram:100,p:5,k:100}),-1)),false);
    assert.equal(await page.evaluate(()=>gramDegistir(kalemHazirla({gram:100,p:5,k:100}),'')),false);
    assert.equal(await page.evaluate(()=>kalemHazirla({gram:0,bazGram:100,p:0,k:0}).gram),0);
    await page.locator('[data-duz="0"]').click();
    await page.locator('[data-besin-k="1"]').evaluate(el=>el.closest('details').open=true);
    await page.locator('[data-besin-k="1"]').fill('160');await page.locator('[data-gram="1"]').fill('50');
    assert.match(await page.locator('[data-kalem-toplam="1"]').innerText(),/80 kcal/);
    await page.locator('#dVaz').click();
    await page.locator('[data-duz="1"]').click();
    await page.locator('[data-kalem-sil="0"]').click();await page.locator('[data-kalem-sil="0"]').click();
    await page.locator('#dKaydet').click();assert.equal(await page.evaluate(()=>state.meals['2026-10-11'][1].p),0);
    assert.deepEqual(errors,[]);
    console.log('PASS: mobile meal editing, removal, portion totals, favorite isolation/persistence, permanent photo archive, JPEG download, photo backup/restore, legacy quantities and input validation.');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

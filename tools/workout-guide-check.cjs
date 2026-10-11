/* node tools/workout-guide-check.cjs (Playwright + Edge available) */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(err,data)=>{
    if(err){res.writeHead(404).end();return;}
    const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.jpg':'image/jpeg'};
    res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=`http://127.0.0.1:${server.address().port}`;
    await page.goto(url);await page.waitForFunction(()=>state.programs.length);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    assert.equal(await page.evaluate(()=>GUIDE.length),302);
    assert(await page.evaluate(()=>GUIDE.every(e=>WG_MEDIA[e.i]&&e.source==='Workout Guide')));
    await page.evaluate(()=>{state.tab='guide';renderGuide();});
    assert(await page.locator('.excard .plate img').evaluateAll(images=>images.every(i=>i.getAttribute('src').endsWith('.svg'))));
    await page.locator('#kAra').fill('Butterfly');
    assert.match(await page.locator('.excard').first().innerText(),/Butterfly Stretch/);
    await page.locator('.excard').first().click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.wg-seq img')).every(i=>i.complete&&i.naturalWidth===512));
    await page.locator('#add').click();
    assert.match(await page.locator('#modalBody').innerText(),/Butterfly Stretch/);
    assert.equal(await page.evaluate(()=>tipOf('wg-butterfly-stretch')),'sure');
    await page.evaluate(()=>modalKapat());
    await page.evaluate(()=>{state.openEx='0334';renderExDetay();});
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.wg-seq img')).every(i=>i.complete&&i.naturalWidth===512));
    assert.equal(await page.locator('.wg-seq img').count(),4);
    assert(await page.locator('.attrib').first().innerText().then(x=>x.includes('CC BY-SA')));
    const frame=()=>page.locator('.wg-seq img').evaluateAll(images=>images.findIndex(i=>getComputedStyle(i).opacity==='1'));
    const initial=await frame();await page.waitForFunction(i=>Array.from(document.querySelectorAll('.wg-seq img')).findIndex(x=>getComputedStyle(x).opacity==='1')!==i,initial);
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>390)));
    await page.screenshot({path:path.join(process.env.TEMP||root,'gym-workout-guide-mobile.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    const visible=await page.locator('.wg-seq img').evaluateAll(images=>images.filter(i=>getComputedStyle(i).display!=='none').length);
    assert.equal(visible,1);
    await page.evaluate(()=>{state.openEx='0359';renderExDetay();});
    assert.match(await page.locator('#view').innerText(),/tek kol/);
    // All core working exercises use SVGs; warming/corrective motions retain accurate fallbacks.
    assert(await page.evaluate(()=>varsayilanProgramlar().slice(0,3).every(p=>p.hareketler.slice(3,-1).every(h=>WG_MEDIA[h.ex]))));
    await page.evaluate(()=>{state.openEx='c005';renderExDetay();});
    assert.equal(await page.locator('.wg-seq').count(),0);
    assert(await page.locator('.media img').evaluate(i=>i.getAttribute('src').endsWith('.gif')));
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    await context.setOffline(true);await page.reload();await page.waitForFunction(()=>state.programs.length);
    await page.evaluate(()=>{state.openEx='0334';renderExDetay();});
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.wg-seq img')).every(i=>i.complete&&i.naturalWidth===512));
    await page.evaluate(()=>{state.openEx='wg-butterfly-stretch';renderExDetay();});
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.wg-seq img')).every(i=>i.complete&&i.naturalWidth===512));
    assert.deepEqual(errors,[]);
    console.log('PASS: full 302-exercise catalog, SVG-only picker, new exercise search/add, timed defaults, 3-frame sequence, mobile/reduced motion, legacy program coverage, corrective fallback and offline PWA.');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

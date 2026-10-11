/* Verify program media files and actual mobile/offline browser rendering.
   Requires Playwright and Microsoft Edge. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(filename,(err,data)=>{if(err){res.writeHead(404).end();return;}const mime={'.html':'text/html','.js':'text/javascript','.gif':'image/gif','.jpg':'image/jpeg','.json':'application/json','.png':'image/png'};res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  const ctx={window:{}};vm.createContext(ctx);
  for(const f of ['data/exercises.js','data/custom.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  vm.runInContext(html.slice(html.indexOf('function acilis()'),html.indexOf('/* v5:')),ctx);
  const ids=[...new Set(ctx.varsayilanProgramlar().flatMap(p=>p.hareketler.map(h=>h.ex)))];
  for(const id of ids){const e=ctx.window.EXDATA.find(e=>e.i===id);assert(e?.m,`No media metadata: ${id}`);for(const [dir,ext] of [['images','jpg'],['videos','gif']])assert(fs.existsSync(path.join(root,dir,`${e.mediaId||e.i}-${e.m}.${ext}`)),`Missing ${dir} for ${id}`);}
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(()=>state.programs.length);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
    // New media must be available offline on first use, not just after viewing.
    await context.setOffline(true);await page.reload();await page.waitForFunction(()=>state.programs.length);
    for(const id of ['c006','c007','c008','c009','c010']){
      await page.evaluate(id=>{state.openEx=id;renderExDetay();},id);
      await page.waitForFunction(()=>document.querySelector('.media img')?.complete&&document.querySelector('.media img').naturalWidth===180);
      assert(!await page.evaluate(()=>document.documentElement.scrollWidth>390));
    }
    assert.deepEqual(errors,[]);console.log(`PASS: all ${ids.length} unique program exercises have GIF/JPEG media; all five new recovery entries render offline at mobile width.`);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

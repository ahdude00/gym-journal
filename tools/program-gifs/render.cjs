/* Programdaki özel hareketlerin GIF/JPEG medyasını üretir.
   Gerekenler: Node.js, Playwright + Microsoft Edge, Python + Pillow.
   NODE_PATH mevcut bir Playwright kurulumunu gösterebilir. Üretim tamamen
   yereldir; görsel üreten bir servise istek gönderilmez.

   Kullanım: node tools/program-gifs/render.cjs [c003 c004 ...]  */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=__dirname,out=path.resolve(root,'../../'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'program-gifs-'));
const SUFFIX='anim-v2';

/* Dataset GIF'leriyle aynı ritim: 12 kare, iki uç pozda 1 sn bekleme.
   Yürüyüşler kesintisiz döngü. */
const gidisDonus=(ara,bekle=1000)=>{
  const ph=[],ms=[];
  for(let i=0;i<12;i++){const k=i<=6?i/6:(12-i)/6;ph.push(k*k*(3-2*k));ms.push(i===0||i===6?bekle:ara);}
  return {ph,ms};
};
const dongu=ms=>({ph:[...Array(12)].map((_,i)=>i/12),ms:Array(12).fill(ms)});
const LISTE={
  c003:gidisDonus(150),   // kedi-deve: yavaş omurga hareketi
  c004:gidisDonus(110),   // duvarda kol kaydırma
  c005:gidisDonus(110),   // çene içeri çekme (uçta bekleme)
  c006:dongu(100),         // evde ısınma: tempolu yerinde yürüyüş
  c008:gidisDonus(130),   // open book
  c009:gidisDonus(130),   // kapı eşiğinde göğüs esnetme
  c010:dongu(150),        // sakin yürüyüş
  c013:gidisDonus(160),   // yüzüstü Y-T-W (Y → T → W → T → Y)
  c014:gidisDonus(120),   // duvara izometrik yan kaldırış
  c015:gidisDonus(120),   // kapı kasası biceps curl
  c017:gidisDonus(130),   // tek bacak Romen deadlift
  c019:gidisDonus(120),   // havluyla izometrik çekiç curl
};
const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':'text/html');res.end(data);});
});
(async()=>{
  const secim=process.argv.slice(2).length?process.argv.slice(2):Object.keys(LISTE);
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
  try{
    const page=await b.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/scene.html`);await page.waitForFunction(()=>window.ready);
    for(const id of secim){
      const {ph,ms}=LISTE[id],dir=path.join(tmp,id);fs.mkdirSync(dir);
      await page.evaluate(([id,ph])=>window.fit(id,ph),[id,ph]);
      for(let i=0;i<ph.length;i++){
        const png=await page.evaluate(([id,t])=>window.renderFrame(id,t),[id,ph[i]]);
        fs.writeFileSync(path.join(dir,`${String(i).padStart(3,'0')}.png`),Buffer.from(png.split(',')[1],'base64'));
      }
      execFileSync('python',[path.join(root,'pack.py'),dir,path.join(out,'videos',`${id}-${SUFFIX}.gif`),path.join(out,'images',`${id}-${SUFFIX}.jpg`),ms.join(',')]);
      console.log('Üretildi',id);
    }
    if(errors.length)throw Error(errors.join('\n'));
    console.log('İnceleme kareleri:',tmp);
  }finally{await b.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

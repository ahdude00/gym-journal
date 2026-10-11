/* Deterministic Three.js + browser renderer. Playwright/Edge and Python/Pillow required.
   NODE_PATH may point to an existing Playwright installation. No generation API is used. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=__dirname,out=path.resolve(root,'../../'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'recovery-gifs-'));
const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':'text/html');res.end(data);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
  try{
    const page=await b.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/scene.html`);await page.waitForFunction(()=>window.ready);
    for(const [id,name] of [['c006','walking'],['c008','open-book'],['c009','doorway'],['c010','breathing']]){
      const dir=path.join(tmp,id);fs.mkdirSync(dir);
      for(let i=0;i<48;i++){
        const png=await page.evaluate(([name,t])=>window.renderFrame(name,t),[name,i/48]);
        fs.writeFileSync(path.join(dir,`${String(i).padStart(3,'0')}.png`),Buffer.from(png.split(',')[1],'base64'));
      }
      execFileSync('python',[path.join(root,'pack.py'),dir,path.join(out,'videos',`${id}-recovery-v1.gif`),path.join(out,'images',`${id}-recovery-v1.jpg`)]);
      console.log('Rendered',id,name);
    }
    if(errors.length)throw Error(errors.join('\n'));
    console.log('Inspection frames:',tmp);
  }finally{await b.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

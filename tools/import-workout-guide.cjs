/* Import unmodified Workout Guide SVGs from a checkout. No runtime API/npm dependency.
   node tools/import-workout-guide.cjs C:/path/to/workout-guide */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const checkout=path.resolve(process.argv[2]||'');
const pkg=path.join(checkout,'packages/workout-guide');
const catalog=JSON.parse(fs.readFileSync(path.join(pkg,'manifest.json'),'utf8'));
const context={window:{}};vm.createContext(context);
for(const file of ['data/exercises.js','data/custom.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const exercises=context.window.EXDATA;
const norm=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const equipment={barbell:'Barbell',dumbbell:'Dumbbell','body weight':'Bodyweight',cable:'Cable',kettlebell:'Kettlebell'};
const manual={
  '0652':['negative-pull-up'], '0292':['one-arm-dumbbell-row'],
  '0293':['dumbbell-bent-over-row'], '0334':['lateral-raise'],
  '0359':['rear-delt-fly','Genel çift kol gösterimi. Programda bank desteğiyle tek kol uygula.'],
  '0294':['bicep-curl'], '0276':['dead-bug'], '1760':['goblet-squat'],
  '1459':['dumbbell-romanian-deadlift'],
  '0404':['seated-dumbbell-press','Genel oturarak press gösterimi. Programdaki nötr tutuşta avuçlar birbirine bakar.'],
  '0405':['seated-dumbbell-press'], '0662':['push-up'], '0313':['hammer-curl'],
  '2189':['dumbbell-overhead-tricep-extension'], '0351':['dumbbell-skull-crusher'],
  '2141':['elliptical'], '1422':['glute-bridge'],
  'c001':['plank'], 'c002':['pike-push-up'], 'c003':['cat-cow-stretch'],
  'c006':['walking','Isınmada rahat yürüyüşe omuz ve bilek hareketlerini ekle.'],
  'c007':['wall-push-up','Kolay seçenek: duvar şınavı. İstersen dizler yerde şınav yap.'],
  'c009':['doorway-chest-stretch'], 'c010':['walking','Kapanışın sonunda sakin nefes bölümünü uygula.'],
  '0289':['dumbbell-bench-press'], '0279':['decline-push-up'], '0705':['side-plank'],
  '0659':['wall-push-up'], '0489':['back-extension'], '0375':['dumbbell-pullover']
};
const aliases={
  'dumbbell hammer curl':'hammer-curl','dumbbell concentration curl':'concentration-curl',
  'dumbbell incline biceps curl':'incline-dumbbell-curl','barbell curl':'bicep-curl',
  'dumbbell fly':'dumbbell-fly','dumbbell incline bench press':'incline-dumbbell-press',
  'dumbbell standing overhead press':'standing-dumbbell-press','barbell bent over row':'barbell-row',
  'barbell romanian deadlift':'romanian-deadlift','barbell deadlift':'deadlift',
  'barbell front squat':'front-squat','barbell full squat':'squat','barbell bench press':'bench-press',
  'barbell incline bench press':'incline-bench-press','barbell decline bench press':'decline-bench-press',
  'dumbbell shrug':'dumbbell-shrug','bodyweight squat':'bodyweight-squat',
  'push up':'push-up','pull up':'pull-up','chin up':'chin-up','side plank':'side-plank',
  'dumbbell standing calf raise':'standing-calf-raise','dumbbell seated calf raise':'seated-calf-raise',
  'weighted crunch':'weighted-crunch','dumbbell side bend':'dumbbell-side-bend'
};
const map={};const used=new Set();
for(const exercise of exercises){
  const override=manual[exercise.i];
  const exact=catalog.find(x=>norm(x.name)===norm(exercise.n)&&equipment[exercise.q]===x.equipment);
  const slug=override?.[0]||aliases[norm(exercise.n)]||exact?.slug;
  const item=catalog.find(x=>x.slug===slug);if(!item)continue;
  if(!override&&equipment[exercise.q]!==item.equipment)continue;
  for(const n of [1,2,3])if(!fs.existsSync(path.join(pkg,'assets',item.slug,`frame-${n}.svg`)))throw Error('Missing SVG: '+item.slug);
  used.add(item.slug);
  map[exercise.i]={slug:item.slug,frames:[1,2,3].map(n=>`assets/workout-guide/${item.slug}/frame-${n}.svg`),note:override?.[1]||''};
}
// Keep legacy IDs in EX for saved programs/history; expose the full new catalog separately.
const precache=[...new Set(Object.values(map).flatMap(x=>x.frames))];
const muscle={Chest:'pectorals',Shoulders:'delts','Rear Delts':'delts','Upper Back':'upper back',
  'Posterior Chain':'posterior chain',Hamstrings:'hamstrings',Back:'lats',Lats:'lats',Biceps:'biceps',
  Quads:'quads',Glutes:'glutes',Calves:'calves',Forearms:'forearms',Triceps:'triceps',Core:'abs',
  Legs:'quads','Lower Back':'spine',Adductors:'adductors',Mobility:'mobility',Hips:'glutes'};
const region={Chest:'chest',Shoulders:'shoulders','Rear Delts':'shoulders','Upper Back':'back',
  'Posterior Chain':'upper legs',Hamstrings:'upper legs',Back:'back',Lats:'back',Biceps:'upper arms',
  Quads:'upper legs',Glutes:'upper legs',Calves:'lower legs',Forearms:'lower arms',Triceps:'upper arms',
  Core:'waist',Legs:'upper legs','Lower Back':'back',Adductors:'upper legs',Mobility:'mobility',Hips:'upper legs'};
const gear={Barbell:'barbell',Dumbbell:'dumbbell',Machine:'leverage machine',Cable:'cable',
  Bodyweight:'body weight',Cardio:'cardio',Plate:'weighted',Kettlebell:'kettlebell',
  'Pull-up Bar':'pull-up bar',Bench:'bench',Wall:'wall',Chair:'chair',Doorway:'doorway',Towel:'towel',
  Box:'box','Stability Ball':'stability ball','Resistance Band':'resistance band'};
const fullCatalog=catalog.map(item=>{
  const id='wg-'+item.slug;
  used.add(item.slug);
  map[id]={slug:item.slug,frames:[1,2,3].map(n=>`assets/workout-guide/${item.slug}/frame-${n}.svg`),note:''};
  const old=exercises.find(x=>map[x.i]?.slug===item.slug&&!map[x.i].note&&item.slug!=='negative-pull-up');
  const tip=/duration/.test(item.exerciseType)?'sure':item.exerciseType==='weight_reps'?'kg':'vucut';
  return {i:id,n:item.name,c:item.equipment==='Cardio'?'cardio':region[item.primaryMuscle]||'mobility',
    q:gear[item.equipment]||'body weight',t:muscle[item.primaryMuscle]||item.primaryMuscle.toLowerCase(),
    s:item.secondaryMuscles.map(x=>muscle[x]||x.toLowerCase()),d:old?.d||[],tip,
    oneri:{tekrar:tip==='sure'?30:10},source:'Workout Guide'};
});
const destination=path.join(root,'assets/workout-guide');fs.mkdirSync(destination,{recursive:true});
for(const slug of used){
  const dir=path.join(destination,slug);fs.mkdirSync(dir,{recursive:true});
  for(const n of [1,2,3])fs.copyFileSync(path.join(pkg,'assets',slug,`frame-${n}.svg`),path.join(dir,`frame-${n}.svg`));
}
for(const file of ['LICENSE-ASSETS','LICENSES.md','ATTRIBUTION.md']){
  const source=fs.existsSync(path.join(pkg,file))?path.join(pkg,file):path.join(checkout,file);
  fs.copyFileSync(source,path.join(destination,file));
}
const revision=require('node:child_process').execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
fs.writeFileSync(path.join(destination,'sources.json'),JSON.stringify({repository:'https://github.com/bryllim/workout-guide',revision,modified:false,exercises:catalog.filter(x=>used.has(x.slug))},null,2));
fs.writeFileSync(path.join(root,'data/workout-guide.js'),'/* Unmodified SVGs © Bryl Lim / Everkinetic, CC BY-SA 4.0. See assets/workout-guide. */\nglobalThis.WG_MEDIA='+JSON.stringify(map,null,2)+';\nglobalThis.WG_CATALOG='+JSON.stringify(fullCatalog,null,2)+';\nglobalThis.WG_PRECACHE='+JSON.stringify(precache)+';\n');
console.log(`${fullCatalog.length} catalog exercises, ${Object.keys(map).length-fullCatalog.length} legacy mappings, ${used.size*3} SVGs. Unvisited catalog SVGs cache on demand.`);

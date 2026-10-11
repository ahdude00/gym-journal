/* Anatomik figür: kas gruplarını temsil eden elipsoitler "yumuşak birleşim"
   (smooth-min) ile tek bir mesafe alanında toplanır ve Surface Nets ile tek
   parça, pürüzsüz bir yüzeye çevrilir. Kas araları bu birleşimde doğal oyuklar
   oluşturur; köşe başına hesaplanan ortam gölgesi (AO) onları koyulaştırır.
   Böylece dataset illüstrasyonlarındaki gibi kas ayrımları belirir. */
import * as T from './vendor/three.module.js';

export const V=a=>a instanceof T.Vector3?a.clone():new T.Vector3(...a);
export const add=(a,b)=>V(a).add(V(b)),sub=(a,b)=>V(a).sub(V(b)),mul=(a,k)=>V(a).multiplyScalar(k);
export const lerp=(a,b,t)=>V(a).lerp(V(b),t),mix=(a,b,t)=>a+(b-a)*t,deg=Math.PI/180;

/* Malzeme kanalları: 0 ten, 1 kırmızı (hedef kas), 2 şort, 3 saç */
export const SKIN=0,RED=1,SHORTS=2,HAIR=3;
/* sRGB olarak yazıldı, köşe renkleri doğrusal uzayda olduğu için çevriliyor. */
const COLORS=[[.95,.95,.95],[.85,.25,.21],[.11,.115,.13],[.17,.17,.18]].map(c=>c.map(x=>Math.pow(x,2.2)));

let prims=[];const rig=new T.Object3D();
export function reset(){prims=[];rig.clear();}

/* Segment çerçevesi: y = a→b, z = fwd ipucuna dik, x = y×z. */
export function frame(a,b,fwd){
  const A=V(a),y=sub(b,a),L=y.length();y.normalize();
  let z=V(fwd);z.addScaledVector(y,-z.dot(y));
  if(z.lengthSq()<1e-8)z=Math.abs(y.z)<.9?new T.Vector3(0,0,1):new T.Vector3(1,0,0);
  z.normalize();const x=new T.Vector3().crossVectors(y,z);
  return {o:A,x,y,z,L,at:(lx,ly,lz)=>A.clone().addScaledVector(x,lx).addScaledVector(y,ly).addScaledVector(z,lz)};
}
export function seg(a,b,fwd,lat){
  const f=frame(a,b,fwd),g=new T.Object3D();
  g.position.copy(f.o);g.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(f.x,f.y,f.z));
  rig.add(g);g.L=f.L;g.k=lat?Math.sign(f.x.dot(V(lat)))||1:1;return g;
}
/* k: bu parçanın gövdeye ne kadar yumuşak kaynaşacağı (m). */
export function blob(parent,p,r,mat=SKIN,rot,k=.018){
  const o=new T.Object3D();o.position.set(...p);if(rot)o.rotation.set(...rot);parent.add(o);
  prims.push({o,r:V(r),mat,k});return o;
}

function sdEllipsoid(px,py,pz,rx,ry,rz){
  const k0=Math.hypot(px/rx,py/ry,pz/rz),k1=Math.hypot(px/(rx*rx),py/(ry*ry),pz/(rz*rz));
  return k1<1e-9?-Math.min(rx,ry,rz):k0*(k0-1)/k1;
}

/* Alanı ızgarada örnekle ve Surface Nets ile mesh üret. */
export function polygonize(cell=.0062){
  rig.updateMatrixWorld(true);
  const P=prims.map(q=>{
    const inv=new T.Matrix4().copy(q.o.matrixWorld).invert(),c=new T.Vector3().setFromMatrixPosition(q.o.matrixWorld);
    return {...q,e:inv.elements,c,R:Math.max(q.r.x,q.r.y,q.r.z)};
  });
  const pad=.09,lo=new T.Vector3(1e9,1e9,1e9),hi=new T.Vector3(-1e9,-1e9,-1e9);
  for(const q of P){lo.min(q.c.clone().subScalar(q.R+pad));hi.max(q.c.clone().addScalar(q.R+pad));}
  const nx=Math.ceil((hi.x-lo.x)/cell)+1,ny=Math.ceil((hi.y-lo.y)/cell)+1,nz=Math.ceil((hi.z-lo.z)/cell)+1;
  const N=nx*ny*nz,F=new Float32Array(N).fill(1),D=[0,1,2,3].map(()=>new Float32Array(N).fill(1));
  const idx=(i,j,k)=>i+nx*(j+ny*k);
  for(const q of P){
    const m=q.R+pad,e=q.e,{x:rx,y:ry,z:rz}=q.r,K=q.k,dm=D[q.mat];
    const i0=Math.max(0,Math.floor((q.c.x-m-lo.x)/cell)),i1=Math.min(nx-1,Math.ceil((q.c.x+m-lo.x)/cell));
    const j0=Math.max(0,Math.floor((q.c.y-m-lo.y)/cell)),j1=Math.min(ny-1,Math.ceil((q.c.y+m-lo.y)/cell));
    const k0=Math.max(0,Math.floor((q.c.z-m-lo.z)/cell)),k1=Math.min(nz-1,Math.ceil((q.c.z+m-lo.z)/cell));
    for(let k=k0;k<=k1;k++){const z=lo.z+k*cell;
      for(let j=j0;j<=j1;j++){const y=lo.y+j*cell;let n=idx(i0,j,k);
        for(let i=i0;i<=i1;i++,n++){const x=lo.x+i*cell;
          const px=e[0]*x+e[4]*y+e[8]*z+e[12],py=e[1]*x+e[5]*y+e[9]*z+e[13],pz=e[2]*x+e[6]*y+e[10]*z+e[14];
          const d=sdEllipsoid(px,py,pz,rx,ry,rz);
          if(d<dm[n])dm[n]=d;
          const a=F[n],h=Math.max(K-Math.abs(a-d),0)/K;F[n]=Math.min(a,d)-h*h*K*.25;
        }}}
  }
  const sample=(x,y,z,arr=F)=>{
    let fx=(x-lo.x)/cell,fy=(y-lo.y)/cell,fz=(z-lo.z)/cell;
    fx=Math.min(Math.max(fx,0),nx-1.001);fy=Math.min(Math.max(fy,0),ny-1.001);fz=Math.min(Math.max(fz,0),nz-1.001);
    const i=fx|0,j=fy|0,k=fz|0,u=fx-i,v=fy-j,w=fz-k,n=idx(i,j,k),sx=1,sy=nx,sz=nx*ny;
    const c00=arr[n]*(1-u)+arr[n+sx]*u,c10=arr[n+sy]*(1-u)+arr[n+sy+sx]*u,c01=arr[n+sz]*(1-u)+arr[n+sz+sx]*u,c11=arr[n+sz+sy]*(1-u)+arr[n+sz+sy+sx]*u;
    return (c00*(1-v)+c10*v)*(1-w)+(c01*(1-v)+c11*v)*w;
  };
  // Surface Nets: işaret değişen her hücreye bir köşe
  const cnx=nx-1,cny=ny-1,cnz=nz-1,cellV=new Int32Array(cnx*cny*cnz).fill(-1),pos=[];
  const CORN=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
  const EDGES=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const val=new Float32Array(8);
  for(let k=0;k<cnz;k++)for(let j=0;j<cny;j++)for(let i=0;i<cnx;i++){
    let inside=0;
    for(let c=0;c<8;c++){const C=CORN[c];val[c]=F[idx(i+C[0],j+C[1],k+C[2])];if(val[c]<0)inside++;}
    if(inside===0||inside===8)continue;
    let sx=0,sy=0,sz=0,cnt=0;
    for(const [a,b] of EDGES){const va=val[a],vb=val[b];if((va<0)===(vb<0))continue;
      const t=va/(va-vb),A=CORN[a],B=CORN[b];sx+=A[0]+(B[0]-A[0])*t;sy+=A[1]+(B[1]-A[1])*t;sz+=A[2]+(B[2]-A[2])*t;cnt++;}
    cellV[i+cnx*(j+cny*k)]=pos.length/3;
    pos.push(lo.x+(i+sx/cnt)*cell,lo.y+(j+sy/cnt)*cell,lo.z+(k+sz/cnt)*cell);
  }
  const cid=(i,j,k)=>cellV[i+cnx*(j+cny*k)],ind=[];
  const quad=(a,b,c,d,flip)=>{if(a<0||b<0||c<0||d<0)return;if(!flip)ind.push(a,c,b,a,d,c);else ind.push(a,b,c,a,c,d);};
  for(let k=1;k<cnz;k++)for(let j=1;j<cny;j++)for(let i=1;i<cnx;i++){
    const f0=F[idx(i,j,k)]<0;
    if(f0!==(F[idx(i+1,j,k)]<0))quad(cid(i,j-1,k-1),cid(i,j,k-1),cid(i,j,k),cid(i,j-1,k),f0);
    if(f0!==(F[idx(i,j+1,k)]<0))quad(cid(i-1,j,k-1),cid(i-1,j,k),cid(i,j,k),cid(i,j,k-1),f0);
    if(f0!==(F[idx(i,j,k+1)]<0))quad(cid(i-1,j-1,k),cid(i,j-1,k),cid(i,j,k),cid(i-1,j,k),f0);
  }
  // normal, renk ve ortam gölgesi
  const nv=pos.length/3,nor=new Float32Array(nv*3),col=new Float32Array(nv*3),out=new Float32Array(nv*3),h=cell;
  for(let v=0;v<nv;v++){
    const x=pos[3*v],y=pos[3*v+1],z=pos[3*v+2];
    let gx=sample(x+h,y,z)-sample(x-h,y,z),gy=sample(x,y+h,z)-sample(x,y-h,z),gz=sample(x,y,z+h)-sample(x,y,z-h);
    const gl=Math.hypot(gx,gy,gz)||1;gx/=gl;gy/=gl;gz/=gl;nor.set([gx,gy,gz],3*v);
    let occ=0;
    for(const [s,w] of [[.012,1],[.024,.8],[.045,.55],[.075,.35]]){const d=sample(x+gx*s,y+gy*s,z+gz*s);occ+=Math.max(0,(s-d)/s)*w;}
    const ao=1-Math.min(.7,occ*.55);
    // malzeme ağırlıkları: en yakın kanal baskın, sınırda yumuşak geçiş
    let wsum=0,r=0,g=0,b=0;const dd=[0,1,2,3].map(m=>sample(x,y,z,D[m]));const dmin=Math.min(...dd);
    for(let m=0;m<4;m++){const w=Math.exp(-(dd[m]-dmin)/.0022);wsum+=w;r+=COLORS[m][0]*w;g+=COLORS[m][1]*w;b+=COLORS[m][2]*w;}
    col.set([r/wsum*ao,g/wsum*ao,b/wsum*ao],3*v);
    out.set([x+gx*.0075,y+gy*.0075,z+gz*.0075],3*v);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(nor,3));
  geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setIndex(ind);
  const hull=new T.BufferGeometry();hull.setAttribute('position',new T.BufferAttribute(out,3));hull.setIndex(ind);
  return {geo,hull};
}
/* Yaklaşık sınırlar (kamera ayarı için): ilkel merkezleri ± yarıçap. */
export function primBounds(){
  rig.updateMatrixWorld(true);
  return prims.map(q=>({c:new T.Vector3().setFromMatrixPosition(q.o.matrixWorld),R:Math.max(q.r.x,q.r.y,q.r.z)}));
}

/* ---------------- FİGÜR ---------------- */
let HL={};export function setHL(h){HL=h;}
const hl=(name,side,base=SKIN)=>{const h=HL[name];return h===true||(h&&h===side)?RED:base;};

function torso(J){
  const lo=seg(J.pelvis,J.waist,J.fwdLo),up=seg(J.waist,J.neck,J.fwdUp),Lo=lo.L,Lu=up.L;
  blob(lo,[0,.03,-.005],[.16,.125,.112],SHORTS,null,.03);
  for(const s of[-1,1])blob(lo,[s*.075,-.02,-.055],[.085,.098,.08],SHORTS,null,.03);
  blob(lo,[0,Lo*.85,.0],[.138,Lo*.78,.094],SKIN,null,.03);
  for(const s of[-1,1]){
    const side=s>0?'L':'R';
    blob(lo,[s*.112,Lo*.82,.01],[.044,Lo*.62,.07],hl('obl',side),null,.025);
    blob(lo,[s*.034,Lo*.72,-.074],[.034,Lo*.7,.03],hl('erect',side),null,.02);
    for(const r of[.48,.95])blob(lo,[s*.03,Lo*r,.08],[.03,.036,.014],hl('abs',side),null,.016);
  }
  blob(up,[0,Lu*.46,-.004],[.152,Lu*.56,.102],SKIN,null,.03);
  for(const s of[-1,1]){
    const side=s>0?'L':'R';
    for(const r of[.08,.27])blob(up,[s*.031,Lu*r,.086],[.03,.04,.015],hl('abs',side),null,.016);
    if(hl('serr',side)===RED)for(const r of[.36,.46])blob(up,[s*.116,Lu*r,.05],[.022,.018,.02],RED,[0,0,s*.5],.012);
    blob(up,[s*.128,Lu*.55,-.035],[.055,Lu*.4,.064],hl('lats',side),[0,0,s*-.12],.025);
    blob(up,[s*.07,Lu*.76,.064],[.09,.062,.036],hl('pec',side),[0,0,s*-.12],.014);
    blob(up,[s*.07,Lu*.98,-.03],[.076,.05,.046],hl('traps',side),[0,0,s*.35],.025);
    blob(up,[s*.058,Lu*.66,-.074],[.062,Lu*.3,.036],hl('back',side),null,.02);
    blob(up,[s*.034,Lu*.42,-.08],[.03,Lu*.5,.028],hl('erect',side),null,.02);
  }
}
function arm(a,side){
  const ua=seg(a.sh,a.el,a.fwd,a.lat),fa=seg(a.el,a.wr,a.fwd,a.lat);
  blob(ua,[0,.035,.004],[.064,.092,.066],hl('delt',side),null,.024);
  blob(ua,[0,ua.L*.55,0],[.042,ua.L*.52,.042],SKIN,null,.02);
  blob(ua,[0,ua.L*.56,.022],[.038,ua.L*.3,.042],hl('bi',side),null,.012);
  blob(ua,[0,ua.L*.47,-.026],[.043,ua.L*.34,.043],hl('tri',side),null,.012);
  blob(ua,[0,ua.L,0],[.035,.038,.035],SKIN,null,.02);
  blob(fa,[0,fa.L*.3,0],[.043,fa.L*.34,.038],SKIN,null,.02);
  blob(fa,[0,fa.L*.64,0],[.031,fa.L*.42,.026],SKIN,null,.02);
  const hd=seg(a.wr,add(a.wr,mul(V(a.hand).normalize(),.09)),a.palm,a.lat);
  blob(hd,[0,.042,0],[.039,.048,.017],SKIN,null,.015);blob(hd,[0,.094,0],[.034,.035,.014],SKIN,null,.012);
  blob(hd,[hd.k*.038,.028,.012],[.012,.032,.013],SKIN,[0,0,hd.k*.5],.01);
}
function leg(l,side){
  const th=seg(l.hip,l.knee,l.kneeFwd,l.lat),sh=seg(l.knee,l.ankle,l.kneeFwd,l.lat),k=th.k,c=sh.k;
  blob(th,[0,.075,0],[.1,.16,.1],SHORTS,null,.02);
  blob(th,[0,th.L*.5,0],[.08,th.L*.52,.077],SKIN,null,.025);
  blob(th,[k*.044,th.L*.5,.0],[.048,th.L*.36,.062],hl('quad',side),null,.014);
  blob(th,[-k*.038,th.L*.8,.024],[.046,.074,.045],hl('quad',side),null,.012);
  blob(th,[0,th.L*.47,.044],[.043,th.L*.34,.038],hl('quad',side),null,.012);
  blob(th,[0,th.L*.5,-.044],[.057,th.L*.34,.047],hl('ham',side),null,.016);
  blob(th,[-k*.048,th.L*.3,0],[.04,th.L*.26,.048],SKIN,null,.02);
  blob(th,[0,th.L*.98,.012],[.042,.046,.04],SKIN,null,.03);
  blob(sh,[0,sh.L*.5,0],[.043,sh.L*.52,.04],SKIN,null,.02);
  blob(sh,[c*.019,sh.L*.3,-.036],[.04,sh.L*.21,.043],hl('calf',side),null,.012);
  blob(sh,[-c*.019,sh.L*.33,-.032],[.038,sh.L*.19,.04],hl('calf',side),null,.012);
  blob(sh,[c*.019,sh.L*.4,.024],[.026,sh.L*.2,.026],SKIN,null,.012);
  blob(sh,[0,sh.L,0],[.033,.034,.033],SKIN,null,.02);
  const ft=seg(l.ankle,l.toe,l.footUp,l.lat);
  blob(ft,[0,ft.L*.5,-.012],[.044,ft.L*.6,.029],SKIN,null,.02);blob(ft,[0,ft.L*.05,-.02],[.036,.05,.038],SKIN,null,.02);
}
function headNeck(J){
  const hb=sub(J.headC,mul(J.headUp,.085)).addScaledVector(V(J.headFwd),-.015);
  const nk=seg(J.neck,hb,J.headFwd);
  blob(nk,[0,nk.L*.5,-.004],[.062,nk.L*.85,.058],SKIN,null,.03);
  for(const s of[-1,1])blob(nk,[s*.025,nk.L*.45,.03],[.018,nk.L*.62,.019],hl('neck',s>0?'L':'R'),[0,0,s*-.25],.012);
  if(hl('neck','L')===RED)blob(nk,[0,nk.L*.45,.032],[.03,nk.L*.55,.022],RED,null,.015);
  const h=seg(J.headC,add(J.headC,J.headUp),J.headFwd);
  blob(h,[0,.02,-.01],[.09,.108,.102],SKIN,null,.02);
  blob(h,[0,-.05,.03],[.068,.068,.072],SKIN,null,.03);
  blob(h,[0,-.096,.054],[.032,.028,.028],SKIN,null,.02);
  blob(h,[0,-.014,.097],[.014,.029,.019],SKIN,null,.012);
  for(const s of[-1,1])blob(h,[s*.087,-.006,-.006],[.015,.03,.02],SKIN,null,.01);
  blob(h,[0,.05,-.024],[.094,.088,.098],HAIR,null,.006);
}
export function buildFigure(J){
  reset();torso(J);headNeck(J);
  for(const side of['L','R']){arm({...J.arm[side],fwd:(J.armFwd&&J.armFwd[side])||[0,0,1]},side);leg(J.leg[side],side);}
}

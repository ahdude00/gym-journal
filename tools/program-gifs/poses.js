/* Hareketlerin pozları. Her poz fonksiyonu 0..1 arası bir faz alır ve eklem
   noktalarını döndürür (metre, y yukarı). */
import * as T from './vendor/three.module.js';
import {V,add,sub,mul,lerp,mix,deg,frame} from './body.js';

export function ik(a,b,l1,l2,bend){
  const A=V(a),D=sub(b,a),len=D.length(),u=D.clone().normalize(),d=Math.min(len,l1+l2-.002);
  const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
  const n=V(bend);n.addScaledVector(u,-n.dot(u)).normalize();
  return A.addScaledVector(u,x).addScaledVector(n,h);
}
/* Gövde çerçevelerinden omuz ve kalça eklemleri. */
function joints(P,W,N,fwdLo,fwdUp){
  const lo=frame(P,W,fwdLo),up=frame(W,N,fwdUp);
  return {lo,up,
    hip:{L:lo.at(.098,0,.0),R:lo.at(-.098,0,.0)},
    sh:{L:up.at(.188,up.L-.05,-.012),R:up.at(-.188,up.L-.05,-.012)},
    latLo:{L:lo.x.clone(),R:lo.x.clone().negate()},latUp:{L:up.x.clone(),R:up.x.clone().negate()}};
}
function footOf(ankle,dir,up){return {toe:add(ankle,mul(V(dir).normalize(),.16)),footUp:up};}

// Ayakta: yerinde yürüyüş (c006 tempolu, c010 sakin)
export function walk(ph,o){
  const w=Math.sin(ph*2*Math.PI),bob=Math.abs(Math.cos(ph*2*Math.PI))*o.bob;
  const P=[0,.965-o.bob+bob,0],W=add(P,[0,.2,.004]),N=add(W,[0,.37,-.006]);
  const F=[0,0,1],j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  for(const side of['L','R']){
    const s=side==='L'?1:-1,lift=Math.max(0,w*s)*o.lift,hip=j.hip[side];
    const a=lift*o.knee*deg,b=a*1.45;
    const knee=add(hip,[s*.008,-.45*Math.cos(a),.45*Math.sin(a)]);
    const ankle=add(knee,[0,-.44*Math.cos(a-b),.44*Math.sin(a-b)]);
    if(lift<=0){ankle.y=.075;ankle.z=.0;}
    const kn=lift>0?knee:ik(hip,ankle,.45,.44,[0,0,1]);
    const fd=lift>0?[0,-Math.sin(lift*.5),1]:[0,-.32,1];
    const f=footOf(ankle,fd,[0,1,0]);
    J.leg[side]={hip,knee:kn,ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[0,0,1],lat:j.latLo[side]};
    const g=-w*s*o.swing*deg,e=o.elbow*deg,sh=j.sh[side];
    const el=add(sh,[s*.03,-.3*Math.cos(g),.3*Math.sin(g)]);
    const fdir=V([s*.05,-Math.cos(g+e),Math.sin(g+e)]).normalize(),wr=add(el,mul(fdir,.27));
    J.arm[side]={sh,el,wr,hand:fdir,palm:[-s,0,0],lat:j.latUp[side]};J.armFwd[side]=[0,0,1];
  }
  J.headC=add(N,[0,.175,.025]);J.headUp=[0,1,0];J.headFwd=[0,0,1];
  return J;
}
// Duvarda kol kaydırma: W → Y
export function wallSlide(u){
  const P=[0,.945,-.05],W=add(P,[0,.2,.0]),N=add(W,[0,.37,-.012]);
  const F=[0,0,1],j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  const a=mix(82,152,u)*deg,b=mix(176,166,u)*deg;
  for(const side of['L','R']){
    const s=side==='L'?1:-1,hip=j.hip[side],ankle=V([s*.12,.075,.1]);
    const f=footOf(ankle,[s*.12,-.3,1],[0,1,0]);
    J.leg[side]={hip,knee:ik(hip,ankle,.45,.44,[0,0,1]),ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[0,0,1],lat:j.latLo[side]};
    const sh=j.sh[side],el=add(sh,[s*.3*Math.sin(a),-.3*Math.cos(a),0]);el.z=-.115;
    const fdir=V([s*Math.sin(b),-Math.cos(b),0]).normalize(),wr=add(el,mul(fdir,.27));wr.z=-.12;
    J.arm[side]={sh,el,wr,hand:fdir,palm:[0,0,1],lat:j.latUp[side]};J.armFwd[side]=[0,0,1];
  }
  J.headC=add(N,[0,.172,.0]);J.headUp=[0,1,0];J.headFwd=[0,-.08,1];
  return J;
}
// Sırtüstü çene içeri çekme
export function chinTuck(u){
  const P=[0,.125,0],W=[.2,.13,0],N=[.57,.135,0],F=[0,1,0];
  const j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  for(const side of['L','R']){
    const s=side==='L'?1:-1,hip=j.hip[side],ankle=V([-.43,.075,s*.13]);
    const knee=ik(hip,ankle,.45,.44,[0,1,0]),f=footOf(ankle,[-1,-.25,0],[0,1,0]);
    J.leg[side]={hip,knee,ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[.6,1,0],lat:j.latLo[side]};
    const sh=j.sh[side],el=add(sh,[-.29,-.06,s*.05]);el.y=Math.max(el.y,.055);
    const wr=add(el,[-.26,0,s*.03]);wr.y=.05;
    J.arm[side]={sh,el,wr,hand:[-1,-.05,0],palm:[0,-1,0],lat:j.latUp[side]};J.armFwd[side]=[0,1,0];
  }
  const n=mix(-3,24,u)*deg;
  J.headUp=[Math.cos(n),Math.sin(n),0];J.headFwd=[-Math.sin(n),Math.cos(n),0];
  J.headC=V([.75+.012*u,.105,0]);
  return J;
}
// Kedi-deve (dört ayak)
export function catCow(u){
  const s=mix(1,-1,u); // +1 kedi (sırt yuvarlak), -1 deve (sırt çukur)
  const hipY=.5,P=[0,hipY+.01*s,0],W=[.21,s>0?.6+.08*s:.6+.11*s,0],N=[.57,.62+(s>0?.01*s:-.025*s),0],F=[0,-1,0];
  const fLo=[.12*s,-1,0],fUp=[-.15*s,-1,0];
  const j=joints(P,W,N,fLo,fUp),J={pelvis:P,waist:W,neck:N,fwdLo:fLo,fwdUp:fUp,arm:{},leg:{},armFwd:{}};
  for(const side of['L','R']){
    const z=side==='L'?-1:1,hip=j.hip[side],knee=V([hip.x,.055,z*.1]),ankle=V([knee.x-.43,.075,z*.1]);
    J.leg[side]={hip,knee,ankle,toe:add(ankle,[-.15,-.035,0]),footUp:[0,-1,0],kneeFwd:[1,0,0],lat:j.latLo[side]};
    const sh=j.sh[side],wr=V([.6,.05,z*.17]),el=ik(sh,wr,.3,.27,[-1,0,0]);
    J.arm[side]={sh,el,wr,hand:[1,-.1,0],palm:[0,-1,0],lat:j.latUp[side]};J.armFwd[side]=[1,0,0];
  }
  const th=mix(-58,36,u)*deg,hu=V([Math.cos(th),Math.sin(th),0]);
  J.headUp=hu;J.headFwd=[Math.sin(th),-Math.cos(th),0];
  J.headC=add(N,mul(lerp([1,0,0],hu,.5).normalize(),.1)).addScaledVector(hu,.085);
  return J;
}
// Yan yatışta open book
export function openBook(u){
  const th=u*78*deg,phi=mix(-22,192,u)*deg;
  const Ls=V([.53,.085,0]),lat=V([0,Math.cos(th),-Math.sin(th)]),fwd=V([0,Math.sin(th),Math.cos(th)]);
  const Rs=add(Ls,mul(lat,.384)),mid=lerp(Ls,Rs,.5);
  const N=add(mid,[.05,0,0]).addScaledVector(fwd,.012),P=V([0,.17,0]),W=V([.2,.18+.03*Math.cos(th),-.03*u]);
  const fLo=[0,0,1],j=joints(P,W,N,fLo,fwd),J={pelvis:P,waist:W,neck:N,fwdLo:fLo,fwdUp:fwd,arm:{},leg:{},armFwd:{}};
  for(const side of['L','R']){
    const hip=j.hip[side],knee=add(hip,[-.02,0,.44]),ankle=add(knee,[-.43,0,.02]);
    const f=footOf(ankle,[.05,0,1],[1,0,0]);
    J.leg[side]={hip,knee,ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[1,0,0],lat:side==='L'?[0,-1,0]:[0,1,0]};
  }
  const lw=add(Ls,[.06,-.035,.57]);
  J.arm.L={sh:j.sh.L,el:lerp(j.sh.L,lw,.52),wr:lw,hand:[.1,0,1],palm:[0,-1,0],lat:j.latUp.L};J.armFwd.L=[1,0,0];
  const d=V([.05,Math.sin(phi),Math.cos(phi)]).normalize(),sh=j.sh.R;
  J.arm.R={sh,el:add(sh,mul(d,.3)),wr:add(sh,mul(d,.575)),hand:d,palm:[1,0,0],lat:j.latUp.R};J.armFwd.R=[1,0,0];
  const hr=th*.65;J.headUp=[1,0,0];J.headFwd=[0,Math.sin(hr),Math.cos(hr)];
  J.headC=V([N.x+.19,.215,N.z*.55]);
  return J;
}
// Kapı eşiğinde göğüs esnetme (sağ kol)
export const DOOR_E=V([-.5,1.42,-.02]);
export function doorway(u){
  const d=.19*u,a=.24*u;
  const P=[0,.955,d],W=add(P,[0,.2,.01*u]),N=add(W,[0,.37,.02*u]);
  const fLo=[Math.sin(a*.5),0,Math.cos(a*.5)],fUp=[Math.sin(a),0,Math.cos(a)];
  const j=joints(P,W,N,fLo,fUp),J={pelvis:P,waist:W,neck:N,fwdLo:fLo,fwdUp:fUp,arm:{},leg:{},armFwd:{}};
  const ank={L:V([.12,.075,.22]),R:V([-.12,.075,-.17])};
  for(const side of['L','R']){
    const hip=j.hip[side],ankle=ank[side],f=footOf(ankle,[side==='L'?.15:-.15,-.3,1],[0,1,0]);
    J.leg[side]={hip,knee:ik(hip,ankle,.45,.44,[0,0,1]),ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[0,0,1],lat:j.latLo[side]};
  }
  const shR=j.sh.R,wrR=add(DOOR_E,[0,.27,0]);
  J.arm.R={sh:shR,el:DOOR_E.clone(),wr:wrR,hand:[0,1,0],palm:[0,0,1],lat:j.latUp.R};J.armFwd.R=[0,1,0];
  const shL=j.sh.L,elL=add(shL,[.03,-.3,.02]);
  J.arm.L={sh:shL,el:elL,wr:add(elL,[.01,-.265,.05]),hand:[0,-1,.15],palm:[-1,0,0],lat:j.latUp.L};J.armFwd.L=[0,0,1];
  J.headUp=[0,1,0];J.headFwd=[Math.sin(a*1.1),0,Math.cos(a*1.1)];J.headC=add(N,[0,.175,.02]);
  return J;
}


/* ---- Ev günleri (c013-c015, c017, c019) ---- */
const ayakta=()=>{const P=V([0,.955,0]),W=add(P,[0,.2,.004]),N=add(W,[0,.37,-.006]);return {P,W,N,F:[0,0,1]};};
function standLegs(J,j,ank){
  for(const side of['L','R']){
    const hip=j.hip[side],ankle=V(ank[side]),f=footOf(ankle,[side==='L'?.12:-.12,-.3,1],[0,1,0]);
    J.leg[side]={hip,knee:ik(hip,ankle,.45,.44,[0,0,1]),ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[0,0,1],lat:j.latLo[side]};
  }
}
function hangArm(J,j,side,down,fwd){
  const s=side==='L'?1:-1,sh=j.sh[side],el=add(sh,mul(down,.3)).add(V([s*.025,0,0]));
  const wr=add(el,mul(down,.27));
  J.arm[side]={sh,el,wr,hand:V(down),palm:[-s,0,0],lat:j.latUp[side]};J.armFwd[side]=fwd||[0,0,1];
}
// Yüzüstü Y-T-W: faz 0 → Y, .5 → T, 1 → W (gidiş-dönüşte W'den Y'ye geri)
export function proneYTW(u){
  const P=[0,.115,0],W=[.2,.12,0],N=[.57,.125,0],F=[0,-1,0];
  const j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  for(const side of['L','R']){
    const z=side==='L'?-1:1,hip=j.hip[side],knee=V([hip.x-.45,.075,z*.1]),ankle=V([knee.x-.43,.065,z*.11]);
    J.leg[side]={hip,knee,ankle,toe:add(ankle,[-.15,-.04,0]),footUp:[0,-1,0],kneeFwd:[0,-1,0],lat:j.latLo[side]};
    const t=Math.min(1,u*2),w=Math.max(0,u*2-1);
    const th=(u<.5?mix(38,90,t):mix(90,128,w))*deg, ph=(u<.5?th/deg:mix(90,40,w))*deg;
    const sh=j.sh[side],ud=V([Math.cos(th),.2,z*Math.sin(th)]).normalize(),el=add(sh,mul(ud,.3));
    const fd=V([Math.cos(ph),.12,z*Math.sin(ph)]).normalize(),wr=add(el,mul(fd,.27));
    J.arm[side]={sh,el,wr,hand:fd,palm:[0,-1,0],lat:j.latUp[side]};J.armFwd[side]=[1,.4,0];
  }
  J.headUp=[1,0,0];J.headFwd=[0,-1,0];J.headC=V([.76,.135,0]);
  return J;
}
// Duvara izometrik yan kaldırış (sol kol, duvar solda): gevşek → itiş
export const WALL_X=.335;
export function wallLateral(u){
  const {P,W,N,F}=ayakta(),j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  standLegs(J,j,{L:[.12,.075,.02],R:[-.12,.075,.02]});
  const a=mix(4,15,u)*deg,sh=j.sh.L,el=add(sh,[.3*Math.sin(a),-.3*Math.cos(a),.0]);
  const fd=V([Math.sin(a)*.6,-Math.cos(25*deg),Math.sin(25*deg)]).normalize();
  J.arm.L={sh,el,wr:add(el,mul(fd,.27)),hand:fd,palm:[-1,0,0],lat:j.latUp.L};J.armFwd.L=[0,0,1];
  hangArm(J,j,'R',V([-.04,-1,.02]).normalize());
  J.headUp=[0,1,0];J.headFwd=[0,0,1];J.headC=add(N,[0,.175,.025]);
  return J;
}
// Kapı kasası biceps curl (sol el kasada, avuç yukarı): geriye yaslanma → çekiş
export function doorCurl(u){
  const A=V([0,.075,0]),govde=b=>{
    const ax=V([0,Math.cos(b),-Math.sin(b)]),F=[0,Math.sin(b),Math.cos(b)];
    const P=add(A,mul(ax,.88)),W=add(P,mul(ax,.2)),N=add(W,mul(ax,.37));
    return {ax,F,P,W,N,j:joints(P,W,N,F,F)};
  };
  /* El kasayı gövdenin ortasında tutar; ayaklar kasanın iki yanında. */
  const b0=26*deg,g0=govde(b0),sh0=g0.j.sh.L,H=V([.02,sh0.y-.035,sh0.z+.54]);
  const g=govde(mix(26,14,u)*deg),J={pelvis:g.P,waist:g.W,neck:g.N,fwdLo:g.F,fwdUp:g.F,arm:{},leg:{},armFwd:{}};
  standLegs(J,g.j,{L:[.1,.075,0],R:[-.1,.075,0]});
  const sh=g.j.sh.L,el=ik(sh,H,.3,.27,[0,-1,-.2]);
  J.arm.L={sh,el,wr:H,hand:[0,.25,1],palm:[0,1,0],lat:g.j.latUp.L};J.armFwd.L=[0,1,0];
  hangArm(J,g.j,'R',mul(g.ax,-1));
  const hu=lerp(g.ax,[0,1,0],.45).normalize(),hf=V(g.F).addScaledVector(hu,-V(g.F).dot(hu)).normalize();
  J.headUp=hu;J.headFwd=hf;J.headC=add(g.N,mul(hu,.175)).addScaledVector(hf,.025);
  J.grip=H;
  return J;
}
// Tek bacak Romen deadlift (sağ bacak destek, sol bacak geriye)
export function singleLegRDL(u){
  const a=mix(4,78,u)*deg,d=V([0,Math.cos(a),Math.sin(a)]),F=[0,-Math.sin(a),Math.cos(a)];
  const P=V([0,mix(.95,.9,u),-mix(0,.13,u)]),W=add(P,mul(d,.2)),N=add(W,mul(d,.37));
  const j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  {const hip=j.hip.R,ankle=V([-.1,.075,.02]),f=footOf(ankle,[-.08,-.3,1],[0,1,0]);
   J.leg.R={hip,knee:ik(hip,ankle,.45,.44,[0,0,1]),ankle,toe:f.toe,footUp:f.footUp,kneeFwd:[0,0,1],lat:j.latLo.R};}
  {const b=mix(8,82,u)*deg,dir=V([0,-Math.cos(b),-Math.sin(b)]),front=V([0,-Math.sin(b),Math.cos(b)]);
   const hip=j.hip.L,knee=add(hip,mul(dir,.45)),ankle=add(knee,mul(dir,.44)).addScaledVector(front,.03);
   J.leg.L={hip,knee,ankle,toe:add(ankle,mul(front.clone().addScaledVector(dir,.4).normalize(),.16)),footUp:mul(dir,-1),kneeFwd:front,lat:j.latLo.L};}
  for(const side of['L','R'])hangArm(J,j,side,V([0,-1,.08]).normalize());
  J.headUp=d;J.headFwd=F;J.headC=add(N,mul(d,.175)).addScaledVector(V(F),.025);
  return J;
}
// Havluyla izometrik çekiç curl: sağ ayak havluda, dirsekler 90°
export function towelCurl(u){
  const {P,W,N,F}=ayakta(),j=joints(P,W,N,F,F),J={pelvis:P,waist:W,neck:N,fwdLo:F,fwdUp:F,arm:{},leg:{},armFwd:{}};
  standLegs(J,j,{L:[.12,.075,-.1],R:[-.1,.075,.14]});
  const a=mix(-14,2,u)*deg;
  for(const side of['L','R']){
    const s=side==='L'?1:-1,sh=j.sh[side],el=add(sh,[s*.02,-.3,.035]);
    const fd=V([-s*.12,Math.sin(a),Math.cos(a)]).normalize(),wr=add(el,mul(fd,.27));
    J.arm[side]={sh,el,wr,hand:fd,palm:[-s,0,0],lat:j.latUp[side]};J.armFwd[side]=[0,0,1];
  }
  J.headUp=[0,1,0];J.headFwd=[0,-.12,1];J.headC=add(N,[0,.175,.025]);
  J.towel={L:add(J.arm.L.wr,mul(J.arm.L.hand,.05)),R:add(J.arm.R.wr,mul(J.arm.R.hand,.05)),foot:V([-.1,.012,.2])};
  return J;
}

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


import { analyzeBox } from './continuity.ts';
export const examples = {
 sine:{formula:'y = sin x',domain:'ℝ',center:0,delta:.4,eps:.5,view:[-4,4,-1.8,1.8]},
 square:{formula:'y = x²',domain:'ℝ',center:1,delta:.1,eps:.5,view:[-.5,3.5,-1,10]},
 root:{formula:'y = √x',domain:'[0, ∞)',center:0,delta:.25,eps:.5,view:[-.4,3,-.7,2.3]},
 inverse:{formula:'y = 1/x',domain:'(0, ∞)',center:1,delta:.1,eps:.5,view:[-.1,2,-1,8]},
 oscillation:{formula:'y = sin(1/x)',domain:'(0, 1]',center:.6,delta:.04,eps:.5,view:[0,1,-1.7,1.7]},
 damped:{formula:'y = x sin(1/x)',domain:'[0, 1]',center:.6,delta:.01,eps:.5,view:[-.05,1.05,-1.5,1.5]},
 chirp:{formula:'y = sin(x²)',domain:'[0, ∞)',center:1,delta:.1,eps:.5,view:[0,8,-1.7,1.7]},
} as const;
export type Kind = keyof typeof examples;
export function value(k:Kind,x:number):number {
 switch(k){case 'sine':return Math.sin(x);case 'square':return x*x;case 'root':return Math.sqrt(x);case 'inverse':return 1/x;case 'oscillation':return Math.sin(1/x);case 'damped':return x===0?0:x*Math.sin(1/x);case 'chirp':return Math.sin(x*x);}
}
export function domain(k:Kind,x:number){return k==='sine'||k==='square'||(x>=0 && (k!=='inverse'&&k!=='oscillation'||x>0) && (k!=='oscillation'&&k!=='damped'||x<=1));}
export function inspect(k:Kind,a:number,d:number,e:number):{safe:boolean|null; witness:number|null}{
 if(k==='sine'||k==='square'){const r=analyzeBox(k,a,d,e);return {safe:r.safe,witness:r.witness?a+r.witness.offset:null};}
 if(k==='damped' && 2*Math.sqrt(2*d)+2*d<e)return {safe:true,witness:null};
 const lo=Math.max(a-d,k==='root'||k==='damped'||k==='chirp'?0:Number.MIN_VALUE),hi=Math.min(a+d,k==='oscillation'||k==='damped'?1:Infinity);
 const points=[lo,hi];
 if(k==='oscillation'||k==='chirp'){
  const p=k==='oscillation'?1/hi:lo*lo, q=k==='oscillation'?1/lo:hi*hi;
  const first=Math.ceil((p-Math.PI/2)/Math.PI);
  for(let n=first;n<=Math.min(first+3,Math.floor((q-Math.PI/2)/Math.PI));n++){const t=Math.PI/2+n*Math.PI;points.push(k==='oscillation'?1/t:Math.sqrt(t));}
 }
 // Samples may exhibit a failure, but never certify safety for the damped function.
 if(k==='damped')for(let i=1;i<200;i++)points.push(lo+(hi-lo)*i/200);
 const b=value(k,a);
 for(const x of points){if(!domain(k,x))continue;const diff=Math.abs(value(k,x)-b);
  if(diff>e || diff===e&&Math.abs(x-a)<d){
   if(Math.abs(x-a)<d)return {safe:false,witness:x};
   for(const t of [.999999,.9999,.99,.9]){const y=a+(x-a)*t;if(Math.abs(value(k,y)-b)>=e)return {safe:false,witness:y};}
  }
 }
 return {safe:k==='damped'?null:true,witness:null};
}

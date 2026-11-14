import { examples, value, domain, inspect } from './examples';
import type { Kind } from './examples';
const NS='http://www.w3.org/2000/svg';
const fmt=(x:number)=>Number(x.toPrecision(4)).toString();
class Box extends HTMLElement {
 k:Kind='sine';a=0;d=.4;e=.5;v:number[]=[];observer?:ResizeObserver;abort?:AbortController;
 connectedCallback(){this.k=this.dataset.kind as Kind;this.reset();this.abort=new AbortController();const opt={signal:this.abort.signal};
 this.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b=>b.addEventListener('click',()=>this.move(this.a+Number(b.dataset.move)*(this.v[1]-this.v[0])/25),opt));
 this.querySelectorAll<HTMLButtonElement>('[data-width]').forEach(b=>b.addEventListener('click',()=>{this.d=Math.max(1e-6,Math.min(.8,this.d*Number(b.dataset.width)));this.draw();},opt));
 this.querySelector('[data-reset]')!.addEventListener('click',()=>{this.reset();this.draw();},opt);
 this.querySelector<HTMLInputElement>('[data-center]')!.addEventListener('input',ev=>{const input=ev.target as HTMLInputElement;if(Number.isFinite(input.valueAsNumber))this.move(input.valueAsNumber);},opt);
 this.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.addEventListener('click',()=>{const span=Math.max(this.d*8,.05);if(b.dataset.camera==='fit'){const y=value(this.k,this.a);this.v=[this.a-span/2,this.a+span/2,y-this.e*2,y+this.e*2];}else{const w=this.v[1]-this.v[0];this.v[0]+=w*.7;this.v[1]+=w*.7;if(this.k==='square'){this.v[2]=Math.min(this.v[0]**2,this.v[1]**2)-1;this.v[3]=this.v[1]**2+1;}}this.draw();},opt));
 const dialog=this.querySelector<HTMLDialogElement>('dialog')!,panel=this.querySelector<HTMLElement>('.explorer-panel')!,home=this.querySelector('[data-inline-home]')!,expand=this.querySelector<HTMLButtonElement>('[data-expand]')!,close=this.querySelector<HTMLButtonElement>('[data-close]')!;
 let oldOverflow='';
 expand.addEventListener('click',()=>{home.setAttribute('style',`height:${panel.getBoundingClientRect().height}px`);dialog.appendChild(panel);expand.hidden=true;close.hidden=false;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();this.draw();close.focus();},opt);
 close.addEventListener('click',()=>dialog.close(),opt);
 dialog.addEventListener('close',()=>{home.parentNode!.insertBefore(panel,home.nextSibling);home.removeAttribute('style');expand.hidden=false;close.hidden=true;document.body.style.overflow=oldOverflow;this.draw();expand.focus({preventScroll:true});},opt);
 const svg=this.querySelector<SVGSVGElement>('svg')!;let dragging=false;
 svg.addEventListener('pointerdown',ev=>{if(!(ev.target as Element).hasAttribute('data-drag'))return;dragging=true;svg.setPointerCapture(ev.pointerId);},opt);
 svg.addEventListener('pointermove',ev=>{if(!dragging)return;const r=svg.getBoundingClientRect();this.move(this.v[0]+((ev.clientX-r.left)/r.width*svg.viewBox.baseVal.width-48)/(svg.viewBox.baseVal.width-72)*(this.v[1]-this.v[0]));},opt);
 svg.addEventListener('pointerup',()=>dragging=false,opt);svg.addEventListener('pointercancel',()=>dragging=false,opt);
 this.observer=new ResizeObserver(()=>requestAnimationFrame(()=>this.draw()));this.observer.observe(this.querySelector('.plot-host')!);this.draw();}
 disconnectedCallback(){this.abort?.abort();this.observer?.disconnect();}
 reset(){const s=examples[this.k];this.a=s.center;this.d=s.delta;this.e=s.eps;this.v=[...s.view];}
 move(x:number){x=Math.max(-1e6,Math.min(1e6,x));if(this.k!=='sine'&&this.k!=='square')x=Math.max(this.k==='inverse'||this.k==='oscillation'?1e-5:0,x);if(this.k==='oscillation'||this.k==='damped')x=Math.min(1,x);this.a=x;this.draw();}
 draw(){const svg=this.querySelector<SVGSVGElement>('svg')!,w=this.querySelector('.plot-host')!.clientWidth;if(!w)return;const h=this.querySelector('dialog')!.open?Math.max(240,Math.min(440,window.innerHeight-300)):250,L=48,R=w-24,T=25,B=h-42;const [xmin,xmax,ymin,ymax]=this.v;const X=(x:number)=>L+(x-xmin)/(xmax-xmin)*(R-L),Y=(y:number)=>B-(y-ymin)/(ymax-ymin)*(B-T);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.replaceChildren();
 const add=(tag:string,attrs:Record<string,string|number>,text?:string)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;svg.appendChild(n);return n;};
 const defs=add('defs',{}),clip=document.createElementNS(NS,'clipPath');clip.id='clip-'+this.k;const rect=document.createElementNS(NS,'rect');for(const[k,v]of Object.entries({x:L,y:T,width:R-L,height:B-T}))rect.setAttribute(k,String(v));clip.appendChild(rect);defs.appendChild(clip);
 add('rect',{x:L,y:T,width:R-L,height:B-T,fill:'none',class:'plot-outline'});
 for(let i=0;i<=4;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;add('text',{x:X(x),y:B+20,'text-anchor':'middle',class:'plot-tick'},fmt(x));add('text',{x:L-6,y:Y(y)+4,'text-anchor':'end',class:'plot-tick'},fmt(y));}
 if(ymin<=0&&ymax>=0)add('line',{x1:L,x2:R,y1:Y(0),y2:Y(0),class:'plot-grid'});if(xmin<=0&&xmax>=0)add('line',{x1:X(0),x2:X(0),y1:T,y2:B,class:'plot-grid'});
 let path='',started=false;for(let i=0;i<=1600;i++){const x=xmin+(xmax-xmin)*i/1600;if(!domain(this.k,x)){started=false;continue;}const y=value(this.k,x);path+=(started?'L':'M')+X(x)+','+Y(Math.max(ymin-100,Math.min(ymax+100,y)));started=true;}
 add('path',{d:path,class:'function-path','clip-path':`url(#clip-${this.k})`});
 if(this.k==='damped')for(const sign of[-1,1])add('path',{d:`M${X(Math.max(0,xmin))},${Y(sign*Math.max(0,xmin))}L${X(Math.min(1,xmax))},${Y(sign*Math.min(1,xmax))}`,class:'plot-center-guide','clip-path':`url(#clip-${this.k})`});
 const y=value(this.k,this.a);for(const sign of[-1,1]){add('line',{x1:X(this.a+sign*this.d),x2:X(this.a+sign*this.d),y1:Y(y-this.e),y2:Y(y+this.e),class:'box-side','clip-path':`url(#clip-${this.k})`});add('line',{x1:X(this.a-this.d),x2:X(this.a+this.d),y1:Y(y+sign*this.e),y2:Y(y+sign*this.e),class:'box-limit','clip-path':`url(#clip-${this.k})`});}
 if(X(this.a)>=L&&X(this.a)<=R&&Y(y)>=T&&Y(y)<=B){add('circle',{cx:X(this.a),cy:Y(y),r:5,class:'center-point'});add('circle',{cx:X(this.a),cy:Y(y),r:22,fill:'transparent','data-drag':'',class:'drag-target'});add('text',{x:X(this.a+this.d)+6,y:Y(y)+4,class:'dimension-text'},'ε');add('text',{x:X(this.a),y:Y(y-this.e)+19,class:'dimension-text'},'δ');}
 add('text',{x:R,y:h-5,class:'axis-label','text-anchor':'end'},'x');add('text',{x:L,y:15,class:'axis-label'},'y');
 const result=inspect(this.k,this.a,this.d,this.e);
 this.dataset.state=result.safe===true?'safe':result.safe===false?'failed':'unknown';
 this.querySelector('[data-status-icon]')!.textContent=result.safe===true?'✓':result.safe===false?'!':'?';
 const message=result.safe===true?'当前位置满足要求':result.safe===false?'此处失效：曲线碰到或越过红线':'当前尺度尚不能确认满足要求';
 const status=this.querySelector('[data-status]')!;if(status.textContent!==message)status.textContent=message;
 if(result.witness!==null){const wx=X(result.witness),wy=Y(value(this.k,result.witness));
 add('circle',{cx:wx,cy:wy,r:10,class:'witness-halo','clip-path':`url(#clip-${this.k})`});
 add('circle',{cx:wx,cy:wy,r:5,class:'witness-point','clip-path':`url(#clip-${this.k})`});
 add('line',{x1:wx,x2:wx,y1:Y(y),y2:wy,class:'witness-guide','clip-path':`url(#clip-${this.k})`});
 }
 this.querySelector('[data-detail]')!.textContent=(X(this.a)<L||X(this.a)>R||Y(y)<T||Y(y)>B?'中心已离开视野。请主动点击“查看中心附近”。':'收窄只改变绿边，坐标与曲线保持不动。')+(this.k==='oscillation'||this.k==='damped'?' 极密振荡无法逐条显示；数学判断不依赖曲线采样。':'');
 this.querySelector('[data-delta]')!.textContent=fmt(this.d);this.querySelector('[data-view-scale]')!.textContent='x₀ = '+fmt(this.a);const input=this.querySelector<HTMLInputElement>('[data-center]')!;if(document.activeElement!==input)input.value=fmt(this.a);
 }
}
if(!customElements.get('continuity-box'))customElements.define('continuity-box',Box);

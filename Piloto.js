const $=i=>document.getElementById(i),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const craters=[[-30,-25,16,3.5],[35,-40,22,5],[-55,20,12,2.5],[20,35,18,4],[60,0,14,3]];
function H(x,z){let h=0;for(let i=0;i<4;i++){const f=.018*(1<<i),a=5/(1<<i);h+=a*Math.sin(x*f+i*1.7+Math.cos(z*f*1.3))*Math.cos(z*f*1.1-i*2.3)}
for(const[c,d,r,k]of craters){const q=Math.hypot(x-c,z-d)/r;if(q<1)h-=k*(1-q*q);h+=k*.35*Math.exp(-Math.pow((q-1)*4,2))}return h}
const HAB={x:14,z:-70};
// ---- escena
const ren=new THREE.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio,2));$('v').appendChild(ren.domElement);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(75,1,.1,400);cam.rotation.order='YXZ';
scene.fog=new THREE.FogExp2(0xc98a62,.01);scene.background=new THREE.Color(0xc98a62);
const sun=new THREE.DirectionalLight(0xffc89a,1.1);sun.position.set(-40,35,-30);scene.add(sun);
const hemi=new THREE.HemisphereLight(0xe8a878,0x4a2a1c,.7);scene.add(hemi);
const g=new THREE.PlaneGeometry(260,260,170,170);g.rotateX(-Math.PI/2);
{const P=g.attributes.position,col=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),y=H(x,z);P.setY(i,y);const n=.5+.5*Math.sin(x*.9)*Math.sin(z*1.1),t=cl((y+4)/12,0,1);col.set([.55+.25*t+.08*n,.28+.12*t+.05*n,.18+.06*t],i*3)}
g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals()}
scene.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true})));
const lm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,extensions:{derivatives:true},
uniforms:{uT:{value:0},uO:{value:new THREE.Vector3()},uS:{value:0},uZ:{value:1}},
vertexShader:'varying vec3 vP;void main(){vP=(modelMatrix*vec4(position,1.)).xyz+vec3(0.,.07,0.);gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}',
fragmentShader:'varying vec3 vP;uniform float uT,uS,uZ;uniform vec3 uO;void main(){float d=length(vP.xz-uO.xz);vec2 q=vP.xz/(5./uZ);vec2 w=abs(fract(q-.5)-.5)/fwidth(q);float ln=1.-min(min(w.x,w.y),1.);float hy=vP.y*.5*uZ;float ct=1.-min(abs(fract(hy)-.5)/max(fwidth(hy),1e-4),1.);float m=mod(uT*22.-d,48.);float ring=exp(-m*.12);float a=(ln*.55+ct*.5)*(.18+ring*1.2)*smoothstep(130.,20.,d)*uS;vec3 c=mix(vec3(.1,.7,1.),vec3(.5,1.,.7),clamp((vP.y+3.)/10.,0.,1.));gl_FragColor=vec4(c*a*1.6,a);}'});
const lidar=new THREE.Mesh(g,lm);lidar.frustumCulled=false;lidar.renderOrder=2;scene.add(lidar);
// rocas
const rg=new THREE.IcosahedronGeometry(1,1);{const p=rg.attributes.position;for(let i=0;i<p.count;i++){const s=.75+rnd()*.5;p.setXYZ(i,p.getX(i)*s,p.getY(i)*s,p.getZ(i)*s)}rg.computeVertexNormals()}
const rm=[0x5a4038,0x7a3524,0x4f4a35,0x8a7a58].map(c=>new THREE.MeshLambertMaterial({color:c,flatShading:true})),rocks=[];
for(let i=0;i<110;i++){const x=(rnd()-.5)*200,z=(rnd()-.5)*200;if(Math.hypot(x-HAB.x,z-HAB.z)<12)continue;const r=.3+rnd()*rnd()*3,t=Math.floor(rnd()*4),m=new THREE.Mesh(rg,rm[t]);m.scale.set(r*(1+rnd()),r*.7,r*(1+rnd()));m.position.set(x,H(x,z)+r*.15,z);m.rotation.y=rnd()*6;scene.add(m);rocks.push({x,z,t})}
// hábitat + rover + baliza
const hab=new THREE.Group(),wm=new THREE.MeshLambertMaterial({color:0xdedad2}),dk=new THREE.MeshLambertMaterial({color:0x333333});
const at=(m,x,y,z)=>{m.position.set(x,y,z);return m};
hab.add(at(new THREE.Mesh(new THREE.CylinderGeometry(5,5,3.2,24),wm),0,1.6,0));
hab.add(at(new THREE.Mesh(new THREE.SphereGeometry(5,24,12,0,6.3,0,1.57),wm),0,3.2,0));
const rv=new THREE.Group();rv.add(at(new THREE.Mesh(new THREE.BoxGeometry(4,1.2,2.6),wm),0,1.3,0));
for(const sx of[-1.4,0,1.4])for(const sz of[-1.5,1.5]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.4,12),dk);w.rotation.x=1.57;w.position.set(sx,.55,sz);rv.add(w)}
rv.position.set(9,0,3);hab.add(rv);hab.position.set(HAB.x,H(HAB.x,HAB.z),HAB.z);scene.add(hab);
const bm=new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,fog:false,depthWrite:false});
const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,60,10,1,true),bm);beacon.position.set(HAB.x,hab.position.y+30,HAB.z);scene.add(beacon);
// ruta AR
const cm=new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,fog:false,side:THREE.DoubleSide}),chev=[];
for(let i=0;i<40;i++){const m=new THREE.Mesh(new THREE.CircleGeometry(.9,3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffc23a,transparent:true,fog:false,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));m.scale.set(3.4,1,3);m.visible=false;m.renderOrder=3;scene.add(m);chev.push(m)}
// polvo
const N=5000,dp=new Float32Array(N*3);for(let i=0;i<N*3;i++)dp[i]=(Math.random()-.5)*100;
const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dm=new THREE.PointsMaterial({color:0xe0a880,size:.35,transparent:true,opacity:.3,depthWrite:false}),dust=new THREE.Points(dg,dm);dust.frustumCulled=false;scene.add(dust);
// ---- estado
let mode=0,storm=.45,prevS=.45,zoom=1,pan={x:0,z:0},yaw=0.12,pitch=-.05,fov=75,pos={x:0,z:0},eds=-1,dirt=0,o2=71,bat=78,aux=41,lastHud=0,keys={};
const sky0=new THREE.Color(0xc98a62),sky1=new THREE.Color(0x7a4630),tmp=new THREE.Color();
const stg=$('stage');function size(){const w=stg.clientWidth||800,h=stg.clientHeight||500;ren.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}new ResizeObserver(size).observe(stg);size();let active=false,onscr=true;new IntersectionObserver(e=>{onscr=e[0].isIntersecting}).observe(stg);stg.addEventListener('pointerdown',()=>{active=true;stg.classList.add('act')});document.addEventListener('pointerdown',e=>{if(!stg.contains(e.target)){active=false;stg.classList.remove('act')}});$('fs').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():stg.requestFullscreen()}catch(_){}};
// entrada
let drag=null;const cv=ren.domElement;
cv.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.005*fov/75;pitch=cl(pitch-(e.clientY-drag[1])*.005*fov/75,-1.3,1.3);drag=[e.clientX,e.clientY]});
cv.addEventListener('pointerup',()=>drag=null);
cv.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();fov=cl(fov+e.deltaY*.04,25,90)},{passive:false});
function setMode(m){if(mode===m)m=0;if(m===2&&mode!==2){prevS=storm;storm=Math.max(storm,.92)}else if(mode===2&&m!==2)storm=prevS;mode=m;$('st').value=Math.round(storm*100);
$('stage').classList.remove('m0','m1','m2');$('stage').classList.add('m'+m);$('bR').classList.toggle('on',m===1);$('bE').classList.toggle('on',m===2)}
function pulse(){if(eds>=0)return;eds=0;$('sweep').classList.remove('go');void $('sweep').offsetWidth;$('sweep').classList.add('go')}
const zm=k=>{zoom=cl(zoom*k,.5,6)},step=(x,z)=>{if(!x&&!z){pan={x:0,z:0};return}pan.x+=x*8/zoom;pan.z+=z*8/zoom};
$('bR').onclick=()=>setMode(1);$('bE').onclick=()=>setMode(2);$('bD').onclick=pulse;$('bP').onclick=()=>zm(1.25);$('bM').onclick=()=>zm(.8);
$('st').oninput=e=>{storm=e.target.value/100;if(mode===2&&storm<.85){storm=.85;e.target.value=85}};
let rep;document.querySelectorAll('.dpad b').forEach(b=>{const[x,z]=b.dataset.d.split(',').map(Number);
b.addEventListener('pointerdown',()=>{step(x,z);clearInterval(rep);rep=setInterval(()=>step(x,z),90)});
['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>clearInterval(rep)))});
addEventListener('keydown',e=>{if(!active)return;const k=e.key.toLowerCase();keys[k]=1;
if(k==='1')setMode(1);else if(k==='2')setMode(2);else if(k==='e')pulse();else if(k==='+'||k==='=')zm(1.25);else if(k==='-')zm(.8);
else if(k.startsWith('arrow')){e.preventDefault();step(k==='arrowleft'?-1:k==='arrowright'?1:0,k==='arrowup'?-1:k==='arrowdown'?1:0)}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
// minimapa
function drawMap(c,w,h){const n=36,cx=pos.x+pan.x,cz=pos.z+pan.z,span=90/zoom,cs=w/n;
for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=cx+(i/n-.5)*span,z=cz+(j/n-.5)*span,t=cl((H(x,z)+6)/14,0,1),b=(Math.abs((H(x,z)*.6)%1)<.08)?.4:0;
c.fillStyle=`rgb(${Math.round(10+b*200)},${Math.round(40+t*170+b*150)},${Math.round(90+t*120)})`;c.fillRect(i*cs,j*cs,cs+.6,cs+.6)}
const mk=(x,z,col,s)=>{let px=(x-cx)/span*w+w/2,pz=(z-cz)/span*h+h/2;px=cl(px,4,w-4);pz=cl(pz,4,h-4);c.fillStyle=col;c.fillRect(px-s,pz-s,s*2,s*2)};
mk(HAB.x,HAB.z,'#ffb000',4);mk(pos.x,pos.z,'#fff',3);c.strokeStyle='rgba(39,211,255,.7)';c.strokeRect(.5,.5,w-1,h-1)}
const mc=$('mm').getContext('2d'),ac=$('ac').getContext('2d');
function nearRock(){let b=null,bd=30;for(const r of rocks){const d=Math.hypot(r.x-pos.x,r.z-pos.z);if(d<bd){bd=d;b=r}}return b&&{t:b.t,d:bd}}
const MIN=[['BASALTO TOLEÍTICO',[64,10,16,4,6]],['ÓXIDO FÉRRICO / HEMATITA',[30,44,8,10,8]],['OLIVINO-RICA',[22,6,52,12,8]],['SULFATO + PERCLORATO',[18,12,6,52,12]]],MN=['Basalto','Hematita','Olivino','Sulfatos','Percloratos'];
function hud(t){const dist=Math.hypot(HAB.x-pos.x,HAB.z-pos.z),vis=Math.max(0,Math.round(100*(1-storm*1.08))),hd=((-yaw*180/Math.PI)%360+360)%360;
const lbl=['NOMINAL','MODO INVESTIGACIÓN · LiDAR+mmWave','MODO EMERGENCIA · REFUGIO'][mode];
$('badge').innerHTML=`<span style="color:${mode===2?'var(--am)':'var(--cy)'}">${lbl}</span>`;
$('vis').innerHTML=`VISIBILIDAD ÓPTICA ${vis}%<span class="he"> · LiDAR+mmWave ${mode===1?'100%':'STBY'} · VIENTO ${Math.round(8+storm*95)} km/h</span>`;
$('edsT').textContent='EDS: '+(eds>=0?'PULSO ACTIVO':dirt>.35?'POLVO ESTÁTICO — USAR PULSO':'LISTO');
const low=aux<45;$('bat').innerHTML=mode===2?`<b style="color:var(--am)">BATERÍA AUXILIAR FAIL-SAFE ACTIVA</b><div class="bar"><i style="width:${aux}%;background:var(--am)"></i></div>AUX ${aux.toFixed(0)}%`:`BATERÍA COMPARTIDA TRAJE/ROVER<div class="bar"><i style="width:${bat}%"></i></div>${bat.toFixed(0)}% · LINK: ROVER-RELAY OFFLOAD`;
if(mode===1){const r=nearRock(),e=H(pos.x,pos.z);$('elev').innerHTML=`ELEV ${(e*10+1250).toFixed(0)} m (ref. MOLA)<br>PEND ${(Math.atan2(H(pos.x+1,pos.z)-e,1)*57.3).toFixed(1)}°<br>`;
$('min').innerHTML=r?`<div style="margin-top:6px;color:var(--gr)">ROCA A ${r.d.toFixed(0)} m: ${MIN[r.t][0]}</div>`+MIN[r.t][1].map((v,i)=>`${MN[i]} ${v}%<div class="bar"><i style="width:${v}%"></i></div>`).join(''):'<div style="margin-top:6px">SIN ROCAS EN RANGO (30 m)</div>';
$('imu').innerHTML=`IMU+SLAM · SIN GPS<br>RUMBO ${hd.toFixed(0)}° PITCH ${(pitch*57.3).toFixed(0)}°<br>VEL ${(keys.w||keys.s||keys.a||keys.d?1.1:0).toFixed(1)} m/s<br>DERIVA ${(.02+.01*Math.sin(t)).toFixed(3)} m<br>CIERRES ${12+Math.floor(t/9)%40} · ZOOM ×${zoom.toFixed(1)}`;
drawMap(mc,120,120)}
if(mode===2)$('al').innerHTML=`<span class="${o2<45?'crit':''}">OXÍGENO ${o2.toFixed(0)}% ▼</span><br>PRESIÓN TRAJE ${(4.3-(1-aux/41)*.05).toFixed(2)} psi<br>DISTANCIA AL REFUGIO ${dist.toFixed(0)} m`;
drawMap(ac,110,110);ac.fillStyle='#02070a';ac.fillRect(112,0,150,110);ac.fillStyle=mode===2?'#ffb000':'#27d3ff';ac.font='10px monospace';
[`${['NOMINAL','LiDAR','EMERG'][mode]} ×${zoom.toFixed(1)}`,`VIS ${vis}%`,`HAB ${dist.toFixed(0)} m`,`PAN ${pan.x.toFixed(0)},${pan.z.toFixed(0)}`,`HDG ${hd.toFixed(0)}°`,mode===2?'AUX FAIL-SAFE':'BAT '+bat.toFixed(0)+'%'].forEach((s,i)=>ac.fillText(s,120,18+i*15));
$('sv').textContent=Math.round(storm*100)+'% · VIS '+vis+'%'}
// bucle
let last=performance.now();
function loop(now){requestAnimationFrame(loop);if(!onscr){last=now;return}const dt=Math.min((now-last)/1000,.05),t=now/1000;last=now;
const sp=(keys.w||keys.s||keys.a||keys.d)?5:0,fx=-Math.sin(yaw),fz=-Math.cos(yaw);
pos.x=cl(pos.x+((keys.w?1:0)-(keys.s?1:0))*fx*sp*dt+((keys.d?1:0)-(keys.a?1:0))*-fz*sp*dt,-110,110);pos.z=cl(pos.z+((keys.w?1:0)-(keys.s?1:0))*fz*sp*dt+((keys.d?1:0)-(keys.a?1:0))*fx*sp*dt,-110,110);
const tx=pos.x,tz=pos.z;cam.position.set(tx,H(tx,tz)+1.75,tz);cam.rotation.set(pitch,yaw,0);cam.fov=fov;cam.updateProjectionMatrix();
const s=storm;scene.fog.density=.002+s*s*.12;tmp.copy(sky0).lerp(sky1,s);scene.background.copy(tmp);scene.fog.color.copy(tmp);sun.intensity=1.1-s*.7;hemi.intensity=.7-s*.25;if(mode===2){sun.intensity*=.3;hemi.intensity*=.35;tmp.multiplyScalar(.5);scene.background.copy(tmp);scene.fog.color.copy(tmp)}
lm.uniforms.uT.value=t;lm.uniforms.uO.value.set(tx,0,tz);lm.uniforms.uZ.value=zoom;lm.uniforms.uS.value+=((mode===1?1:0)-lm.uniforms.uS.value)*Math.min(1,dt*4);
// polvo
const sf=3+s*42,wx=Math.cos(.6)*sf*dt,wz=Math.sin(.6)*sf*dt,cy=cam.position.y,Rr=50;
for(let i=0;i<N;i++){const k=i*3;dp[k]+=wx+Math.sin(t+dp[k+2]*.3)*.03;dp[k+2]+=wz;dp[k+1]+=Math.sin(t*.7+i)*.01;
if(dp[k]-tx>Rr)dp[k]-=2*Rr;else if(dp[k]-tx<-Rr)dp[k]+=2*Rr;if(dp[k+2]-tz>Rr)dp[k+2]-=2*Rr;else if(dp[k+2]-tz<-Rr)dp[k+2]+=2*Rr;if(dp[k+1]>cy+22)dp[k+1]=cy-2;if(dp[k+1]<cy-2)dp[k+1]=cy+22}
dg.attributes.position.needsUpdate=true;dg.setDrawRange(0,Math.floor(N*(.15+s*.85)));dm.opacity=.12+s*.5;dm.size=.3+s*.5;
// ruta AR
const dx=HAB.x-tx,dz=HAB.z-tz,dist=Math.hypot(dx,dz),n=Math.min(40,Math.floor(dist/4));
chev.forEach((m,i)=>{m.visible=mode===2&&i<n;if(!m.visible)return;const f=(i+1)/(n+1),x=tx+dx*f,z=tz+dz*f;m.position.set(x,H(x,z)+.35,z);m.rotation.y=-Math.atan2(dz,dx);m.material.opacity=.25+.75*Math.max(0,Math.sin(t*5-i*.6))});
bm.opacity=(mode===2?.55:.25)+.15*Math.sin(t*3);
// EDS
if(eds>=0){eds+=dt/1.4;dirt*=Math.max(0,1-dt*3);if(eds>=1)eds=-1}else dirt=Math.min(.85,dirt+dt*s*.025);$('dirt').style.opacity=dirt;
o2=Math.max(20,o2-dt*.05);bat=Math.max(5,bat-dt*.01);aux=Math.max(10,aux-dt*.015);
if(now-lastHud>250){lastHud=now;hud(t)}
ren.render(scene,cam)}
setMode(0);requestAnimationFrame(loop);
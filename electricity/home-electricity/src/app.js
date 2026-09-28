(function(){
 'use strict';
 const M=window.ElectricityModel, s=M.makeState();
 const $=id=>document.getElementById(id), $$=sel=>Array.from(document.querySelectorAll(sel));
 const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
 const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
 let playback=false,storyTimer=null,raf=0,phase=0,lastFrame=0,dialogFocus=null,snapshot=null;
 const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
 s.paused=motionPreference.matches;
 const TITLES={
  house:['家庭基础设施 / 一场可以亲手操作的电力展览','让看不见的电，变得看得见。','点亮一盏灯，打开一台电器。看电如何分配，又如何在异常时被切断。'],
  fault:['02 / 把异常放慢，看看保护如何发生','出问题的那一刻，谁来切断？','选一种故障，观察设备、线路和保护器的联动。别只把所有异常都叫作“短路”。'],
  lab:['03 / 用三个可以操作的展品，建立直觉','把电的语言，翻译成画面。','接通一个回路，拨动功率仪表，再拆开保护器：每个名词，都有可以看见的含义。'],
  plan:['04 / 从“买几个插排”，走向完整的家庭布局','先想清楚怎么用，再决定怎么布。','复用同一座家，观察设备的回路分组。房间、插座和回路，是三个不同层次。']
 };
 const INSIGHTS={
  house:['01','先记住这件事','插排增加的是可插的位置。所有插上的电器，仍然要共用上游插座与回路的容量。','看完整供电路径','supply'],
  fault:['02','别只看跳不跳闸','接触不良可能局部发热，却没有达到普通过流或剩余电流保护的动作条件。没有跳闸，不等于没有危险。','异常时怎么办','response'],
  lab:['03','用职责记住名字','电表累计电量，回路分配供电；不同保护器检测不同异常。名称相近，不代表可以互相替代。','打开名词图鉴','terms'],
  plan:['04','把需求交代清楚','准备设备、位置、功率及同时使用情况，再让专业人员校核容量、回路、线缆、保护与接地。插座越多，不代表可用容量越大。','看规划沟通清单','planning']
 };
 const MECHANISMS={
  mcb:{name:'小型断路器',tags:[true,true,false],body:'常见的“空开”主要用于过载与短路保护。热机构和电磁机构分别响应不同的过电流条件。',caveat:'普通 MCB 不具备剩余电流保护。这里即使模拟漏电，开关也不会因为“检测到不平衡”而动作。'},
  rccb:{name:'不带过电流保护的剩余电流断路器',tags:[false,false,true],body:'检测流经工作导体的电流是否出现不平衡。它本身不提供过载与短路保护，需要配合相应的过电流保护。',caveat:'本演示假设剩余电流已经满足动作条件。实际应按型号、系统和用途选择，并按厂家要求执行测试。'},
  rcbo:{name:'带过电流保护的剩余电流断路器',tags:[true,true,true],body:'把过载、短路与剩余电流保护组合在一个装置里。既能管过电流，也能检测异常的电流不平衡。',caveat:'本演示假设剩余电流已经满足动作条件。组合保护并不等于能防住所有触电，也不能替代合格接地和正确安装。'}
 };
 const TERMS=[
  ['电压','V','两点之间的电势差。交流电压随时间变化，日常所说的 220 V 通常指有效值。它不是“电流有多大”。'],
  ['电流','A','单位时间通过的电荷量。大小与供电条件、负载及整个回路有关，不是电源固定“塞给”每台电器一个数。'],
  ['功率','W / kW','电能转换的快慢。1 kW = 1000 W。电器额定输入功率不等于它每一刻的实际输入功率。'],
  ['电量','kWh / 度','一段时间消耗的电能。1 度 = 1 kWh。恒定功率时，电量 = 功率（kW）× 时间（h）。'],
  ['交流与直流','AC / DC','交流电流方向周期性变化；直流电流通常保持同一方向。家用电器可能在内部把交流转换为直流。'],
  ['火线','L','单相工作回路中的相线。它与零线、地之间可能存在危险电位差，不能触碰裸露导体。'],
  ['零线','N','中性导体，通常参与单相工作回流。零线不等于地线，也不能因为名称带“零”就当作无电或可触碰。'],
  ['保护地线','PE','连接需要保护接地的可导电外壳等部分。正常时不作为工作回流线；故障时与其他保护措施配合。'],
  ['回路','Circuit','由电源、导线、开关、负载等构成的电流通路。配电语境中的一个分支回路可供多个用电点，也可以跨房间。'],
  ['小型断路器 / 常说的空开','MCB','常见家用小型断路器提供过载、短路保护。不能把普通 MCB 当作剩余电流保护装置。'],
  ['剩余电流保护装置','RCD','按剩余电流动作的保护装置统称，RCCB、RCBO 都属于相关类型。“漏保”是常用俗称，不足以单独判断全部功能。'],
  ['不带过流保护的剩余电流断路器','RCCB','提供剩余电流保护，本身不提供过载与短路保护，需要适当配合。'],
  ['带过流保护的剩余电流断路器','RCBO','同一装置组合过载、短路与剩余电流保护。仍需匹配系统和安装条件。'],
  ['过载与短路','Overcurrent','都可能造成过电流。过载通常是正常工作路径上的负荷过大；短路是出现异常低阻通路。'],
  ['漏电 / 剩余电流','Residual current','有部分电流经预期工作回路之外的路径流走，可能造成受监测工作导体的电流和不为零。动作取决于具体条件。'],
  ['接触不良','Contact resistance','连接部位接触电阻异常可能造成局部发热，而总电流未必达到普通断路器的动作条件。'],
  ['浪涌保护器','SPD','用于限制瞬态过电压、分流浪涌电流的保护器。与过流、剩余电流保护职责不同，不能互相替代。'],
  ['保护接地与等电位联结','Earthing / Bonding','是电击防护体系中的不同组成部分。具体做法取决于供电系统、区域和设备，不能从教学图直接推断现场施工。'],
  ['插座额定值','Rated value','单个插座、插排、连接线、上游回路各有约束。不能仅看某一处额定值，也不能用增加插排来扩容。'],
  ['总闸与分路开关','Distribution','总开关控制较大的供电范围，分路开关控制相应支路。哪个先动作还取决于保护配合，不能保证任何故障都只跳分路。']
 ];
 const SOURCES=[
  ['应急管理部：家庭用电安全','https://www.mem.gov.cn/kp/shaq/201904/t20190403_365937.shtml','家庭保护措施、设备线路与异常排查的基础说明。'],
  ['施耐德电气：剩余电流保护装置的分类','https://www.se.com/au/en/faqs/FAQ000218859/','支持 RCCB、RCBO 是否包含过电流保护的职责划分。'],
  ['施耐德电气：剩余电流保护的检测原理','https://www.se.com/au/en/faqs/FAQ000210095/','受监测工作导体的电流和、不平衡与剩余电流。'],
  ['ABB：小型断路器技术资料','https://library.e.abb.com/public/6ef5f770b9c4458992e8b410087a4803/1SXP403001C0204.pdf','热磁式断路器、过载与短路动作特性。'],
  ['美国能源部：电力基础知识','https://www.energy.gov/oe/electricity-101','功率、电量及千瓦时等基础概念。'],
  ['ESFI：避免家庭用电过载','https://www.esfi.org/dont-overload-your-home/','插排不增加回路容量，以及变色、异味、异常发热等警示现象。'],
  ['深圳市卫生健康委员会：触电处置科普','https://wjw.sz.gov.cn/ztzl/jkkp/jkcs/content/post_11116129.html','先保障自身安全、切断电源并寻求急救。'],
  ['OpenStax：电势与电势差','https://openstax.org/books/university-physics-volume-2/pages/7-2-electric-potential-and-potential-difference','电压的物理含义。'],
  ['OpenStax：电流','https://openstax.org/books/university-physics-volume-2/pages/9-1-electrical-current','电荷通过速率与电流定义。'],
  ['OpenStax：交流与直流','https://openstax.org/books/college-physics-2e/pages/20-5-alternating-current-versus-direct-current','交流方向变化及功率关系。']
 ];
 function announce(msg){$('live-status').textContent=msg;}
 function renderControls(){
  $('devices').innerHTML=M.DEVICES.map(d=>`<button class="device-btn" data-device="${d.id}" aria-pressed="false">${icon(d.icon)}<span><strong>${d.name}</strong><small>${fmt(d.watts)} W</small></span></button>`).join('');
  $('breakers').innerHTML=Object.entries(M.CIRCUITS).map(([id,c])=>`<button class="breaker" data-breaker="${id}" aria-pressed="true" aria-label="模拟${c.name}回路开关"><span class="lever" aria-hidden="true"></span><span><b>${c.name}</b><small data-breaker-value="${id}">接通</small></span></button>`).join('');
  $('plan-circuits').innerHTML=Object.entries(M.CIRCUITS).map(([id,c])=>`<button data-plan="${id}" aria-pressed="${id===s.plan}" style="--circuit:${c.color}"><i aria-hidden="true"></i>${c.name}<small>查看分组</small></button>`).join('');
  $$('[data-device]').forEach(el=>el.addEventListener('click',()=>toggleDevice(el.dataset.device)));
  $$('[data-breaker]').forEach(el=>el.addEventListener('click',()=>toggleBreaker(el.dataset.breaker)));
  $$('[data-plan]').forEach(el=>el.addEventListener('click',()=>{s.plan=el.dataset.plan;updateHouse();updatePlan();setHash();announce(M.CIRCUITS[s.plan].title);}));
 }
 function toggleDevice(id){
  if(s.view!=='house')return;
  s.devices[id]=!s.devices[id];
  const d=M.DEVICES.find(d=>d.id===id),active=M.powered(s,id);
  $('selection-note').innerHTML=`<strong>${d.name}${s.devices[id]?'已开启':'已关闭'}。</strong>${s.devices[id]&&!active?'上游开关处于断开状态，它现在没有获得供电。':d.note}`;
  updateHouse();announce(`${d.name}${active?'正在运行':s.devices[id]?'已开启，但上游断电':'已关闭'}。当前总功率 ${fmt(M.total(s))} 瓦。`);
 }
 function toggleBreaker(id){
  if(s.view==='fault')return;
  s.circuits[id]=!s.circuits[id];updateHouse();
  $('selection-note').innerHTML=`<strong>${M.CIRCUITS[id].name}回路${s.circuits[id]?'合闸':'断开'}。</strong>${s.circuits[id]?'已开启的设备恢复供电。':'这一路的用电器一起失电，其他回路保持原状态。'}`;
  announce(`${M.CIRCUITS[id].name}回路${s.circuits[id]?'合闸':'断开'}。`);
 }
 function updateHouse(){
  const loads=M.loads(s),total=M.total(s),fault=M.FAULTS[s.fault];
  $('total-power').textContent=(total/1000).toFixed(2);
  $('total-current').textContent=`约 ${(total/220).toFixed(1)} A`;
  const scene=$('house-scene');
  scene.classList.toggle('no-wires',!s.wires);scene.classList.toggle('all-off',!s.main);
  for(let i=0;i<3;i++)scene.classList.toggle('fault-stage-'+i,s.view==='fault'&&s.step===i);
  scene.classList.toggle('contact-fault',s.view==='fault'&&s.fault==='contact');
  $$('[data-lit]').forEach(el=>{
   const id=el.dataset.lit,d=M.DEVICES.find(d=>d.id===id);
   el.classList.toggle('off',!M.powered(s,id)||(s.view==='plan'&&d.circuit!==s.plan));
  });
  $$('[data-device]').forEach(el=>{
   const id=el.dataset.device,d=M.DEVICES.find(d=>d.id===id),r=M.requested(s,id),p=M.powered(s,id);
   el.setAttribute('aria-pressed',r);el.classList.toggle('cut',r&&!p);
   el.setAttribute('aria-label',`${d.name}，示例 ${d.watts} 瓦，${r?(p?'已开启':'已开启，上游断电'):'已关闭'}`);
  });
  $$('.hotspot').forEach(el=>{
   const id=el.dataset.toggle,d=M.DEVICES.find(d=>d.id===id),on=M.powered(s,id);
   el.classList.toggle('on',on);el.setAttribute('aria-pressed',!!s.devices[id]);el.setAttribute('tabindex',s.view==='house'?'0':'-1');
   el.setAttribute('aria-label',`${d.name}，${on?'正在运行':'未运行'}，点击切换`);
  });
  $$('.circuit-route').forEach(el=>{
   const c=el.dataset.circuit,hasLoad=el.dataset.deviceRoute?M.powered(s,el.dataset.deviceRoute):(s.view==='plan'?M.closed(s,c):loads[c]>0);
   el.classList.toggle('off',!hasLoad);el.classList.toggle('dimmed',s.view==='plan'&&c!==s.plan);el.classList.toggle('faulted',s.view==='fault'&&c===fault.circuit);
  });
  $$('[data-breaker]').forEach(el=>{
   const c=el.dataset.breaker,isClosed=M.closed(s,c),trip=s.view==='fault'&&s.step===2&&s.fault!=='contact'&&c===fault.circuit;
   el.setAttribute('aria-pressed',isClosed);el.classList.toggle('tripped',trip);el.disabled=s.view==='fault';
   el.setAttribute('aria-label',`${M.CIRCUITS[c].name}模拟开关，${trip?'保护动作已断开':isClosed?'合闸':'断开'}，当前 ${loads[c]} 瓦`);
   el.querySelector('small').textContent=trip?'保护断开':isClosed?fmt(loads[c])+' W':s.main?'断开':'总闸断开';
  });
  $$('[data-mini-breaker]').forEach(el=>el.classList.toggle('tripped',!M.closed(s,el.dataset.miniBreaker)));
  $('master-switch').setAttribute('aria-pressed',s.main);$('master-switch').disabled=s.view==='fault';
  $('master-switch').querySelector('span').textContent='模拟总闸 · '+(s.main?'合':'分');
  const light=M.powered(s,'lighting')?20:0;
  const roomWatts={kitchen:loads.kitchen+light,ac:loads.ac+light,sockets:loads.sockets+light,water:loads.water+light};
  $$('[data-room-watts]').forEach(el=>el.textContent=s.view==='plan'?(s.plan==='lighting'?'照明覆盖':s.plan===el.dataset.roomWatts?'所选回路':'其他回路'):fmt(roomWatts[el.dataset.roomWatts])+' W');
  $('fault-kitchen').classList.toggle('active',s.view==='fault'&&s.step>=1&&fault.circuit==='kitchen'&&(s.step===1||s.fault==='contact'));
  $('fault-water').classList.toggle('active',s.view==='fault'&&s.step===1&&s.fault==='leak');
  $('leak-route').classList.toggle('active',s.view==='fault'&&s.step===1&&s.fault==='leak');
  let status=!s.main?'总闸断开 · 全屋失电':total?'住宅运行中':'所有示例电器已关闭';
  if(s.view==='plan')status=`观察 ${M.CIRCUITS[s.plan].name} 回路`;
  if(s.view==='fault')status=s.step===0?'实验准备 · 供电正常':s.step===1?'异常发生 · 观察变化':s.fault==='contact'?'未跳闸 · 局部仍发热':'保护已动作 · 故障支路断电';
  $('scene-status').querySelector('span').textContent=status;
  $('wires-toggle').setAttribute('aria-pressed',s.wires);
 }
 function updatePlan(){
  const c=M.CIRCUITS[s.plan];$('plan-title').textContent=c.title;$('plan-body').textContent=c.body;
  $$('[data-plan]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.plan===s.plan));
 }
 function updateFault(){
  const f=M.FAULTS[s.fault],st=f.stages[s.step];
  $('fault-title').textContent=f.name;$('fault-intro').textContent=f.intro;
  $('step-title').textContent=st[0];$('step-body').textContent=st[1];$('step-tag').textContent=st[2];
  $('fault-protection').textContent=f.protection;$('fault-safety').textContent=f.safety;
  $$('[data-fault]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.fault===s.fault));
  $$('[data-step]').forEach(el=>el.setAttribute('aria-pressed',Number(el.dataset.step)===s.step));
  $('fault-play').innerHTML=icon(s.paused?'play':playback?'pause':s.step===2?'reset':'play')+`<span>${s.paused?(s.step===2?'回到第一步':'看下一步'):playback?'暂停演示':s.step===2?'再看一次':'开始演示'}</span>`;
 }
 function stopStory(){playback=false;clearTimeout(storyTimer);storyTimer=null;}
 function scheduleStory(){
  clearTimeout(storyTimer);storyTimer=null;
  if(!playback||s.paused||document.hidden||s.view!=='fault')return;
  storyTimer=setTimeout(()=>{
   s.step=Math.min(2,s.step+1);if(s.step===2)playback=false;updateFault();updateHouse();
   announce(M.FAULTS[s.fault].stages[s.step][0]);scheduleStory();
  },3200);
 }
 function setView(view,updateHash=true){
  if(!TITLES[view])return;
  if(s.view==='fault'&&view!=='fault'&&snapshot){s.main=snapshot.main;s.circuits={...snapshot.circuits};snapshot=null;}
  if(view==='fault'&&s.view!=='fault'){
   snapshot={main:s.main,circuits:{...s.circuits}};s.main=true;s.circuits=Object.fromEntries(Object.keys(M.CIRCUITS).map(k=>[k,true]));s.step=0;
  }
  if(view!=='fault')stopStory();s.view=view;
  const [eyebrow,title,subtitle]=TITLES[view];$('view-eyebrow').textContent=eyebrow;$('view-title').textContent=title;$('view-subtitle').textContent=subtitle;
  $$('.chapter-nav [data-view]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.view===view));
  $('house-experience').hidden=view==='lab';$('lab-experience').hidden=view!=='lab';$('fault-tabs').hidden=view!=='fault';
  $('world-panel').hidden=view!=='house';$('fault-panel').hidden=view!=='fault';$('plan-panel').hidden=view!=='plan';
  const i=INSIGHTS[view];$('insight-number').textContent=i[0];$('insight-title').textContent=i[1];$('insight-body').textContent=i[2];$('insight-action').innerHTML=i[3]+icon('arrow');$('insight-action').dataset.dialog=i[4];
  if(view==='fault'){s.wires=true;updateFault();}
  if(view==='plan'){s.wires=true;updatePlan();}
  updateHouse();updateLab();if(updateHash)setHash();announce(title);
 }
 function setHash(){
  let hash='#'+s.view;
  if(s.view==='fault')hash+='/'+s.fault;
  if(s.view==='lab')hash+='/'+s.lab;
  if(s.view==='plan')hash+='/'+s.plan;
  if(location.hash!==hash)history.replaceState(null,'',hash);
 }
 function readHash(){
  const [view,sub]=location.hash.slice(1).split('/');
  if(view==='fault'&&M.FAULTS[sub])s.fault=sub;
  if(view==='plan'&&M.CIRCUITS[sub])s.plan=sub;
  if(view==='lab'&&['loop','energy','protection'].includes(sub))s.lab=sub;
  setView(TITLES[view]?view:'house',false);
 }
 function updateLab(){
  ['loop','energy','protection'].forEach(k=>$('lab-'+k).hidden=s.lab!==k);
  $$('[data-lab]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.lab===s.lab));
  $('loop-stage').classList.toggle('lab-open',!s.closed);
  $('loop-switch').setAttribute('aria-pressed',s.closed);$('loop-switch').querySelector('span').textContent=s.closed?'断开模拟开关':'接通模拟开关';
  $('wave-label').textContent=s.closed?'电流方向周期性变化':'回路断开：工作电流为零';
  $$('[data-wire-group]').forEach(el=>el.classList.toggle('wire-dim',s.wire!=='all'&&el.dataset.wireGroup!==s.wire));
  $$('[data-wire]').forEach(el=>el.setAttribute('aria-pressed',s.wire===el.dataset.wire));
  const wires={all:'点击 L、N 或 PE，单独观察它的职责。再次点击，可回到三线全貌。',l:'L 火线：与 N 一起形成工作回路。图中开关位于 L 路径上，用来演示回路接通与断开。',n:'N 零线：正常时参与工作回流。它不是 PE，也不能当作“可以安全触摸的线”。',pe:'PE 保护地线：连接需要接地的外壳。它不承担正常工作回流；绝缘故障时，与适当保护配合。'};
  $('wire-detail').textContent=wires[s.wire];
  updateEnergy();updateMechanism();syncLoopAnimation();
 }
 function updateEnergy(){
  $('power-range-output').textContent=fmt(s.power)+' W';$('hours-range-output').textContent=fmt(s.hours)+' 小时';
  $('svg-energy-power').textContent=(s.power/1000).toFixed(2);$('svg-energy-watts').textContent=fmt(s.power);
  $('svg-energy-current').textContent=(s.power/220).toFixed(2);$('svg-energy-hours').textContent=fmt(s.hours)+' 小时';
  const result=M.energy(s.power,s.hours,s.price),arc=2*Math.PI*169;
  $('power-arc').setAttribute('stroke-dasharray',`${s.power/3000*arc} ${arc}`);
  $('svg-energy-kwh').textContent=(s.power/1000*s.hours).toFixed(2);
  $('svg-energy-cost').textContent=result?'¥ '+result.cost.toFixed(2):'—';
  $('calc-error').textContent=result?'':'请输入有效的非负电价。';$('electricity-price').setAttribute('aria-invalid',!result);
 }
 function updateMechanism(){
  const m=MECHANISMS[s.mechanism],residual=s.mechanism!=='mcb',overcurrent=s.mechanism!=='rccb',trip=s.leaking&&residual;
  $('breaker-model-label').textContent=s.mechanism.toUpperCase();$('mechanism-name').textContent=m.name;$('mechanism-body').textContent=m.body;$('mechanism-caveat').textContent=m.caveat;
  $('mechanism-pills').innerHTML=['过载','短路','剩余电流'].map((t,i)=>`<span class="${m.tags[i]?'':'not-included'}">${m.tags[i]?'包含':'不含'}${t}保护</span>`).join('');
  $$('[data-mechanism]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.mechanism===s.mechanism));
  $('residual-module').classList.toggle('mechanism-muted',!residual);$('overcurrent-module').classList.toggle('mechanism-muted',!overcurrent);
  $('delta-label').textContent=s.leaking?'ΔI ≠ 0':'ΔI = 0';
  $('residual-leak-path').setAttribute('visibility',s.leaking?'visible':'hidden');$('residual-leak-label').setAttribute('visibility',s.leaking?'visible':'hidden');
  $('protection-handle').setAttribute('transform',trip?'translate(0 25)':'translate(0 0)');
  $('protection-handle-label').textContent=trip?'保护断开 / 示意状态':s.leaking?'无剩余电流保护 / 未动作':'合闸 / 示意状态';
  $('residual-toggle').setAttribute('aria-pressed',s.leaking);$('residual-toggle').querySelector('span').textContent=s.leaking?'恢复正常状态':'模拟满足动作条件的漏电';
 }
 function syncLoopAnimation(){
  const should=s.view==='lab'&&s.lab==='loop'&&s.closed&&!s.paused&&!document.hidden;
  if(!should){if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;return;}
  if(!raf)raf=requestAnimationFrame(animateLoop);
 }
 function animateLoop(time){
  const dt=lastFrame?Math.min(time-lastFrame,50):0;lastFrame=time;phase+=dt*.0023;
  const shift=Math.sin(phase)*16;
  $$('#electrons circle').forEach(el=>el.setAttribute('cx',Number(el.dataset.x)+Number(el.dataset.sign)*shift));
  const cursor=((phase/(Math.PI*2))%1)*228;$('wave-cursor').setAttribute('x1',cursor);$('wave-cursor').setAttribute('x2',cursor);
  raf=requestAnimationFrame(animateLoop);
 }
 function syncMotion(){
  document.body.classList.toggle('motion-paused',s.paused||document.hidden);
  const btn=$('motion-toggle');btn.setAttribute('aria-pressed',s.paused);btn.setAttribute('aria-label',s.paused?'继续动效':'暂停动效');btn.innerHTML=icon(s.paused?'play':'pause')+`<span class="text-label">${s.paused?'继续动效':'暂停动效'}</span>`;
  syncLoopAnimation();scheduleStory();if(s.view==='fault')updateFault();
 }
 function termsMarkup(){return '<p>不用一次全背下来。遇到一个词，先看它的职责，再回到场景里验证。</p><label class="sr-only" for="term-search">搜索名词</label><input id="term-search" class="term-search" type="search" placeholder="搜索：地线、空开、度电……"><div class="terms-list">'+TERMS.map(([name,abbr,body])=>`<article class="term" data-term="${name} ${abbr} ${body}"><small>${abbr}</small><h3>${name}</h3><p>${body}</p></article>`).join('')+'</div><p id="term-empty" class="no-results" hidden>没有匹配的名词，试试换一个词。</p>';}
 function dialogContent(kind){
  if(kind==='terms')return ['名词图鉴',termsMarkup()];
  if(kind==='sources')return ['原理与资料来源','<div class="source-summary">本页以中国大陆普通住宅单相供电为例。数值与分路是教学模型，不是现场测量、容量判定或施工设计。故障慢放展示因果，不给出真实动作时间。</div><ol class="source-list">'+SOURCES.map(([label,url,body])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a><small>${body}</small></li>`).join('')+'</ol><p class="technical-note">资料核对：2026 年 9 月。具体项目应结合当地适用要求、供电条件和设备说明书。</p>'];
  if(kind==='supply')return ['电进入家里，要经过什么？','<p>先建立层次，再看细节。下面展示典型的功能关系，具体电表、总开关与保护设备的位置和顺序可能因住宅不同而变化。</p><div class="supply-steps">'+[
   ['01','楼栋供配电与入户','电力经供配电系统送到住宅。上游系统与可用容量构成约束，家里增加插座并不会自动增加入户容量。'],
   ['02','电表：累计用了多少电','电表记录电能消耗，读数通常以 kWh 表示。它与配电箱的分配、保护职责不同；表上示例数字不是本页实际累计读数。'],
   ['03','配电箱：分路与保护','总开关控制整体范围，各分支回路由相应开关、保护装置等供电。器件配置因项目而异，不是“一排长得像的开关都一样”。'],
   ['04','分支回路：把用电点分组','一条回路可以供多个插座或多个房间的灯。分路有助于合理分配负荷，也有助于控制故障影响范围。'],
   ['05','插座、固定接线与电器','并非所有电器都通过可见插座供电。插排只增加接口，不改变上游容量；电器按自身工作状态取用功率。']
  ].map(([n,title,body])=>`<div class="supply-step"><span>${n}</span><div><h3>${title}</h3><p>${body}</p></div></div>`).join('')+'</div>'];
  if(kind==='planning')return ['把布电需求说清楚','<p>这份清单帮助你与设计、施工和检测人员沟通。它不会根据面积或几台电器直接给出统一线径与开关规格。</p><ul><li><strong>画位置：</strong>家具、电器、操作台、门窗和预计使用的插座位置，减少入住后的临时拉线。</li><li><strong>列设备：</strong>设备名称、铭牌输入功率、供电与安装要求；留意空调、厨电、热水器及未来新增设备。</li><li><strong>算同时使用：</strong>做饭、洗澡、洗烘、取暖等活动可能重叠，不能仅逐台看功率。</li><li><strong>查现状：</strong>入户容量、既有线缆、回路分组、保护器类型、接地与已有问题。</li><li><strong>划分回路：</strong>结合用途、负荷、供电连续性和适用要求设计，避免把所有需求都堆到同一条线路。</li><li><strong>核对潮湿区域：</strong>位置、设备防护、剩余电流保护、接地及适用的等电位联结要求。</li><li><strong>留下资料：</strong>回路标签、竣工走线资料、检测记录、设备说明及后续维护信息。</li></ul><h3>验收时需要的是证据</h3><p>外观整齐、试灯能亮、开关没跳，都不能单独证明整个系统合格。固定线路、保护与接地需由具备相应能力和资质的人员按适用要求检测。</p>'];
  return ['出现异常时怎么办','<p>先看现象，控制风险，再查原因。不要把本页的模拟开关操作当作现场维修步骤。</p><div class="supply-steps">'+[
   ['01','跳闸、焦味、异响、发烫','停用相关设备。若能在安全条件下切断相关电源，可先断电；有进水、裸露带电部位或冒烟时，不要靠近操作。不要反复合闸或自行加大开关额定电流。'],
   ['02','触摸外壳发麻','立即停止接触与使用。这可能涉及漏电或接地问题，交由专业人员排查；不能靠鞋、手套或“碰一下试试”验证。'],
   ['03','有人触电','先确保自身安全，避免直接接触仍与电源相连的人。在安全条件下切断电源，立即呼叫 120，并按急救调度指导施救。'],
   ['04','冒烟或起火','优先撤离危险区域并呼叫 119。不要向仍带电的设备泼水；不要为断电而进入不安全位置。'],
   ['05','看不出问题在哪里','向物业、供电服务或专业电工描述现象与发生时间。配电箱内部、固定线路和接地系统不适合凭教学图自行拆改。']
  ].map(([n,title,body])=>`<div class="supply-step"><span>${n}</span><div><h3>${title}</h3><p>${body}</p></div></div>`).join('')+'</div>'];
 }
 function openDialog(kind){
  dialogFocus=document.activeElement;const [title,content]=dialogContent(kind);$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;
  const dialog=$('reference-dialog');dialog.showModal();
  if(kind==='terms'){
   const search=$('term-search');search.addEventListener('input',()=>{let count=0;const q=search.value.toLowerCase().trim();$$('[data-term]').forEach(el=>{el.hidden=!el.dataset.term.toLowerCase().includes(q);if(!el.hidden)count++;});$('term-empty').hidden=count>0;});search.focus();
  }
 }
 function addSceneHotspots(){
  const coords={lighting:[444,274],tv:[166,281],fridge:[639,221],hob:[648,217],kettle:[583,149],ac:[956,302],heater:[631,354],pc:[372,421]};
  const ns='http://www.w3.org/2000/svg';
  for(const d of M.DEVICES){
   const [x,y]=coords[d.id],g=document.createElementNS(ns,'g');g.setAttribute('class','hotspot');g.dataset.toggle=d.id;g.setAttribute('transform',`translate(${x} ${y})`);g.setAttribute('role','button');g.setAttribute('tabindex','0');
   g.innerHTML=`<title>${d.name} · ${fmt(d.watts)} W · 点击切换</title><circle class="hit" r="24"/><circle class="target" r="4"/>`;
   g.addEventListener('click',()=>toggleDevice(d.id));g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleDevice(d.id);}});$('house-svg').append(g);
  }
 }
 renderControls();addSceneHotspots();
 $$('[data-view]').forEach(el=>el.addEventListener('click',()=>{setView(el.dataset.view);if(el.classList.contains('journey'))$('main').scrollIntoView({behavior:s.paused?'auto':'smooth',block:'start'});}));
 $$('[data-preset]').forEach(el=>el.addEventListener('click',()=>{for(const d of M.DEVICES)s.devices[d.id]=M.PRESETS[el.dataset.preset].includes(d.id);$('selection-note').textContent=`已切换到“${el.textContent}”。电器组合是演示预设，你可以继续调整。`;updateHouse();announce(`已切换到${el.textContent}，示例总功率 ${M.total(s)} 瓦。`);}));
 $('master-switch').addEventListener('click',()=>{if(s.view==='fault')return;s.main=!s.main;updateHouse();announce(s.main?'模拟总闸合上，已开启的支路恢复供电。':'模拟总闸断开，全屋电器失电。');});
 $('wires-toggle').addEventListener('click',()=>{s.wires=!s.wires;updateHouse();});
 $$('[data-fault]').forEach(el=>el.addEventListener('click',()=>{stopStory();s.fault=el.dataset.fault;s.step=0;updateFault();updateHouse();setHash();announce(M.FAULTS[s.fault].name);}));
 $$('[data-step]').forEach(el=>el.addEventListener('click',()=>{stopStory();s.step=Number(el.dataset.step);updateFault();updateHouse();announce(M.FAULTS[s.fault].stages[s.step][0]);}));
 $('fault-play').addEventListener('click',()=>{
  if(s.paused){stopStory();s.step=(s.step+1)%3;updateFault();updateHouse();announce(M.FAULTS[s.fault].stages[s.step][0]);return;}
  if(playback){stopStory();updateFault();return;}
  if(s.step===2)s.step=0;playback=true;updateFault();updateHouse();scheduleStory();
 });
 $$('[data-lab]').forEach(el=>el.addEventListener('click',()=>{s.lab=el.dataset.lab;updateLab();setHash();announce(el.textContent.trim());}));
 $('loop-switch').addEventListener('click',()=>{s.closed=!s.closed;updateLab();announce(s.closed?'工作回路接通，灯具点亮。':'工作回路断开，灯具熄灭。');});
 $$('[data-wire]').forEach(el=>el.addEventListener('click',()=>{s.wire=s.wire===el.dataset.wire?'all':el.dataset.wire;updateLab();}));
 $('power-range').addEventListener('input',event=>{s.power=Number(event.target.value);updateEnergy();});$('hours-range').addEventListener('input',event=>{s.hours=Number(event.target.value);updateEnergy();});
 $('electricity-price').addEventListener('input',event=>{s.price=event.target.value.trim()===''?NaN:Number(event.target.value);updateEnergy();});
 $$('[data-mechanism]').forEach(el=>el.addEventListener('click',()=>{s.mechanism=el.dataset.mechanism;updateMechanism();}));
 $('residual-toggle').addEventListener('click',()=>{s.leaking=!s.leaking;updateMechanism();announce(s.leaking?(s.mechanism==='mcb'?'MCB 不检测剩余电流，模拟开关未因该条件动作。':'假设剩余电流满足动作条件，保护切断。'):'恢复正常供电状态。');});
 $$('[data-answer]').forEach(el=>el.addEventListener('click',()=>{$$('[data-answer]').forEach(b=>b.setAttribute('aria-pressed',b===el));$('quiz-answer').textContent=(el.dataset.answer==='no'?'判断正确。':'这个判断不成立。')+'它不能防住所有触电。例如人同时接触 L 与 N 时，流入与返回仍可能平衡。';}));
 $$('.planning-checklist input').forEach(el=>el.addEventListener('change',()=>{$('checklist-output').textContent=`已准备 ${$$('.planning-checklist input:checked').length} / 4 项`; }));
 document.addEventListener('click',event=>{const b=event.target.closest('[data-dialog]');if(b)openDialog(b.dataset.dialog);});
 $('dialog-close').addEventListener('click',()=>$('reference-dialog').close());$('reference-dialog').addEventListener('close',()=>{if(dialogFocus)dialogFocus.focus();});
 $('reference-dialog').addEventListener('click',event=>{if(event.target===$('reference-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
 $('motion-toggle').addEventListener('click',()=>{s.paused=!s.paused;syncMotion();});
 motionPreference.addEventListener('change',event=>{s.paused=event.matches;syncMotion();});document.addEventListener('visibilitychange',syncMotion);
 window.addEventListener('hashchange',readHash);
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('motion-paused',!e.isIntersecting)),{threshold:.05});$$('.scene,.lab-stage').forEach(el=>observer.observe(el));}
 if(document.body.dataset.mode==='stage'){
  $('companion-link').href='一眼看懂家庭用电.html';$('companion-link').setAttribute('aria-label','在新标签页回到家庭用电讲解');$('companion-link').querySelector('.text-label').textContent='回到讲解';
 }
 if(location.pathname.includes('/electricity/home-electricity/'))$('network-link').href='../../networking/home-network/一眼看懂家庭网络.html';
 readHash();syncMotion();
})();

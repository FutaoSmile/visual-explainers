// Executes the actual shipped scripts against a DOM implementation. No browser navigation.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');

const html=fs.readFileSync(path.join(__dirname,'../一眼看懂家庭用电.html'),'utf8');
const {window,document}=parseHTML(html);
const timers=new Map(),frames=new Map();let sequence=0;
window.matchMedia=()=>({matches:false,addEventListener(){}});
window.HTMLElement.prototype.scrollIntoView=function(){};
const dialog=document.getElementById('reference-dialog');
dialog.showModal=function(){this.setAttribute('open','');};
dialog.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
const location={hash:'',protocol:'file:',pathname:'/workspace/electricity/home-electricity/一眼看懂家庭用电.html'};
const context=vm.createContext({window,document,location,history:{replaceState(a,b,hash){location.hash=hash;}},console,
 setTimeout(fn){const id=++sequence;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},
 requestAnimationFrame(fn){const id=++sequence;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}});
for(const script of document.querySelectorAll('script'))vm.runInContext(script.textContent,context,{filename:'built-page-script.js'});
const $=id=>document.getElementById(id);
const find=selector=>{const el=document.querySelector(selector);assert.ok(el,'Missing: '+selector);return el;};
const click=selector=>find(selector).dispatchEvent(new window.Event('click',{bubbles:true}));
const input=(id,value)=>{const el=$(id);el.value=String(value);el.dispatchEvent(new window.Event('input',{bubbles:true}));};
const pressed=selector=>find(selector).getAttribute('aria-pressed');
const snapshotDir=process.env.ELECTRICITY_SVG_QA;
function snapshot(name,id,classes=''){
 if(!snapshotDir)return;
 fs.mkdirSync(snapshotDir,{recursive:true});
 const node=$(id).cloneNode(true);node.setAttribute('class',(node.getAttribute('class')||'')+' '+classes);
 fs.writeFileSync(path.join(snapshotDir,name+'.svg'),node.outerHTML);
}

assert.equal($('total-power').textContent,'1.20');
assert.ok(find('[data-device-route="kettle"]').classList.contains('off'));
assert.equal(document.querySelectorAll('[data-device]').length,8);
assert.equal(document.querySelectorAll('.hotspot').length,8);
assert.equal(document.querySelectorAll('[data-breaker]').length,5);
snapshot('house-initial','house-svg');
click('[data-device="kettle"]');assert.equal($('total-power').textContent,'2.70');
assert.ok(!find('[data-device-route="kettle"]').classList.contains('off'));
assert.equal(pressed('[data-device="kettle"]'),'true');
assert.ok(!find('[data-lit="kettle"]').classList.contains('off'));
click('[data-breaker="kitchen"]');assert.equal($('total-power').textContent,'1.10');
assert.ok(find('[data-lit="kettle"]').classList.contains('off'));
assert.ok(find('[data-device="kettle"]').classList.contains('cut'));
click('#master-switch');assert.equal($('total-power').textContent,'0.00');
click('#master-switch');assert.equal($('total-power').textContent,'1.10');

// Fault experiments isolate their target and preserve the user's prior normal state.
click('.chapter-nav [data-view="fault"]');
assert.equal($('world-panel').hidden,true);assert.equal($('fault-panel').hidden,false);
click('[data-step="1"]');assert.ok($('fault-kitchen').classList.contains('active'));
snapshot('house-overload','house-svg','fault-stage-1');
click('[data-step="2"]');assert.equal(pressed('[data-breaker="kitchen"]'),'false');
assert.equal(pressed('[data-breaker="water"]'),'true');
click('[data-fault="leak"]');click('[data-step="1"]');
assert.ok($('leak-route').classList.contains('active'));snapshot('house-leak','house-svg','fault-stage-1');
click('[data-step="2"]');assert.equal(pressed('[data-breaker="water"]'),'false');
click('[data-fault="contact"]');click('[data-step="2"]');
assert.equal(pressed('[data-breaker="kitchen"]'),'true');
assert.ok($('fault-kitchen').classList.contains('active'));snapshot('house-contact','house-svg','fault-stage-2 contact-fault');
click('.chapter-nav [data-view="house"]');
assert.equal($('total-power').textContent,'1.10');assert.equal(pressed('[data-breaker="kitchen"]'),'false');
assert.equal(pressed('[data-device="kettle"]'),'true');

// Story playback advances deterministically, stops at the result, and cancels on navigation.
click('.chapter-nav [data-view="fault"]');click('[data-fault="short"]');click('#fault-play');
assert.equal(timers.size,1);
function tick(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}
tick();assert.equal(pressed('[data-step="1"]'),'true');tick();assert.equal(pressed('[data-step="2"]'),'true');assert.equal(timers.size,0);
click('#fault-play');assert.equal(timers.size,1);click('.chapter-nav [data-view="house"]');assert.equal(timers.size,0);

// Planning reuses all five existing routes and leaves living presets intact.
click('.chapter-nav [data-view="plan"]');click('[data-plan="water"]');
assert.equal(pressed('[data-plan="water"]'),'true');
assert.ok(!find('[data-circuit="water"]').classList.contains('dimmed'));
assert.ok(find('[data-circuit="kitchen"]').classList.contains('dimmed'));
snapshot('house-plan','house-svg');
click('.chapter-nav [data-view="house"]');assert.equal($('total-power').textContent,'1.10');

// All three mechanism exhibits operate, and a zero/invalid price cannot leave stale cost.
click('.chapter-nav [data-view="lab"]');
assert.equal($('house-experience').hidden,true);assert.equal($('lab-loop').hidden,false);assert.equal(frames.size,1);
snapshot('loop-closed','loop-art');
click('#loop-switch');assert.ok($('loop-stage').classList.contains('lab-open'));assert.equal(frames.size,0);assert.match($('wave-label').textContent,/零/);
snapshot('loop-open','loop-art','lab-open');
click('[data-wire="pe"]');assert.equal(pressed('[data-wire="pe"]'),'true');
click('[data-wire="pe"]');assert.equal(pressed('[data-wire="pe"]'),'false');
click('[data-lab="energy"]');input('power-range',2000);input('hours-range',.5);
assert.equal($('svg-energy-kwh').textContent,'1.00');assert.equal($('svg-energy-cost').textContent,'¥ 0.60');
input('electricity-price','');assert.equal($('svg-energy-cost').textContent,'—');assert.equal($('electricity-price').getAttribute('aria-invalid'),'true');
input('electricity-price',0);assert.equal($('svg-energy-cost').textContent,'¥ 0.00');
input('electricity-price',.6);input('power-range',1000);input('hours-range',2);snapshot('energy','lab-energy');
click('[data-lab="protection"]');
click('#residual-toggle');assert.match($('protection-handle-label').textContent,/保护断开/);
snapshot('rcbo-trip','protection-art');
click('[data-mechanism="mcb"]');assert.match($('protection-handle-label').textContent,/未动作/);assert.ok($('residual-module').classList.contains('mechanism-muted'));
click('[data-mechanism="rccb"]');assert.ok($('overcurrent-module').classList.contains('mechanism-muted'));assert.match($('protection-handle-label').textContent,/保护断开/);
click('[data-mechanism="rcbo"]');click('#residual-toggle');snapshot('rcbo-normal','protection-art');
click('[data-answer="yes"]');assert.match($('quiz-answer').textContent,/不成立/);click('[data-answer="no"]');assert.match($('quiz-answer').textContent,/正确/);

// Dialog search and outgoing links are part of the shipped behavior.
click('[data-dialog="terms"]');assert.ok(dialog.hasAttribute('open'));input('term-search','RCBO');
assert.ok(Array.from(document.querySelectorAll('.term')).filter(e=>!e.hidden).length>0);
input('term-search','no-such-term-342');assert.equal($('term-empty').hidden,false);click('#dialog-close');assert.ok(!dialog.hasAttribute('open'));
click('[data-dialog="sources"]');
assert.equal(document.querySelectorAll('#dialog-content a[target="_blank"]').length,10);click('#dialog-close');
assert.equal($('network-link').getAttribute('href'),'../../networking/home-network/一眼看懂家庭网络.html');
click('#motion-toggle');assert.equal(pressed('#motion-toggle'),'true');
click('.chapter-nav [data-view="fault"]');click('[data-fault="overload"]');click('#fault-play');
assert.equal(pressed('[data-step="1"]'),'true');assert.equal(timers.size,0);
console.log('PASS: actual document events, circuit isolation/restoration, 4 fault stories, playback cancellation, 3 labs, calculation validation, dialogs, motion controls.');

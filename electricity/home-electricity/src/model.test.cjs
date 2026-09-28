const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('./model.js');

test('a branch cut removes only devices on that branch, without forgetting their switches',()=>{
 const s=M.makeState();s.devices.pc=true;s.devices.heater=true;
 assert.equal(M.total(s),3380);
 s.circuits.sockets=false;
 assert.equal(M.total(s),3080);
 assert.equal(M.powered(s,'tv'),false);assert.equal(M.powered(s,'pc'),false);
 assert.equal(M.powered(s,'heater'),true);assert.equal(s.devices.tv,true);
 s.circuits.sockets=true;assert.equal(M.total(s),3380);
});
test('main switch isolates every branch',()=>{
 const s=M.makeState();s.main=false;
 assert.equal(M.total(s),0);
 for(const c of Object.keys(M.CIRCUITS))assert.equal(M.closed(s,c),false);
 s.main=true;assert.equal(M.total(s),1200);
});
test('overload sequence adds demand then isolates the kitchen',()=>{
 const s=M.makeState();s.view='fault';s.fault='overload';
 assert.equal(M.loads(s).kitchen,2100);
 s.step=1;assert.equal(M.loads(s).kitchen,3600);
 const other=M.loads(s).water;s.step=2;
 assert.equal(M.loads(s).kitchen,0);assert.equal(M.loads(s).water,other);
 assert.equal(M.powered(s,'fridge'),false);
});
test('short-circuit and leakage experiments isolate the intended circuit',()=>{
 for(const [fault,target] of [['short','kitchen'],['leak','water']]){
  const s=M.makeState();s.view='fault';s.fault=fault;s.step=1;
  assert.ok(M.loads(s)[target]>0);s.step=2;
  assert.equal(M.loads(s)[target],0);assert.ok(M.loads(s).sockets>0);
 }
});
test('contact resistance story intentionally does not claim an automatic trip',()=>{
 const s=M.makeState();s.view='fault';s.fault='contact';s.step=2;
 assert.equal(M.closed(s,'kitchen'),true);assert.equal(M.powered(s,'kettle'),true);
});
test('planning view illuminates every device in a group independent of living preset',()=>{
 const s=M.makeState();s.view='plan';s.devices={};
 for(const d of M.DEVICES)assert.equal(M.powered(s,d.id),true);
 s.circuits.water=false;assert.equal(M.powered(s,'heater'),false);
});
test('energy distinguishes rate and duration, accepts zero and rejects invalid inputs',()=>{
 assert.deepEqual(M.energy(1000,2,.6),{kwh:2,cost:1.2,current:1000/220});
 assert.equal(M.energy(2000,.5,.6).kwh,1);
 assert.equal(M.energy(0,24,0).cost,0);
 for(const args of [[-1,2,.6],[1000,-1,.6],[1000,25,.6],[1000,2,NaN],[Infinity,2,.6],[1000,2,-.1]])assert.equal(M.energy(...args),null);
});

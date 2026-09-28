(function(root){
 'use strict';
 const CIRCUITS={
  lighting:{name:'照明',color:'#ffe0a3',title:'一条照明回路，可以跨多个房间。',body:'这座示例住宅将四个房间的照明放在同一条回路。试着在配电箱断开它：灯光一起熄灭，插座电器仍可运行。实际住宅也可能按区域拆成多条照明回路。'},
  sockets:{name:'普通插座',color:'#76dce9',title:'同一路插座，共享上游容量。',body:'本例电视与电脑共用普通插座回路。插排不会增加这条回路的容量；也不能只看插孔数量决定可接多少电器。应核对各环节额定值和实际总负荷。'},
  kitchen:{name:'厨房',color:'#ffbc77',title:'先盘点会同时开的厨房电器。',body:'电磁炉、电水壶、冰箱都属于本例的厨房组。现实中烤箱、蒸箱等设备是否需要独立回路，应结合铭牌、安装要求和同时使用情况设计；这张图的分组不是施工标准。'},
  ac:{name:'空调',color:'#acbffc',title:'固定设备，按设备要求安排供电。',body:'本例为空调安排单独回路。不同机型、安装方式和功率要求不同，不能用一个统一的线径或开关规格套用。变频空调会调节功率，这里的 900 W 只是演示取值。'},
  water:{name:'热水器',color:'#88edce',title:'潮湿环境，要把保护一起规划。',body:'本例热水器单独供电。除了容量，还要核对设备安装位置、保护接地、剩余电流保护及适用的等电位联结要求。让专业人员结合住宅条件检查，不能只凭“有地线”判断安全。'}
 };
 const DEVICES=[
  {id:'lighting',name:'全屋照明',watts:80,circuit:'lighting',icon:'lighting',note:'四个房间的灯，共用本例的照明回路。'},
  {id:'tv',name:'电视',watts:120,circuit:'sockets',icon:'tv',note:'电视与电脑接在本例的同一条普通插座回路。'},
  {id:'fridge',name:'冰箱',watts:100,circuit:'kitchen',icon:'fridge',note:'实际冰箱会启停；不能把这一刻的功率直接乘以 24 小时当作实际日耗电。'},
  {id:'hob',name:'电磁炉',watts:2000,circuit:'kitchen',icon:'hob',note:'高功率电器同时使用，会增加共同上游回路的负荷。'},
  {id:'kettle',name:'电水壶',watts:1500,circuit:'kitchen',icon:'kettle',note:'烧水时间短，瞬时功率却不小。功率大与一天耗电多，是两件事。'},
  {id:'ac',name:'空调',watts:900,circuit:'ac',icon:'ac',note:'变频空调的实际输入功率会变化；此处用固定值帮助理解分路。'},
  {id:'heater',name:'热水器',watts:2000,circuit:'water',icon:'heater',note:'热水器既要满足供电要求，也要配合接地与适当的保护。'},
  {id:'pc',name:'电脑',watts:180,circuit:'sockets',icon:'pc',note:'电脑与电视共用本例的插座回路。断开这一路，两台设备都会失电。'}
 ];
 const PRESETS={evening:['lighting','tv','fridge','hob','ac'],night:['lighting','fridge','ac'],away:['fridge']};
 const FAULTS={
  overload:{name:'过载实验',circuit:'kitchen',intro:'线路没走错，是这一路承担得太多。',protection:'过电流保护：MCB 或 RCBO',safety:'真实跳闸时先查原因，不要反复合闸，更不能随意换大额定电流的开关。',stages:[
   ['各个电器，正常工作','这里假设厨房回路原本处于正常负荷。普通插座、照明、空调和热水器各有自己的示例回路。','看厨房这一条线路'],
   ['更多负载，同时加入','模拟同时烧水、做饭，并假设总负荷已经超过这条回路的允许承载。过载保护通常有延时特性；本页不根据几台电器替真实住宅选型。','过载条件：仅为实验假设'],
   ['厨房回路，被保护切断','当动作条件满足，过电流保护切断这一回路。本例其他回路仍工作；真实是否越级跳闸，还与保护配合有关。','厨房断电 · 其他回路继续工作']
  ]},
  short:{name:'短路实验',circuit:'kitchen',intro:'电流遇到异常低阻路径，可能突然增大。',protection:'短路保护：MCB 或 RCBO',safety:'冒烟、焦味、破损或反复跳闸时停用相关设备，交由专业人员排查。',stages:[
   ['工作回路，按设计闭合','正常情况下，电流经过负载形成工作回路。电器把电能转换成热、光或机械能。','供电正常'],
   ['出现异常低阻连接','这里模拟设备内部火线与零线间出现异常低阻通路。短路电流受电源和回路阻抗限制，不是无限大。','异常低阻路径出现'],
   ['短路保护动作','满足动作条件时，断路器的短路保护快速切断故障回路。这与“多开了几台电器”的过载原因不同。','厨房回路断开']
  ]},
  leak:{name:'漏电实验',circuit:'water',intro:'比较经工作导体流入和返回的电流。',protection:'剩余电流保护：RCCB 或 RCBO',safety:'保护接地与剩余电流保护相互配合；有漏保不等于可以接触带电部位。',stages:[
   ['正常时，流入与返回相抵','以单相为例，L 与 N 同时穿过检测装置；正常时通过它们的电流矢量和接近零。PE 不作正常工作回流线。','工作导体电流平衡'],
   ['部分电流，走了其他路径','本例假设绝缘故障使电流经外壳和 PE 形成故障路径，检测到流入与返回不平衡。其他泄漏路径也可能触发剩余电流保护。','出现剩余电流'],
   ['剩余电流保护动作','达到相应动作条件后切断该回路。它并不覆盖所有触电方式，例如同时接触 L 与 N 时，电流可能依然平衡。','热水器回路断开']
  ]},
  contact:{name:'接触不良实验',circuit:'kitchen',intro:'有一种发热，开关未必发现得了。',protection:'普通过流 / 剩余电流保护可能不动作',safety:'插座异常发烫、变色、异响或焦味都值得停用排查，不要用“还没跳闸”判断安全。',stages:[
   ['连接可靠，电器工作','正常连接的接触电阻较小，连接处不应出现异常发热。','先看电水壶的连接处'],
   ['接触变差，局部温升','模拟插接处接触电阻增大。热可能集中在很小的位置；此时回路总电流不一定超过过流保护的动作条件。','局部发热 · 不一定过流'],
   ['仍然通电，不代表安全','若既未达到过流条件，也未出现足够的剩余电流，普通保护器可能不动作。本例保留通电状态，让你看见这项局限。','未跳闸 · 应停用并排查']
  ]}
 };
 function makeState(){return {view:'house',devices:Object.fromEntries(DEVICES.map(d=>[d.id,['lighting','tv','fridge','ac'].includes(d.id)])),circuits:Object.fromEntries(Object.keys(CIRCUITS).map(k=>[k,true])),main:true,wires:true,fault:'overload',step:0,plan:'lighting',lab:'loop',closed:true,wire:'all',mechanism:'rcbo',leaking:false,power:1000,hours:2,price:.6,paused:false};}
 function requested(s,id){if(s.view==='plan')return true;if(s.view!=='fault')return !!s.devices[id];return ['lighting','tv','fridge','hob','ac','heater','pc'].includes(id)||(id==='kettle'&&(s.fault==='contact'||(s.fault==='overload'&&s.step>=1)));}
 function closed(s,circuit){return !!s.main&&!!s.circuits[circuit]&&!(s.view==='fault'&&s.step===2&&s.fault!=='contact'&&FAULTS[s.fault].circuit===circuit);}
 function powered(s,id){const d=DEVICES.find(d=>d.id===id);return !!d&&requested(s,id)&&closed(s,d.circuit);}
 function loads(s){const result=Object.fromEntries(Object.keys(CIRCUITS).map(k=>[k,0]));for(const d of DEVICES)if(powered(s,d.id))result[d.circuit]+=d.watts;return result;}
 function total(s){return Object.values(loads(s)).reduce((a,b)=>a+b,0);}
 function energy(power,hours,price){if(![power,hours,price].every(Number.isFinite)||power<0||hours<0||hours>24||price<0)return null;const kwh=power/1000*hours;return {kwh,cost:kwh*price,current:power/220};}
 const api={CIRCUITS,DEVICES,PRESETS,FAULTS,makeState,requested,closed,powered,loads,total,energy};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ElectricityModel=api;
})(typeof window!=='undefined'?window:globalThis);

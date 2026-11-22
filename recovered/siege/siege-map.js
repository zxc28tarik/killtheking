/* Kill the King — S1 sole siege-castle map contract.
 * Isolated data only; not an alternative to October FFA or G5.4 source.
 * UMD for offline self-contained HTML + Node source tests.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegemap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='SIEGE_CASTLE_S1';
 const rect=(id,type,x,z,w,d,opts={})=>Object.freeze({
   id,type,x,z,w,d,y:opts.y??0,h:opts.h??0,
   solid:opts.solid??false,destructible:opts.destructible??false,
   team:opts.team??null,platform:opts.platform??false
 });
 const boxes=Object.freeze([
   // Castle in the north, attackers approach from z<0 (south).
   rect('south-wall-west','wall',-30,-40,44,5,{h:13,solid:true}),
   rect('south-wall-east','wall',30,-40,44,5,{h:13,solid:true}),
   rect('gate-main','gate',0,-40,16,5,{h:10,solid:true,destructible:true}),
   rect('west-wall','wall',-52,7.5,5,90,{h:13,solid:true}),
   rect('east-wall','wall',52,7.5,5,90,{h:13,solid:true}),
   rect('north-wall-west','wall',-30,55,44,5,{h:13,solid:true}),
   rect('north-wall-east','wall',30,55,44,5,{h:13,solid:true}),
   rect('north-wall-center','wall',0,55,16,5,{h:13,solid:true}),
   // Inner keep structure is solid, objective zone is outside its porch.
   rect('keep-west','keep-wall',-15.5,43,5,24,{h:15,solid:true}),
   rect('keep-east','keep-wall',15.5,43,5,24,{h:15,solid:true}),
   rect('keep-back','keep-wall',0,55,36,5,{h:15,solid:true}),
   rect('keep-roof','roof',0,43,36,24,{y:15,h:.6,platform:true}),
   rect('wall-walk-south-left','battlement',-30,-36,44,8,{y:10.5,h:.9,platform:true}),
   rect('wall-walk-south-right','battlement',30,-36,44,8,{y:10.5,h:.9,platform:true}),
   rect('wall-walk-west','battlement',-49,7.5,8,90,{y:10.5,h:.9,platform:true}),
   rect('wall-walk-east','battlement',49,7.5,8,90,{y:10.5,h:.9,platform:true}),
   rect('outer-shelter-west','cover',-37,-78,17,7,{h:3.2,solid:true}),
   rect('outer-shelter-east','cover',37,-78,17,7,{h:3.2,solid:true}),
   rect('outer-rock-west','cover',-66,-53,12,10,{h:4.2,solid:true}),
   rect('outer-rock-east','cover',66,-53,12,10,{h:4.2,solid:true})
 ]);
 const areas=Object.freeze({
   outside:Object.freeze({id:'outside',x:0,z:-78,w:190,d:78}),
   gate:Object.freeze({id:'gate',x:0,z:-40,w:17,d:12}),
   courtyard:Object.freeze({id:'courtyard',x:0,z:0,w:66,d:50}),
   keep:Object.freeze({id:'keep',x:0,z:31,w:23,d:14}),
   outerWest:Object.freeze({id:'outerWest',x:-55,z:-9,w:20,d:26}),
   outerEast:Object.freeze({id:'outerEast',x:55,z:-9,w:20,d:26}),
   rampartWest:Object.freeze({id:'rampartWest',x:-49,z:-9,w:14,d:25}),
   rampartEast:Object.freeze({id:'rampartEast',x:49,z:-9,w:14,d:25})
 });
 const lanes=Object.freeze({
   gate:Object.freeze({
     id:'gate',entry:Object.freeze([0,-55]),inside:Object.freeze([0,-30]),
     activatedBy:'GATE_DESTROYED',navOpen:false
   }),
   west:Object.freeze({
     id:'west',entry:Object.freeze([-56,-9]),inside:Object.freeze([-39,-8]),
     activatedBy:'LADDER_BUILT',navOpen:false
   }),
   east:Object.freeze({
     id:'east',entry:Object.freeze([56,-9]),inside:Object.freeze([39,-8]),
     activatedBy:'LADDER_BUILT',navOpen:false
   })
 });
 const spawns=Object.freeze({
   red:Object.freeze({
     sword:Object.freeze([-18,-102]),pike:Object.freeze([18,-106]),
     archer:Object.freeze([-37,-116]),musket:Object.freeze([37,-116]),
     commander:Object.freeze([0,-110])
   }),
   blue:Object.freeze({
     sword:Object.freeze([0,-17]),pike:Object.freeze([0,-29]),
     archer:Object.freeze([-35,-32]),musket:Object.freeze([35,-32]),
     commander:Object.freeze([0,28])
   })
 });
 const composition=Object.freeze({sword:20,pike:25,archer:15,musket:10});
 const spec=Object.freeze({
   version:VERSION,displayName:'Kuşatma Kalesi — İlk Senaryo',
   bounds:Object.freeze({minX:-132,maxX:132,minZ:-132,maxZ:84}),
   castle:Object.freeze({minX:-52,maxX:52,minZ:-42.5,maxZ:57.5}),
   boxes,areas,lanes,spawns,composition,
   teams:Object.freeze({red:'attacker',blue:'defender'}),
   objectiveOrder:Object.freeze(['entry','courtyard','keep']),
   // Provisional user-revisable S1 knobs. Never claim final balance.
   prototype:Object.freeze({
     gateHp:600,ladderBuildRequired:100,
     courtyardHoldSeconds:12,keepHoldSeconds:20,
     matchSeconds:900,
     soldierCountPerTeam:70
   })
 });
 function pointInRect(point,box){
   if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))
     return false;
   return Math.abs(point.x-box.x)<=box.w/2 &&
     Math.abs(point.z-box.z)<=box.d/2;
 }
 function validate(){
   const ids=new Set(),errors=[];
   for(const b of boxes){
     if(ids.has(b.id))errors.push('duplicate solid: '+b.id);ids.add(b.id);
     if(!['x','z','w','d','y','h'].every(k=>Number.isFinite(b[k]))||
         b.w<=0||b.d<=0||b.h<0)errors.push('invalid box '+b.id);
     if(b.solid&&!pointInRect({x:b.x,z:b.z},spec.boundsRect||{
       x:(spec.bounds.minX+spec.bounds.maxX)/2,
       z:(spec.bounds.minZ+spec.bounds.maxZ)/2,
       w:spec.bounds.maxX-spec.bounds.minX,
       d:spec.bounds.maxZ-spec.bounds.minZ
     }))errors.push('out of bounds: '+b.id);
   }
   for(const [side,positions] of Object.entries(spawns))
     for(const [role,p] of Object.entries(positions)){
       if(!p.every(Number.isFinite))errors.push('invalid spawn '+side+':'+role);
       if(boxes.some(b=>b.solid&&pointInRect({x:p[0],z:p[1]},b)))
         errors.push('spawn collides: '+side+':'+role);
     }
   if(Object.values(composition).reduce((a,b)=>a+b,0)!==
       spec.prototype.soldierCountPerTeam)
     errors.push('G5.4 composition not 70');
   if(Object.keys(lanes).length!==3)errors.push('exactly 3 breach routes required');
   return {ok:errors.length===0,errors,geometryCount:boxes.length};
 }
 return Object.freeze({VERSION,spec,validate,pointInRect});
});

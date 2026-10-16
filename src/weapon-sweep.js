/* Kill the King — animation-time melee contact traces.
 * Game-side adapter transforms virtual blade/shaft coordinates to world space;
 * the adapter must return the FIRST hit (including solid world geometry).
 * This is a collision proxy synchronized with attack animation, not a mesh-driven blade-tip bone.
 */
(function(root,factory){
    const api=factory();
    if(typeof module!=='undefined' && module.exports) module.exports=api;
    root.ArenaWeaponSweep=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
    'use strict';
    const EPS=1e-8;
    const DURATION=0.82/3.7;
    const ACTIVE_START=0.13, ACTIVE_END=0.89;
    function pose(kind,reach,side,progress){
        const p=Math.max(0,Math.min(1,progress));
        if(kind==='spear'){
            const extent=reach*(0.35+0.65*Math.pow(Math.sin(Math.PI*p),1.3));
            const dx=(side ? -0.06 : 0.06)*extent;
            return {x:dx,y:-0.22,z:-extent};
        }
        // Match the on-screen blade's rest and sweep: no lateral jump at start/end.
        const angle=(side ? 1 : -1)*(0.48-0.96*p)*Math.sin(Math.PI*p);
        const extension=reach*(0.75+0.12*Math.sin(Math.PI*p));
        return {x:Math.sin(angle)*extension,y:-0.18-0.08*Math.sin(Math.PI*p),z:-Math.cos(angle)*extension};
    }
    // A shared attack phase ties the collision proxy to the existing viewmodel.
    // No new meshes/materials; the sword's rendered tilt follows this phase.
    function visualPose(kind, side, progress) {
        const p=Math.max(0,Math.min(1,progress));
        const envelope=Math.sin(Math.PI*p);
        if (kind==='spear') return {rotationX:0,rotationZ:0,offsetZ:-envelope*0.72};
        const sampled=pose('sword',1,side,p);
        const angle=Math.atan2(sampled.x,-sampled.z);
        return {rotationX:-envelope*1.15,rotationZ:-angle*0.85,offsetZ:-envelope*0.25};
    }
    function begin(kind,reach,side=0){
        if(!['sword','spear'].includes(kind)||!Number.isFinite(reach)||reach<=0)throw Error('Invalid swing');
        return {kind,reach,side:side?1:0,elapsed:0,duration:DURATION,hitKeys:new Set(),resolved:false,finished:false};
    }
    // During slide-hops or fast turns, the fighter's world position can shift
    // independently of their local attack pose. Track both motions.
    function withinReach(origin, point, reach, padding=3) {
        if (!origin || !point) return false;
        const dx=point.x-origin.x, dz=point.z-origin.z;
        const bound=reach+padding;
        return dx*dx+dz*dz<=bound*bound && Math.abs(point.y-origin.y)<=bound+2;
    }
    function advance(swing,dt,castSegment,projectTip){
        if(!swing||swing.finished||swing.resolved||!(dt>0)||!Number.isFinite(dt))return null;
        if(typeof castSegment!=='function')throw Error('castSegment callback required');
        const prior=swing.elapsed/swing.duration;
        swing.elapsed=Math.min(swing.duration,swing.elapsed+dt);
        const after=swing.elapsed/swing.duration;
        const steps=Math.max(1,Math.ceil((after-prior)/0.065));
        for(let step=1;step<=steps;step++){
            const p0=prior+(after-prior)*(step-1)/steps;
            const p1=prior+(after-prior)*step/steps;
            if(p1<ACTIVE_START||p0>ACTIVE_END)continue;
            const t0=Math.max(ACTIVE_START,p0),t1=Math.min(ACTIVE_END,p1);
            if(t1<t0-EPS)continue;
            const tip0=pose(swing.kind,swing.reach,swing.side,t0);
            const tip1=pose(swing.kind,swing.reach,swing.side,t1);
            // Inter-frame world bridge protects high-speed player movement.
            // Snapshot the point by value; vector pools may be reused next tick.
            let worldBlocked=false;
            if (typeof projectTip === 'function') {
                const projected=projectTip(tip1);
                if (projected) {
                    const tipWorld={x:projected.x,y:projected.y,z:projected.z};
                    if (swing.previousWorldTip) {
                        const bridge=castSegment(swing.previousWorldTip,tipWorld,true);
                        if (bridge && bridge.kind==='world') worldBlocked=true;
                        if (bridge && !worldBlocked && (bridge.kind==='bot'||bridge.kind==='barrel')) {
                            const key=bridge.kind==='bot'?'bot:'+bridge.bot.id:'barrel:'+bridge.barrel.id;
                            if (!swing.hitKeys.has(key)) {
                                swing.hitKeys.add(key);
                                swing.resolved=true;
                                return bridge;
                            }
                        }
                    }
                    swing.previousWorldTip=tipWorld;
                }
            }
            if (worldBlocked) continue;
            const strikes=[
                [{x:0,y:-.1,z:0},tip1],
                [tip0,tip1]
            ];
            for(const [start,end] of strikes){
                const contact=castSegment(start,end,false);
                if(!contact||!['bot','barrel'].includes(contact.kind))continue;
                const key=contact.kind==='bot' ? 'bot:'+contact.bot.id : 'barrel:'+contact.barrel.id;
                if(swing.hitKeys.has(key))continue;
                swing.hitKeys.add(key);
                swing.resolved=true;
                return contact;
            }
        }
        if(swing.elapsed>=swing.duration-EPS)swing.finished=true;
        return null;
    }
    return {begin,advance,pose,visualPose,withinReach,DURATION,ACTIVE_START,ACTIVE_END};
});

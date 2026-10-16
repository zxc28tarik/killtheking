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
        const angle=(side ? 1 : -1)*(0.48-0.96*p);
        const extension=reach*(0.75+0.12*Math.sin(Math.PI*p));
        return {x:Math.sin(angle)*extension,y:-0.18-0.08*Math.sin(Math.PI*p),z:-Math.cos(angle)*extension};
    }
    function begin(kind,reach,side=0){
        if(!['sword','spear'].includes(kind)||!Number.isFinite(reach)||reach<=0)throw Error('Invalid swing');
        return {kind,reach,side:side?1:0,elapsed:0,duration:DURATION,hitKeys:new Set(),resolved:false,finished:false};
    }
    function advance(swing,dt,castSegment){
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
            const strikes=[
                [{x:0,y:-.1,z:0},tip1],
                [tip0,tip1]
            ];
            for(const [start,end] of strikes){
                const contact=castSegment(start,end);
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
    return {begin,advance,pose,DURATION,ACTIVE_START,ACTIVE_END};
});

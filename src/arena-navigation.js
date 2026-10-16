/*
 * Kill the King — geometry-driven ground/rampart navigation.
 * Independent of Three.js and the renderer. A* grid generated once from
 * existing level colliders and ramp extents. Movement checks the same geometry.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.ArenaNavigation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const EPS = 1e-6;
    const DISTANCES = [
        [-1,0,1],[1,0,1],[0,-1,1],[0,1,1],
        [-1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[1,1,Math.SQRT2]
    ];

    function createNavigator(colliders, ramps, config = {}) {
        const step = config.step || 2.5;
        const min = config.min == null ? -40 : config.min;
        const max = config.max == null ? 40 : config.max;
        const count = Math.floor((max - min) / step) + 1;
        const radius = config.radius == null ? 0.67 : config.radius;
        const clearance = config.clearance == null ? 2.65 : config.clearance;
        const maxStepHeight = config.maxStepHeight == null ? 1.8 : config.maxStepHeight;
        const level = config.upperLevel == null ? 7.4 : config.upperLevel;
        const upperEdge = config.upperEdge == null ? 38.75 : config.upperEdge;
        const bounds = colliders || [];
        const slopes = ramps || [];

        function rampAt(x, z) {
            for (const ramp of slopes) {
                if (x < ramp.minX - EPS || x > ramp.maxX + EPS ||
                    z < ramp.minZ - EPS || z > ramp.maxZ + EPS) continue;
                let factor = 0;
                if (ramp.dir === 'N') factor = (ramp.maxZ - z) / (ramp.maxZ - ramp.minZ);
                else if (ramp.dir === 'S') factor = (z - ramp.minZ) / (ramp.maxZ - ramp.minZ);
                else if (ramp.dir === 'W') factor = (ramp.maxX - x) / (ramp.maxX - ramp.minX);
                return ramp.startY + Math.max(0, Math.min(1, factor)) * (ramp.endY - ramp.startY);
            }
            return null;
        }

        function heightAt(x, z) {
            const sloped = rampAt(x, z);
            if (sloped !== null) return sloped;
            return Math.abs(x) >= upperEdge || Math.abs(z) >= upperEdge ? level : 0;
        }

        function walkableAt(x, z, y = heightAt(x, z)) {
            if (x < min - EPS || x > max + EPS || z < min - EPS || z > max + EPS) return false;
            for (const c of bounds) {
                if (x + radius > c.minX && x - radius < c.maxX &&
                    z + radius > c.minZ && z - radius < c.maxZ &&
                    y + clearance > c.minY + EPS && y < c.maxY - 0.12) return false;
            }
            return true;
        }

        // Intervening samples prevent tunneling through narrow obstacles.
        function clearSegment(a, b) {
            const distance = Math.hypot(b.x - a.x, b.z - a.z);
            const probes = Math.max(1, Math.ceil(distance / Math.min(0.75, step / 3)));
            let previousY = a.y == null ? heightAt(a.x, a.z) : a.y;
            if (!walkableAt(a.x, a.z, previousY)) return false;
            for (let n = 1; n <= probes; n++) {
                const t = n / probes;
                const x = a.x + (b.x - a.x) * t;
                const z = a.z + (b.z - a.z) * t;
                const y = heightAt(x, z);
                if (Math.abs(y - previousY) > maxStepHeight + EPS || !walkableAt(x, z, y)) return false;
                previousY = y;
            }
            const expectedY = b.y == null ? previousY : b.y;
            return Math.abs(previousY - expectedY) <= maxStepHeight + EPS;
        }

        const grid = Array.from({length: count * count}, (_, i) => {
            const ix = i % count, iz = Math.floor(i / count);
            const x = min + ix * step, z = min + iz * step;
            const y = heightAt(x, z);
            return {x,y,z,id:i,ix,iz,walkable:walkableAt(x,z,y)};
        });
        const links = grid.map(node => {
            if (!node.walkable) return [];
            const adjacent = [];
            for (const [dx,dz,cost] of DISTANCES) {
                const nx = node.ix + dx, nz = node.iz + dz;
                if (nx < 0 || nz < 0 || nx >= count || nz >= count) continue;
                const next = grid[nz * count + nx];
                if (next.walkable && Math.abs(node.y - next.y) <= maxStepHeight &&
                    clearSegment(node, next)) adjacent.push({id:next.id,cost:cost*step + Math.abs(node.y-next.y)*0.35});
            }
            return adjacent;
        });

        function nearest(position) {
            let best = null, bestDist = Infinity;
            for (const node of grid) {
                if (!node.walkable) continue;
                const dx = node.x-position.x, dz = node.z-position.z;
                const dy = node.y - (position.y == null ? heightAt(position.x,position.z) : position.y);
                const cost = dx*dx + dz*dz + dy*dy*3;
                if (cost < bestDist) { best=node; bestDist=cost; }
            }
            return best;
        }

        // Deterministic A*, bounded and only called at target changes/cooldown.
        function findPath(start, goal, maxNodes = 1400) {
            const a = nearest(start), b = nearest(goal);
            if (!a || !b) return [];
            if (a.id === b.id) return [{x:b.x,y:b.y,z:b.z}];
            const g = new Float64Array(grid.length).fill(Infinity);
            const parent = new Int32Array(grid.length).fill(-1);
            const closed = new Uint8Array(grid.length);
            const open = [a.id];
            g[a.id]=0;
            let expanded = 0;
            while(open.length && expanded < maxNodes) {
                let chosen=0, best=Infinity;
                for (let n=0;n<open.length;n++) {
                    const id=open[n], p=grid[id];
                    const h=Math.hypot(p.x-b.x,p.z-b.z)+Math.abs(p.y-b.y)*2;
                    const value=g[id]+h;
                    if(value<best) {best=value;chosen=n;}
                }
                const current=open.splice(chosen,1)[0];
                if (current===b.id) {
                    const path=[];
                    let id=current;
                    while(id!==-1 && path.length<=grid.length) {
                        const p=grid[id];path.push({x:p.x,y:p.y,z:p.z});
                        if (id===a.id) break;
                        id=parent[id];
                    }
                    path.reverse();
                    return path.slice(1);
                }
                if (closed[current]) continue;
                closed[current]=1;expanded++;
                for(const edge of links[current]) {
                    if(closed[edge.id])continue;
                    const score=g[current]+edge.cost;
                    if(score+EPS<g[edge.id]) {
                        g[edge.id]=score;parent[edge.id]=current;
                        if(!open.includes(edge.id))open.push(edge.id);
                    }
                }
            }
            return [];
        }

        function safeAdvance(from, direction, distance) {
            const countSteps = Math.max(1,Math.ceil(distance/0.55));
            let pos={x:from.x,y:from.y,z:from.z};
            for (let i=0;i<countSteps;i++) {
                const distanceStep=distance/countSteps;
                const nextX=pos.x+direction.x*distanceStep;
                const nextZ=pos.z+direction.z*distanceStep;
                const tryX={x:nextX,z:pos.z,y:heightAt(nextX,pos.z)};
                const tryZ={x:pos.x,z:nextZ,y:heightAt(pos.x,nextZ)};
                const combined={x:nextX,z:nextZ,y:heightAt(nextX,nextZ)};
                if(clearSegment(pos,combined))pos=combined;
                else if(clearSegment(pos,tryX))pos=tryX;
                else if(clearSegment(pos,tryZ))pos=tryZ;
                else break;
            }
            return pos;
        }

        return { heightAt, walkableAt, clearSegment, findPath, nearest, safeAdvance,
                 stats:{cells:grid.length,walkable:grid.filter(n=>n.walkable).length} };
    }

    return {createNavigator};
});

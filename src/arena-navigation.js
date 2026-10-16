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
        const level = config.upperLevel == null ? 7 : config.upperLevel;
        const upperEdge = config.upperEdge == null ? 38.75 : config.upperEdge;
        const bounds = colliders || [];
        const slopes = ramps || [];

        function rampAt(x, z) {
            for (const ramp of slopes) {
                if (x < ramp.minX - EPS || x > ramp.maxX + EPS ||
                    z < ramp.minZ - EPS || z > ramp.maxZ + EPS) continue;
                let factor = 0;
                if (ramp.dir === 'NN') factor = (ramp.maxZ - z) / (ramp.maxZ - ramp.minZ - 1.5);
                else if (ramp.dir === 'N') factor = (ramp.maxZ - z) / (ramp.maxZ - ramp.minZ);
                else if (ramp.dir === 'S') factor = (z - ramp.minZ) / (ramp.maxZ - ramp.minZ);
                else if (ramp.dir === 'W') factor = (ramp.maxX - x) / (ramp.maxX - ramp.minX);
                return ramp.startY + Math.max(0, Math.min(1, factor)) * (ramp.endY - ramp.startY);
            }
            return null;
        }

        function heightAt(x, z) {
            const sloped = rampAt(x, z);
            const wallSurface = Math.abs(x) >= upperEdge || Math.abs(z) >= upperEdge ? level : 0;
            return sloped === null ? wallSurface : Math.max(sloped, wallSurface);
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

        // Narrow ramp landings can fall between grid samples. Every added
        // link undergoes the same collider and height validation as normal movement.
        function connectRampLandings() {
            const baseCount = grid.length;
            const anchors = [];
            for (const ramp of slopes) {
                if (ramp.dir === 'S') {
                    const x = ramp.maxX - 2.75, z = ramp.maxZ;
                    anchors.push([{x,z:z-1},{x,z},{x:ramp.maxX-1.5,z},
                        {x:ramp.maxX-.25,z}]);
                } else if (ramp.dir === 'N') {
                    const x = ramp.minX + 2.75, z = ramp.minZ;
                    anchors.push([{x,z:z+1},{x,z},{x:ramp.minX+1.5,z},
                        {x:ramp.minX+.25,z}]);
                } else if (ramp.dir === 'W') {
                    const x = ramp.minX, z = ramp.maxZ;
                    anchors.push([{x:x+1,z:z-2.75},{x:x+.5,z:z-1.5},
                        {x,z:z-1.5},{x,z:z-.25}]);
                }
            }
            for (const chain of anchors) {
                let previous = null;
                for (const point of chain) {
                    const y = heightAt(point.x, point.z);
                    if (!walkableAt(point.x,point.z,y)) { previous = null; continue; }
                    const node = {x:point.x,y,z:point.z,id:grid.length,walkable:true};
                    grid.push(node);
                    links.push([]);
                    if (previous !== null && clearSegment(grid[previous],node)) {
                        const dist=Math.hypot(node.x-grid[previous].x,node.z-grid[previous].z);
                        links[previous].push({id:node.id,cost:dist});
                        links[node.id].push({id:previous,cost:dist});
                    }
                    previous=node.id;
                }
            }
            for (let a=baseCount;a<grid.length;a++) {
                const node=grid[a];
                for (let b=0;b<a;b++) {
                    const other=grid[b];
                    if (!other.walkable) continue;
                    const planar=Math.hypot(node.x-other.x,node.z-other.z);
                    if (planar<0.01 || planar>step*1.55 ||
                        Math.abs(node.y-other.y)>maxStepHeight ||
                        !clearSegment(node,other)) continue;
                    if (!links[a].some(edge=>edge.id===b)) {
                        const cost=planar+Math.abs(node.y-other.y)*.35;
                        links[a].push({id:b,cost});
                        links[b].push({id:a,cost});
                    }
                }
            }
        }
        connectRampLandings();

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

        // Binary-heap A*: explore complete connected castle routes efficiently.
        function findPath(start, goal, maxNodes = grid.length) {
            const a=nearest(start), b=nearest(goal);
            if(!a || !b)return [];
            if(a.id===b.id)return [{x:b.x,y:b.y,z:b.z}];
            const g=new Float64Array(grid.length).fill(Infinity);
            const parent=new Int32Array(grid.length).fill(-1);
            const closed=new Uint8Array(grid.length), heap=[];
            const heuristic = id => {
                const p=grid[id];
                return Math.hypot(p.x-b.x,p.z-b.z)+Math.abs(p.y-b.y)*.35;
            };
            function enqueue(id,cost) {
                const entry={id,cost,priority:cost+heuristic(id)};
                heap.push(entry);
                for(let i=heap.length-1;i>0;) {
                    const p=(i-1)>>1;
                    if(heap[p].priority<=heap[i].priority)break;
                    [heap[i],heap[p]]=[heap[p],heap[i]];i=p;
                }
            }
            function dequeue() {
                const first=heap[0],tail=heap.pop();
                if(heap.length) {
                    heap[0]=tail;
                    for(let i=0;;) {
                        const l=i*2+1,r=l+1;let best=i;
                        if(l<heap.length && heap[l].priority<heap[best].priority)best=l;
                        if(r<heap.length && heap[r].priority<heap[best].priority)best=r;
                        if(best===i)break;
                        [heap[i],heap[best]]=[heap[best],heap[i]];i=best;
                    }
                }
                return first;
            }
            g[a.id]=0;enqueue(a.id,0);
            let expanded=0;
            while(heap.length && expanded<maxNodes) {
                const entry=dequeue(),current=entry.id;
                if(closed[current] || entry.cost>g[current]+EPS)continue;
                if(current===b.id) {
                    const path=[];let id=current;
                    while(id!==-1 && path.length<=grid.length) {
                        const p=grid[id];path.push({x:p.x,y:p.y,z:p.z});
                        if(id===a.id)break;
                        id=parent[id];
                    }
                    path.reverse();return path.slice(1);
                }
                closed[current]=1;expanded++;
                for(const edge of links[current]) {
                    if(closed[edge.id])continue;
                    const cost=g[current]+edge.cost;
                    if(cost+EPS<g[edge.id]) {
                        g[edge.id]=cost;parent[edge.id]=current;
                        enqueue(edge.id,cost);
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

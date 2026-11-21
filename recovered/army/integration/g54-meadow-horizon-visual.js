/* MAP2-V13 — distant low-poly rolling hills; pure visual backdrop.
 * Builds only outside the playable/physical meadow perimeter.
 * No colliders, no terrain height overrides, no hit detection changes.
 */
const KTKMeadowHorizon=(function(){
 'use strict';
 const TAU=Math.PI*2;
 const fractal=t=>Math.sin(t*3.0+.7)*.38+
   Math.sin(t*7.0+2.2)*.22+Math.sin(t*13.0-1.6)*.13;
 function height(theta,ring){
   if(ring===0)return -8;
   const wave=fractal(theta);
   const distant=Math.max(0,Math.sin(theta*2.4-.6))*.28;
   const base=[-8,3,38,74,46][ring];
   const scale=[0,1,18,31,21][ring];
   return base+wave*scale+distant*scale;
 }
 function build(THREE,scene,spec){
   if(!THREE?.BufferGeometry||!THREE?.MeshStandardMaterial||
      !THREE?.Float32BufferAttribute||!scene?.add||
      !(spec?.half>0))throw Error('MAP2 3D scene and meadow spec required');
   const SEG=64,steps=4,inner=spec.half*1.085;
   const rings=[inner,inner+80,inner+180,inner+340,inner+550];
   const geom=new THREE.BufferGeometry();
   const pos=new Float32Array((SEG+1)*(steps+1)*3);
   const colors=new Float32Array(pos.length);
   const index=[];
   const pal=[
     [.39,.50,.32], // foreground olive grass
     [.46,.54,.36],
     [.44,.51,.38],
     [.39,.47,.39],
     [.43,.49,.43]
   ];
   for(let r=0;r<=steps;r++){
     for(let j=0;j<=SEG;j++){
       const theta=TAU*j/SEG;
       // Slight radial scallops prevent a perfectly round artificial border.
       const rad=rings[r]+(r===0?0:Math.sin(theta*5.5+1.2)*11);
       const y=height(theta,r);
       const i=r*(SEG+1)+j;
       pos[3*i]=Math.cos(theta)*rad;
       pos[3*i+1]=y;
       pos[3*i+2]=Math.sin(theta)*rad;
       const shade=1+Math.sin(theta*11.0+r)*.035;
       for(let c=0;c<3;c++)colors[3*i+c]=pal[r][c]*shade;
     }
   }
   for(let r=0;r<steps;r++)for(let j=0;j<SEG;j++){
     const a=r*(SEG+1)+j,b=a+1,c=(r+1)*(SEG+1)+j,d=c+1;
     index.push(a,b,c,b,d,c);
   }
   geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
   geom.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
   geom.setIndex(index);
   geom.computeVertexNormals();
   const mat=new THREE.MeshStandardMaterial({
     color:0xffffff,vertexColors:true,roughness:1,metalness:0,
     side:THREE.DoubleSide
   });
   const hills=new THREE.Mesh(geom,mat);
   hills.name='KTK_MAP2_DISTANT_ROLLING_HILLS_VISUAL_ONLY';
   hills.castShadow=false;hills.receiveShadow=true;
   hills.frustumCulled=false;
   scene.add(hills);
   return {
     mesh:hills,innerRadius:inner,outerRadius:rings[4],
     triangles:index.length/3,vertices:pos.length/3,
     dispose(){
       scene.remove(hills);geom.dispose();mat.dispose();
     }
   };
 }
 return Object.freeze({build});
})();

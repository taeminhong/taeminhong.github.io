import{n as y,e as v,B as u,g as M}from"./fullscreen-quad-a49f2f71.js";function O(n,o){const l=(n.bufferViews||[]).map(e=>{const s=n.buffers[e.buffer],t=new DataView(s.data,e.byteOffset||0,e.byteLength);switch(e.target){case 34962:case 34963:return o.addBufferObject(e.target,t);default:return t}}),f=(n.accessors||[]).map(e=>({buffer:l[e.bufferView],size:y(e.type),type:e.componentType,count:e.count,normalized:!!e.normalized,stride:v(n,e)||0,offset:e.byteOffset})),d=[],m=[0];for(const e of n.meshes||[]){for(const s of e.primitives){const t={};for(const c in s.attributes){const r=f[s.attributes[c]];console.assert(r.buffer instanceof u),t[c]=r}let a;s.indices!=null&&(console.assert(f[s.indices].buffer instanceof u),a=f[s.indices]);const i=s.mode??4;d.push(o.addMesh(e.name||"",i,t,a))}m.push(d.length)}const h=(n.nodes||[]).map(e=>o.addNode(e.name??""));for(let e=0;e<h.length;++e){const s=h[e],t=n.nodes[e];let a,i,c;t.matrix?{translation:a,rotation:i,scale:c}=M(t.matrix):(a=t.translation||[0,0,0],i=t.rotation||[0,0,0,1],c=t.scale||[1,1,1]),o.setScale(s,c),o.setTranslation(s,a),o.setRotation(s,i);for(const r of t.children||[])o.setParentNode(h[r],s);if(t.mesh!==void 0){const r=m[t.mesh],b=m[t.mesh+1];for(let p=r;p<b;++p)o.linkNodeMesh(s,d[p])}}}export{O as l};

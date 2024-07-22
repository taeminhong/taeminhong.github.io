var ae=Object.defineProperty;var oe=(e,t,n)=>t in e?ae(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var c=(e,t,n)=>(oe(e,typeof t!="symbol"?t+"":t,n),n);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{r as re,i as se,A as ie,T as ce,M as le,S as b,f as G,P as E,a as x,b as H,u as F,I as de,N as S,c as O,d as L,F as ue,e as me,B as g,n as fe,g as pe,h as he,j as N,V as ve,k as C,l as we,C as be,m as P,o as Me,p as _e,q as Ee,s as xe,t as Re,v as Te,w as D}from"./fullscreen-quad-e8458005.js";import{G as ye,L as Se,e as Fe,i as ge,R as Ne,s as De,a as Ce,b as Le,c as Ve,d as Ae,p as Be,f as ke,g as Ie}from"./prefiltered-env-map-5a5ec4cf.js";function Ue(e){return[parseInt(e.slice(1,3),16)/255,parseInt(e.slice(3,5),16)/255,parseInt(e.slice(5,7),16)/255]}function Ge(e){const n=Math.pow(e[0],2.2),a=Math.pow(e[1],2.2),o=Math.pow(e[2],2.2);return[n,a,o]}var He=`#version 300 es

in vec4 POSITION;
in vec2 TEXCOORD_0;
in vec3 NORMAL;

out vec3 v_position;
out vec2 v_texCoord;
out vec3 v_normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;
uniform mat3 inverseTranspose;

void main()
{
    mat4 mv = view * model;
    mat4 mvp = proj * mv;
    v_texCoord = TEXCOORD_0;
    v_normal = mat3(view) * inverseTranspose * NORMAL;
    v_position = (mv * POSITION).xyz;
    gl_Position = mvp * POSITION;
}`,Oe=`#version 300 es

precision highp float;

in vec3 v_position;
in vec2 v_texCoord;
in vec3 v_normal;

layout (location = 0) out vec3 f_position;
layout (location = 1) out vec3 f_normal;
layout (location = 2) out vec4 f_baseColor;
layout (location = 3) out vec4 f_metallic;

uniform sampler2D normalMap;
uniform sampler2D baseColorMap;
uniform vec4 baseColorValue;
uniform bool flipNormalGreen;
uniform float normalMapStrength;
uniform float metallic;
uniform float roughness;

mat3 cotangentFrame(vec3 normal, vec3 pos, vec2 uv)
{
    vec2 dUdx = dFdx(uv);
    vec2 dUdy = dFdy(uv);
    vec3 dPdx = dFdx(pos);
    vec3 dPdy = dFdy(pos);
    vec3 X = cross(dPdy, normal);
    vec3 Y = cross(normal, dPdx);
    vec3 T = X * dUdx.x + Y * dUdy.x;
    vec3 B = X * dUdx.y + Y * dUdy.y;
    float len = max(length(T), length(B));
    float invLen = (len == 0.0) ? 0.0 : (1.0 / len);
    return mat3(T * invLen, B * invLen, normal);
}

void main()
{
    vec3 normal = normalize(v_normal);
    mat3 TBN = cotangentFrame(normal, v_position, v_texCoord);
    vec3 rgbNormal = normalize(texture(normalMap, v_texCoord).rgb * 2.0 - 1.0);
    if (flipNormalGreen)
        rgbNormal.g = -rgbNormal.g;
    vec3 perturbedNormal = TBN * rgbNormal;

    f_normal = normalize(mix(normal, perturbedNormal, normalMapStrength));
    f_baseColor = texture(baseColorMap, v_texCoord) * baseColorValue;
    f_position = v_position;
    f_metallic = vec4(metallic, 0, 0, max(0.01, roughness));
}`,Pe=`#version 300 es

precision highp float;

#ifndef _BRDF_
#define _BRDF_

#ifndef _MATH_
#define _MATH_

const float pi = 3.14159265358979;

vec3 gramSchmidt(vec3 a, vec3 b)
{
    return b - a * dot(a, b);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

#endif

const float dielectricF0 = 0.04;

vec3 F0(vec3 baseColor, float metallic)
{
    return mix(vec3(dielectricF0), baseColor, metallic);
}

vec3 diffuseColor(vec3 baseColor, float metallic)
{
    return baseColor * (1.0 - metallic);
}

vec3 Fd(vec3 baseColor, float metallic)
{
    return diffuseColor(baseColor, metallic) / pi;
}

float DistribGGX(float a, float NoH)
{
    float NoH2 = NoH * NoH;
    float k = a / (NoH2 * a * a - NoH2 + 1.0);
    return 1.0 / pi * k * k;
}

float VisibilitySmith(float a, float NoV, float NoL)
{
    return 0.5 / mix(2.0 * NoL * NoV, (NoL + NoV), a);
}

vec3 FresnelSchlick(vec3 f0, float VoH)
{
    const vec3 f90 = vec3(1.0);
    return mix(f0, f90, pow(1.0 - VoH, 5.0));
}

vec3 FresnelSchlickRoughness(vec3 f0, float NoV, float roughness)
{
    vec3 f90 = max(vec3(1.0 - roughness), f0);
    return mix(f0, f90, pow(1.0 - NoV, 5.0));
}

vec3 brdf(vec3 normal, vec3 baseColor, float metallic, float roughness, vec3 view,
          vec3 light, vec3 lightColor, float lightIntensity, float lightAttenuation)
{
    vec3 h = normalize(view + light);
    float NoV = max(0.0001, dot(normal, view));
    float NoH = saturate(dot(normal, h));
    float VoH = saturate(dot(view, h));
    float NoL = saturate(dot(normal, light));
    float a = roughness * roughness;
    float D = DistribGGX(a, NoH);
    float V = VisibilitySmith(a, NoV, NoL);
    vec3 F = FresnelSchlick(F0(baseColor, metallic), VoH);
    vec3 Kd = vec3(1) - F;
    vec3 color = Fd(baseColor, metallic) * Kd + D * V * F;

    return color * lightColor * lightIntensity * lightAttenuation * NoL;
}

#endif

in vec2 v_texCoord;

out vec4 f_color;

uniform mat4 inverseView;
uniform sampler2D positionMap;
uniform sampler2D normalMap;
uniform sampler2D baseColorMap;
uniform sampler2D metallicMap;
uniform sampler2D occlusionMap;
uniform samplerCube prefilteredEnvMap;
uniform samplerCube irradianceEnvMap;
uniform sampler2D brdfLutMap;
uniform float maxLevel;

void main()
{
    vec3 normal = texture(normalMap, v_texCoord).xyz;
    vec3 baseColor = texture(baseColorMap, v_texCoord).rgb;
    float occlusion = texture(occlusionMap, v_texCoord).r;
    vec4 metallicRoughness = texture(metallicMap, v_texCoord);
    float metallic = metallicRoughness.x;
    float roughness = metallicRoughness.w;
    vec3 position = texture(positionMap, v_texCoord).xyz;
    vec3 view = -normalize(position);
    float NoV = saturate(dot(normal, view));
    vec2 dfg = texture(brdfLutMap, vec2(NoV, roughness)).rg;
    vec3 light = (inverseView * vec4(reflect(-view, normal), 0)).xyz;
    float lod = roughness * maxLevel;
    vec3 sampledColor = textureLod(prefilteredEnvMap, light, lod).rgb;
    vec3 f0 = F0(baseColor, metallic);

    vec3 normalWorld = (inverseView * vec4(normal, 0)).xyz;
    vec3 diffuseIrradiance = texture(irradianceEnvMap, normalWorld).rgb;

    vec3 Fs = sampledColor * (f0 * dfg.x + vec3(dfg.y));
    vec3 Fd = diffuseColor(baseColor, metallic) * diffuseIrradiance;
    vec3 Kd = clamp(1.0 - FresnelSchlickRoughness(f0, NoV, roughness), 0.8, 1.0);
    f_color.rgb = (Fs + Fd * Kd) * occlusion;
    f_color.a = 1.0;
}`;function X(e,t,n){const a=Me(_e(),t);e.setUniformValues({model:t,inverseTranspose:a,view:n.view,proj:n.proj,viewPos:n.position,viewPosition:n.position,inverseView:n.inverseView},!0)}function Xe(e,t,n,a,o){X(o,n,a),o.use(e);for(let i=0;i<t.subMeshes.length;++i)t.draw(e,i)}class ze{constructor(t,n,a,o){c(this,"mesh");c(this,"material");c(this,"node");this.node=n,this.mesh=a,this.material=o}draw(t,n){Xe(t,this.mesh,this.node.globalMatrix,n,this.material)}}class je{constructor(t,n,a){c(this,"mesh");c(this,"material");this.material=a,this.mesh=n}draw(t,n){const a=C();Ee(a,n.inverseView);for(let i=12;i<15;++i)a[i]=0;const o=xe(C(),a,n.inverseProj);this.material.setUniformValues({inverseViewProj:o}),this.material.use(t),this.mesh.draw(t,0)}}class qe{constructor(){c(this,"nodes");c(this,"cameras");c(this,"drawers");c(this,"materials");c(this,"indirectLightMaterial");this.nodes=[],this.drawers=[],this.cameras=[],this.materials=[]}update(t,n){this.nodes.forEach(a=>a.preUpdate(n)),this.nodes.forEach(a=>a.update(t)),this.cameras.forEach(a=>a.update(t)),this.cameras.sort((a,o)=>a.order-o.order),this.drawers.sort((a,o)=>a.material.queue-o.material.queue)}}function Ye(e,t,n){const a=O(e,t);return new L(e,a,n)}class $e{constructor(t){c(this,"gl");c(this,"scene");c(this,"inputSystem");c(this,"standardVertexModel");c(this,"quadMesh");c(this,"toneMap");c(this,"brdfLutMap");c(this,"whiteTexture");c(this,"gBuffer");c(this,"laBuffer");c(this,"take");c(this,"callbackId");const n=new ve([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),a=P.createQuad("quad"),o=Ye(t,a,n),i=new ye(t,t.drawingBufferWidth,t.drawingBufferHeight),d=new Se(t,i),u=new b(t,t.VERTEX_SHADER,G),r=new b(t,t.FRAGMENT_SHADER,Fe),f=new E(t,"exposure",n,u,r),h=new x(t,f,{name:"toneMap"}),s=new b(t,t.FRAGMENT_SHADER,ge),l=new E(t,"integrateBRDF",n,u,s),m=new x(t,l),v=new H(t,t.TEXTURE_2D,1,t.RGBA8,32,32),M=new Uint8Array(32*32*4);for(let w=0;w<M.length;++w)M[w]=255;v.bind(t).subImage2D(t.TEXTURE_2D,0,0,0,32,32,t.RGBA,t.UNSIGNED_BYTE,M).parameteri(t.TEXTURE_MIN_FILTER,t.NEAREST).parameteri(t.TEXTURE_MAG_FILTER,t.NEAREST),h.setUniformValues({exposure:1.5,hdrBuffer:d.colorTexture});const p=new Ne(t,{cube:!1,width:256,height:256,colorInternalFormat0:t.RGBA16F});F(p,t,w=>{t.viewport(0,0,p.width,p.height),t.clear(t.COLOR_BUFFER_BIT),m.use(t),o.draw(t,0)}),this.gl=t,this.scene=new qe,this.inputSystem=new de,this.take=0,this.standardVertexModel=n,this.quadMesh=o,this.toneMap=h,this.gBuffer=i,this.laBuffer=d,this.callbackId=0,this.brdfLutMap=p.colorTextures[0],this.whiteTexture=v}requestRender(){this.callbackId===0&&(this.callbackId=requestAnimationFrame(t=>{this.scene.update(++this.take,0),this.render(),this.callbackId=0}))}render(){const t=this.gl,n=this.scene.drawers;let a=0,o=0;t.clearColor(0,0,0,1),t.clearDepth(1),t.depthMask(!0),t.enable(t.DEPTH_TEST),t.enable(t.CULL_FACE),t.depthFunc(t.LEQUAL),F(this.gBuffer,t,i=>{for(o=a;o<n.length&&!(n[o].material.queue>1);++o);t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT);for(const d of this.scene.cameras){const u=this.gBuffer.width,r=this.gBuffer.height,f=u/r,h=d.prepare(f);t.viewport(0,0,u,r);for(let s=a;s<o;++s)n[s].draw(t,h)}a=o}),F(this.laBuffer,t,i=>{for(o=a;o<n.length&&!(n[o].material.queue>5);++o);for(const d of this.scene.cameras){const u=this.gBuffer.width,r=this.gBuffer.height,f=u/r,h=d.prepare(f);t.viewport(0,0,u,r),i.startBlend(),this.scene.indirectLightMaterial&&(X(this.scene.indirectLightMaterial,C(),h),this.scene.indirectLightMaterial.use(t),this.quadMesh.draw(t,0)),i.endBlend();for(let s=a;s<o;++s)n[s].draw(t,h)}}),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),this.toneMap.use(t),this.quadMesh.draw(t,0),this.inputSystem.reset()}}function _(e,t){return e.push(t),t}class We{constructor(t,n,a){c(this,"rotator");c(this,"translator");c(this,"inputSystem");this.rotator=t,this.translator=n,this.inputSystem=a}preUpdate(t,n){const o=this.rotator.trs.rotation;o[0]-=this.inputSystem.dragDelta[1]*.5,o[1]-=this.inputSystem.dragDelta[0]*.5;const i=.1,d=this.translator.trs.translation;d[2]=we(d[2]+this.inputSystem.scrollDelta*i,1,100)}}function U(e){return e instanceof Error?e:new Error(String(e))}async function Qe(e,t,n){const a=n.scene,o=_(a.nodes,new S(null,"center")),i=_(a.nodes,new S(o,"camera")),d=new Re(Te.deg(45),.1,1e3);_(a.cameras,new be(i,0,d)),i.trs.translation[2]=3,o.addComponent(new We(o,i,n.inputSystem));const u=O(e,P.createBackdrop("backdrop")),r=new L(e,u,n.standardVertexModel),f=new b(e,e.VERTEX_SHADER,De),h=new b(e,e.FRAGMENT_SHADER,Ce),s=new E(e,"skybox",n.standardVertexModel,f,h),l=new x(e,s,{name:"ocean",queue:5});_(a.drawers,new je(e,r,l));const m=new b(e,e.VERTEX_SHADER,G),v=new b(e,e.FRAGMENT_SHADER,Pe),M=new E(e,"indirectLight",n.standardVertexModel,m,v),p=new x(e,M,{queue:2});a.indirectLightMaterial=p,p.setUniformValues({positionMap:n.gBuffer.positionTexture,normalMap:n.gBuffer.normalTexture,metallicMap:n.gBuffer.metallicTexture,baseColorMap:n.gBuffer.baseColorTexture,brdfLutMap:n.brdfLutMap,occlusionMap:n.whiteTexture});const w=new b(e,e.VERTEX_SHADER,He),R=new b(e,e.FRAGMENT_SHADER,Oe),y=new E(e,"pbr",n.standardVertexModel,w,R),V=_(a.materials,new x(e,y,{queue:1}));V.setUniformValues({baseColorMap:n.whiteTexture});const T=new H(e,e.TEXTURE_CUBE_MAP,11,e.SRGB8_ALPHA8,1024,1024),A=await t.loadImageBitmapCube(["/skybox/ocean/right.jpg","/skybox/ocean/left.jpg","/skybox/ocean/top.jpg","/skybox/ocean/bottom.jpg","/skybox/ocean/front.jpg","/skybox/ocean/back.jpg"],{resizeWidth:T.width,resizeHeight:T.height,resizeQuality:"medium"});T.bind(e).subImageCube(0,0,0,e.RGBA,e.UNSIGNED_BYTE,A).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).generateMipmap(),A.forEach(ne=>ne.close()),l.setUniformValues({skybox:T});const z=new b(e,e.VERTEX_SHADER,Le),j=new b(e,e.FRAGMENT_SHADER,Ve),q=new E(e,"irradiance",n.standardVertexModel,z,j),Y=new x(e,q,{uniforms:{envMap:T}}),B=new ue(e,e.FRAMEBUFFER),$=Ae(e,128,Y,n.quadMesh,B);p.setUniformValues({irradianceEnvMap:$});const W=new b(e,e.VERTEX_SHADER,Be),Q=new b(e,e.FRAGMENT_SHADER,ke),K=new E(e,"prefiltered",n.standardVertexModel,W,Q),J=new x(e,K,{uniforms:{envMap:T}}),k=6,Z=Ie(e,k,3,J,n.quadMesh,B);p.setUniformValues({maxLevel:k,prefilteredEnvMap:Z});const I=_(a.nodes,new S(null,"sphere"));I.trs.translation=me(-.2,-.8,0);const ee=new URL("/Duck.gltf",window.location.toString()),te=await t.loadGltf(ee.href);Je(e,n.scene,I,te,e.STATIC_DRAW,V)}function Ke(e){const t=2*(e[3]*e[0]+e[1]*e[2]),n=1-2*(e[0]*e[0]+e[1]*e[1]),a=D(Math.atan2(t,n)),o=Math.sqrt(1+2*(e[3]*e[1]-e[0]*e[2])),i=Math.sqrt(1-2*(e[3]*e[1]-e[0]*e[2])),d=D(2*Math.atan2(o,i)-Math.PI/2),u=2*(e[3]*e[2]+e[0]*e[1]),r=1-2*(e[1]*e[1]+e[2]*e[2]),f=D(Math.atan2(u,r));return[a,d,f]}function Je(e,t,n,a,o,i){const d=(a.bufferViews||[]).map(s=>{const l=a.buffers[s.buffer],m=new DataView(l.data,s.byteOffset||0,s.byteLength);switch(s.target){case e.ARRAY_BUFFER:case e.ELEMENT_ARRAY_BUFFER:const v=new g(e,s.target);return v.bind(e).data(m,o),v;default:return m}}),u=(a.accessors||[]).map(s=>({buffer:d[s.bufferView],size:fe(s.type),type:s.componentType,count:s.count,normalized:!!s.normalized,stride:pe(a,s)||0,offset:s.byteOffset})),r=[],f=[0];for(const s of a.meshes||[]){for(const l of s.primitives){const m={};for(const w in l.attributes){const R=u[l.attributes[w]];console.assert(R.buffer instanceof g),m[w]=R}let v;l.indices!=null&&(console.assert(u[l.indices].buffer instanceof g),v=u[l.indices]);const M=l.mode??e.TRIANGLES,p={name:s.name||"",attributes:m,drawMode:M,indices:v};r.push(new L(e,p,i.program.vertexModel))}f.push(r.length)}const h=(a.nodes||[]).map(s=>_(t.nodes,new S(n,s.name??"")));for(let s=0;s<h.length;++s){const l=h[s],m=a.nodes[s];let v,M,p;m.matrix?{translation:v,rotation:M,scale:p}=he(m.matrix):(v=m.translation||[0,0,0],M=m.rotation||[0,0,0,1],p=m.scale||[1,1,1]),N(l.trs.scale,p),N(l.trs.translation,v),N(l.trs.rotation,Ke(M));for(const w of m.children||[])h[w].parent=l;if(m.mesh!==void 0){const w=f[m.mesh],R=f[m.mesh+1];for(let y=w;y<R;++y)t.drawers.push(new ze(e,l,r[y],i))}}}function Ze(e){switch(e){case"range":return Number;case"color":return t=>Ge(Ue(t));default:return t=>0}}try{const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");re(e,1024);const t=se(e),n=Array.from(document.querySelectorAll(".inspector input")),a=new ie,o=new $e(t),i=new ce(r=>{switch(r.touchDrags.length){case 1:o.inputSystem.drag(r.touchDrags[0].delta[0],r.touchDrags[0].delta[1]);break}o.requestRender()}),d=new le(r=>{o.inputSystem.drag(r.delta[0],r.delta[1]),o.requestRender()});e.addEventListener("mousedown",r=>d.mouseDown(r)),document.addEventListener("mousemove",r=>d.mouseMove(r)),document.addEventListener("mouseup",r=>d.mouseUp(r)),e.addEventListener("touchstart",r=>i.touchStart(r)),document.addEventListener("touchend",r=>i.touchEnd(r)),document.addEventListener("touchmove",r=>i.touchMove(r)),Qe(t,a,o).then(()=>{o.requestRender()}).catch(r=>{console.error(U(r))});const u=o.scene.materials.find(r=>r.name==="pbr");for(const r of n){const f=Ze(r.type);r.addEventListener("input",h=>{u.setUniformValues({[r.id]:f(r.value)}),o.requestRender()}),u.setUniformValues({[r.id]:f(r.value)})}o.requestRender()}catch(e){const t=document.body,n=U(e).message,a=document.createElement("p");a.classList.add("error"),a.append(n),t.prepend(a)}

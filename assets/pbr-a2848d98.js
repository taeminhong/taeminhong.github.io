var ae=Object.defineProperty;var oe=(e,t,n)=>t in e?ae(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var c=(e,t,n)=>(oe(e,typeof t!="symbol"?t+"":t,n),n);import"./modulepreload-polyfill-3cfb730f.js";import{A as re,P as se,S as b,f as G,a as E,M as x,T as H,u as S,N as y,b as O,c as V,F as ie,d as ce,B as D,n as le,e as de,g as ue,h as F,V as fe,i as C,j as me,C as pe,k as P,l as he,m as ve,o as we,p as be,q as Me,r as _e,s as N}from"./fullscreen-quad-a49f2f71.js";import{G as Ee,L as xe,e as ge,i as Re,R as Te,s as ye,a as Se,b as De,c as Fe,d as Ne,p as Ce,f as Ve,g as Le}from"./prefiltered-env-map-5383c484.js";function Ae(e){return[parseInt(e.slice(1,3),16)/255,parseInt(e.slice(3,5),16)/255,parseInt(e.slice(5,7),16)/255]}function Be(e){const n=Math.pow(e[0],2.2),a=Math.pow(e[1],2.2),o=Math.pow(e[2],2.2);return[n,a,o]}var ke=`#version 300 es

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
}`,Ie=`#version 300 es

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
}`,Ue=`#version 300 es

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
}`;function X(e,t,n){const a=he(ve(),t);e.setUniformValues({model:t,inverseTranspose:a,view:n.view,proj:n.proj,viewPos:n.position,viewPosition:n.position,inverseView:n.inverseView},!0)}function Ge(e,t,n,a,o){X(o,n,a),o.use(e);for(let i=0;i<t.subMeshes.length;++i)t.draw(e,i)}class He{constructor(t,n,a,o){c(this,"mesh");c(this,"material");c(this,"node");this.node=n,this.mesh=a,this.material=o}draw(t,n){Ge(t,this.mesh,this.node.globalMatrix,n,this.material)}}class Oe{constructor(t,n,a){c(this,"mesh");c(this,"material");this.material=a,this.mesh=n}draw(t,n){const a=C();we(a,n.inverseView);for(let i=12;i<15;++i)a[i]=0;const o=be(C(),a,n.inverseProj);this.material.setUniformValues({inverseViewProj:o}),this.material.use(t),this.mesh.draw(t,0)}}class Pe{constructor(){c(this,"nodes");c(this,"cameras");c(this,"drawers");c(this,"materials");c(this,"indirectLightMaterial");this.nodes=[],this.drawers=[],this.cameras=[],this.materials=[]}update(t,n){this.nodes.forEach(a=>a.preUpdate(n)),this.nodes.forEach(a=>a.update(t)),this.cameras.forEach(a=>a.update(t)),this.cameras.sort((a,o)=>a.order-o.order),this.drawers.sort((a,o)=>a.material.queue-o.material.queue)}}function Xe(e,t,n){const a=O(e,t);return new V(e,a,n)}class ze{constructor(t){c(this,"gl");c(this,"scene");c(this,"inputSystem");c(this,"standardVertexModel");c(this,"quadMesh");c(this,"toneMap");c(this,"brdfLutMap");c(this,"whiteTexture");c(this,"gBuffer");c(this,"laBuffer");c(this,"take");c(this,"callbackId");const n=new fe([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),a=P.createQuad("quad"),o=Xe(t,a,n),i=new Ee(t,t.drawingBufferWidth,t.drawingBufferHeight),u=new xe(t,i),r=new b(t,t.VERTEX_SHADER,G),f=new b(t,t.FRAGMENT_SHADER,ge),p=new E(t,"exposure",n,r,f),v=new x(t,p,{name:"toneMap"}),s=new b(t,t.FRAGMENT_SHADER,Re),l=new E(t,"integrateBRDF",n,r,s),d=new x(t,l),h=new H(t,t.TEXTURE_2D,1,t.RGBA8,32,32),M=new Uint8Array(32*32*4);for(let w=0;w<M.length;++w)M[w]=255;h.bind(t).subImage2D(t.TEXTURE_2D,0,0,0,32,32,t.RGBA,t.UNSIGNED_BYTE,M).parameteri(t.TEXTURE_MIN_FILTER,t.NEAREST).parameteri(t.TEXTURE_MAG_FILTER,t.NEAREST),v.setUniformValues({exposure:1.5,hdrBuffer:u.colorTexture});const m=new Te(t,{cube:!1,width:256,height:256,colorInternalFormat0:t.RGBA16F});S(m,t,w=>{t.viewport(0,0,m.width,m.height),t.clear(t.COLOR_BUFFER_BIT),d.use(t),o.draw(t,0)}),this.gl=t,this.scene=new Pe,this.inputSystem=new je,this.take=0,this.standardVertexModel=n,this.quadMesh=o,this.toneMap=v,this.gBuffer=i,this.laBuffer=u,this.callbackId=0,this.brdfLutMap=m.colorTextures[0],this.whiteTexture=h}requestRender(){this.callbackId===0&&(this.callbackId=requestAnimationFrame(t=>{this.scene.update(++this.take,0),this.render(),this.callbackId=0}))}render(){const t=this.gl,n=this.scene.drawers;let a=0,o=0;t.clearColor(0,0,0,1),t.clearDepth(1),t.depthMask(!0),t.enable(t.DEPTH_TEST),t.enable(t.CULL_FACE),t.depthFunc(t.LEQUAL),S(this.gBuffer,t,i=>{for(o=a;o<n.length&&!(n[o].material.queue>1);++o);t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT);for(const u of this.scene.cameras){const r=this.gBuffer.width,f=this.gBuffer.height,p=r/f,v=u.prepare(p);t.viewport(0,0,r,f);for(let s=a;s<o;++s)n[s].draw(t,v)}a=o}),S(this.laBuffer,t,i=>{for(o=a;o<n.length&&!(n[o].material.queue>5);++o);for(const u of this.scene.cameras){const r=this.gBuffer.width,f=this.gBuffer.height,p=r/f,v=u.prepare(p);t.viewport(0,0,r,f),i.startBlend(),this.scene.indirectLightMaterial&&(X(this.scene.indirectLightMaterial,C(),v),this.scene.indirectLightMaterial.use(t),this.quadMesh.draw(t,0)),i.endBlend();for(let s=a;s<o;++s)n[s].draw(t,v)}}),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),this.toneMap.use(t),this.quadMesh.draw(t,0),this.inputSystem.reset()}}function _(e,t){return e.push(t),t}class je{constructor(){c(this,"scrollDelta");c(this,"dragging");c(this,"dragDelta");this.scrollDelta=0,this.dragging=!1,this.dragDelta=[0,0]}reset(){this.scrollDelta=0,this.dragDelta[0]=0,this.dragDelta[1]=0}scroll(t){this.scrollDelta+=t}startDrag(){this.dragging=!0}endDrag(){this.dragging=!1}drag(t,n){this.dragging&&(this.dragDelta[0]+=t,this.dragDelta[1]+=n)}}class We{constructor(t,n,a){c(this,"rotator");c(this,"translator");c(this,"inputSystem");this.rotator=t,this.translator=n,this.inputSystem=a}preUpdate(t,n){const o=this.rotator.trs.rotation;o[0]-=this.inputSystem.dragDelta[1]*.5,o[1]-=this.inputSystem.dragDelta[0]*.5;const i=.1,u=this.translator.trs.translation;u[2]=me(u[2]+this.inputSystem.scrollDelta*i,1,100)}}function $e(){const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");const t=e.getContext("webgl2");if(!t)throw new Error("This browser does not support WebGL2");let n=t;for(const a of["EXT_color_buffer_float","OES_texture_float_linear"])if(!n.getExtension(a))throw new Error(`This browser does not support extension: ${a}`);return e.width=e.clientWidth,e.height=e.clientHeight,n}function U(e){return e instanceof Error?e:new Error(String(e))}async function Ye(e,t,n){const a=n.scene,o=_(a.nodes,new y(null,"center")),i=_(a.nodes,new y(o,"camera")),u=new Me(_e.deg(45),.1,1e3);_(a.cameras,new pe(i,0,u)),i.trs.translation[2]=3,o.addComponent(new We(o,i,n.inputSystem));const r=O(e,P.createBackdrop("backdrop")),f=new V(e,r,n.standardVertexModel),p=new b(e,e.VERTEX_SHADER,ye),v=new b(e,e.FRAGMENT_SHADER,Se),s=new E(e,"skybox",n.standardVertexModel,p,v),l=new x(e,s,{name:"ocean",queue:5});_(a.drawers,new Oe(e,f,l));const d=new b(e,e.VERTEX_SHADER,G),h=new b(e,e.FRAGMENT_SHADER,Ue),M=new E(e,"indirectLight",n.standardVertexModel,d,h),m=new x(e,M,{queue:2});a.indirectLightMaterial=m,m.setUniformValues({positionMap:n.gBuffer.positionTexture,normalMap:n.gBuffer.normalTexture,metallicMap:n.gBuffer.metallicTexture,baseColorMap:n.gBuffer.baseColorTexture,brdfLutMap:n.brdfLutMap,occlusionMap:n.whiteTexture});const w=new b(e,e.VERTEX_SHADER,ke),g=new b(e,e.FRAGMENT_SHADER,Ie),T=new E(e,"pbr",n.standardVertexModel,w,g),L=_(a.materials,new x(e,T,{queue:1}));L.setUniformValues({baseColorMap:n.whiteTexture});const R=new H(e,e.TEXTURE_CUBE_MAP,11,e.SRGB8_ALPHA8,1024,1024),A=await t.loadImageBitmapCube(["/skybox/ocean/right.jpg","/skybox/ocean/left.jpg","/skybox/ocean/top.jpg","/skybox/ocean/bottom.jpg","/skybox/ocean/front.jpg","/skybox/ocean/back.jpg"],{resizeWidth:R.width,resizeHeight:R.height,resizeQuality:"medium"});R.bind(e).subImageCube(0,0,0,e.RGBA,e.UNSIGNED_BYTE,A).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).generateMipmap(),A.forEach(ne=>ne.close()),l.setUniformValues({skybox:R});const z=new b(e,e.VERTEX_SHADER,De),j=new b(e,e.FRAGMENT_SHADER,Fe),W=new E(e,"irradiance",n.standardVertexModel,z,j),$=new x(e,W,{uniforms:{envMap:R}}),B=new ie(e,e.FRAMEBUFFER),Y=Ne(e,128,$,n.quadMesh,B);m.setUniformValues({irradianceEnvMap:Y});const q=new b(e,e.VERTEX_SHADER,Ce),Q=new b(e,e.FRAGMENT_SHADER,Ve),K=new E(e,"prefiltered",n.standardVertexModel,q,Q),J=new x(e,K,{uniforms:{envMap:R}}),k=6,Z=Le(e,k,3,J,n.quadMesh,B);m.setUniformValues({maxLevel:k,prefilteredEnvMap:Z});const I=_(a.nodes,new y(null,"sphere"));I.trs.translation=ce(-.2,-.8,0);const ee=new URL("/Duck.gltf",window.location.toString()),te=await t.loadGltf(ee.href);Qe(e,n.scene,I,te,e.STATIC_DRAW,L)}function qe(e){const t=2*(e[3]*e[0]+e[1]*e[2]),n=1-2*(e[0]*e[0]+e[1]*e[1]),a=N(Math.atan2(t,n)),o=Math.sqrt(1+2*(e[3]*e[1]-e[0]*e[2])),i=Math.sqrt(1-2*(e[3]*e[1]-e[0]*e[2])),u=N(2*Math.atan2(o,i)-Math.PI/2),r=2*(e[3]*e[2]+e[0]*e[1]),f=1-2*(e[1]*e[1]+e[2]*e[2]),p=N(Math.atan2(r,f));return[a,u,p]}function Qe(e,t,n,a,o,i){const u=(a.bufferViews||[]).map(s=>{const l=a.buffers[s.buffer],d=new DataView(l.data,s.byteOffset||0,s.byteLength);switch(s.target){case e.ARRAY_BUFFER:case e.ELEMENT_ARRAY_BUFFER:const h=new D(e,s.target);return h.bind(e).data(d,o),h;default:return d}}),r=(a.accessors||[]).map(s=>({buffer:u[s.bufferView],size:le(s.type),type:s.componentType,count:s.count,normalized:!!s.normalized,stride:de(a,s)||0,offset:s.byteOffset})),f=[],p=[0];for(const s of a.meshes||[]){for(const l of s.primitives){const d={};for(const w in l.attributes){const g=r[l.attributes[w]];console.assert(g.buffer instanceof D),d[w]=g}let h;l.indices!=null&&(console.assert(r[l.indices].buffer instanceof D),h=r[l.indices]);const M=l.mode??e.TRIANGLES,m={name:s.name||"",attributes:d,drawMode:M,indices:h};f.push(new V(e,m,i.program.vertexModel))}p.push(f.length)}const v=(a.nodes||[]).map(s=>_(t.nodes,new y(n,s.name??"")));for(let s=0;s<v.length;++s){const l=v[s],d=a.nodes[s];let h,M,m;d.matrix?{translation:h,rotation:M,scale:m}=ue(d.matrix):(h=d.translation||[0,0,0],M=d.rotation||[0,0,0,1],m=d.scale||[1,1,1]),F(l.trs.scale,m),F(l.trs.translation,h),F(l.trs.rotation,qe(M));for(const w of d.children||[])v[w].parent=l;if(d.mesh!==void 0){const w=p[d.mesh],g=p[d.mesh+1];for(let T=w;T<g;++T)t.drawers.push(new He(e,l,f[T],i))}}}function Ke(e){switch(e){case"range":return Number;case"color":return t=>Be(Ae(t));default:return t=>0}}try{const e=$e(),t=Array.from(document.querySelectorAll(".inspector input")),n=new re,a=new ze(e),o=e.canvas,i=new se(r=>{r.done?a.inputSystem.endDrag():(r.count===0&&a.inputSystem.startDrag(),a.inputSystem.drag(r.delta[0],r.delta[1])),a.requestRender()});o.addEventListener("pointerdown",r=>i.pointerDown(r)),document.addEventListener("pointermove",r=>i.pointerMove(r)),document.addEventListener("pointerup",r=>i.pointerUp(r)),Ye(e,n,a).then(()=>{a.requestRender()}).catch(r=>{console.error(U(r))});const u=a.scene.materials.find(r=>r.name==="pbr");for(const r of t){const f=Ke(r.type);r.addEventListener("input",p=>{u.setUniformValues({[r.id]:f(r.value)}),a.requestRender()}),u.setUniformValues({[r.id]:f(r.value)})}a.requestRender()}catch(e){const t=document.body,n=U(e).message,a=document.createElement("p");a.classList.add("error"),a.append(n),t.prepend(a)}

var te=Object.defineProperty;var ne=(t,e,n)=>e in t?te(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var d=(t,e,n)=>(ne(t,typeof e!="symbol"?e+"":e,n),n);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{r as ae,i as re,A as oe,T as se,s as D,p as U,M as ie,h as P,F as I,b as N,u as L,S as x,f as G,P as p,a as M,I as ce,N as k,C as le,c as H,d as q,v as S,q as _,m as de,O as ue,l as fe,Q as me,g as he,V as pe,G as ve,j as Ee,k as X,n as be,o as Me}from"./fullscreen-quad-ac64eabb.js";import{e as we,i as _e,R as Te,d as xe,f as Re,g as Fe,h as De,s as Se,a as Ne,p as Ae,b as ye,c as Ce}from"./prefiltered-env-map-b5c0fb4d.js";import{s as Le,h as ke}from"./color-c46a20f7.js";import{p as Ve}from"./pbr-forward-8429c5c5.js";import{p as ge}from"./pbr-forward-depth-peel-d5c5426d.js";const Ue={air:1,alcohol:1.36,beer:1.345,crystal:2,diamond:2.418,emerald:1.56,glass:1.5,gold:.47,ice:1.309,lens:1.41,pearl:1.53,plastic:1.46,teflon:1.35,water:1.325};var Be=`#version 300 es

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

float sq(float x)
{
    return x * x;
}

#endif

const float dielectricF0 = 0.04;

float F0(float ior)
{
    return sq(ior - 1.0) / sq(ior + 1.0);
}

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

float FresnelSchlick(float f0, float VoH)
{
    float f90 = 1.0;
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

in vec3 v_position;
in vec2 v_texCoord;
in vec3 v_normal;

out vec4 f_color;

uniform sampler2D normalMap;
uniform sampler2D baseColorMap;
uniform vec4 baseColorValue;
uniform bool flipNormalGreen;
uniform bool flipNormal;
uniform bool flatShading;
uniform float normalMapStrength;
uniform float metallicFactor;
uniform float roughnessFactor;
uniform float occlusionFactor;
uniform sampler2D metallicRoughnessMap;
uniform sampler2D occlusionMap;
uniform samplerCube prefilteredEnvMap;
uniform samplerCube irradianceEnvMap;
uniform sampler2D brdfLutMap;
uniform float maxLevel;
uniform mat4 inverseView;
uniform float alphaCutoff;
uniform float ior;
uniform vec3 attenuationColor;
uniform float attenuationDistance;
uniform sampler2D thicknessMap;
uniform float thicknessFactor;

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
    vec3 normal;

    if (flatShading) {
        vec3 dx = dFdx(v_position);
        vec3 dy = dFdy(v_position);
        normal = normalize(cross(dx, dy));
    } else {
        normal = normalize(v_normal);
        mat3 TBN = cotangentFrame(normal, v_position, v_texCoord);
        vec3 rgbNormal = normalize(texture(normalMap, v_texCoord).rgb * 2.0 - 1.0);
        if (flipNormalGreen)
            rgbNormal.g = -rgbNormal.g;
        vec3 perturbedNormal = TBN * rgbNormal;
        normal = normalize(mix(normal, perturbedNormal, normalMapStrength));
    }

    if (flipNormal) {
        normal = -normal;
    }

    vec2 metallicRoughness = texture(metallicRoughnessMap, v_texCoord).bg;
    float metallic = metallicFactor * metallicRoughness.x;
    float roughness = max(0.01, roughnessFactor * metallicRoughness.y);

    float occlusion = saturate(1.0 - occlusionFactor * (1.0 - texture(occlusionMap, v_texCoord).r));
    vec3 position = v_position;
    vec3 view = -normalize(position);
    float NoV = saturate(dot(normal, view));
    vec2 dfg = texture(brdfLutMap, vec2(NoV, roughness)).rg;
    vec3 light = (inverseView * vec4(reflect(-view, normal), 0)).xyz;
    float lod = roughness * maxLevel;
    vec3 sampledColor = textureLod(prefilteredEnvMap, light, lod).rgb;
    float f0 = F0(ior);
    float F = FresnelSchlick(f0, NoV);

    vec3 reflectDir = reflect(-view, normal);
    vec3 reflectWorld = (inverseView * vec4(reflectDir, 0.0)).xyz;
    vec3 reflectedColor = textureLod(prefilteredEnvMap, reflectWorld, 0.0).rgb;

    float eta = 1.0 / ior;
    vec3 refractDir = refract(-view, normal, eta);
    vec3 refractWorld = (inverseView * vec4(refractDir, 0.0)).xyz;
    vec3 refractedColor = textureLod(prefilteredEnvMap, refractWorld, 0.0).rgb;

    float thickness = texture(thicknessMap, v_texCoord).r * thicknessFactor;
    
    vec3 attenuation = exp((attenuationColor - vec3(1)) / attenuationDistance * thickness);
    refractedColor *= attenuation;

    vec3 color = refractedColor * (1.0 - F) + reflectedColor * F;

    f_color.rgb = color;
}`;function Pe(t,e){const n=t.queue*2+(t.doubleSided?1:0),o=e.queue*2+(e.doubleSided?1:0);return n-o}class Ie{constructor(){d(this,"nodes");d(this,"cameras");d(this,"drawers");d(this,"materials");d(this,"indirectLightMaterial");this.nodes=[],this.drawers=[],this.cameras=[],this.materials=[]}update(e,n){this.nodes.forEach(o=>o.preUpdate(n)),this.nodes.forEach(o=>o.update(e)),this.nodes.forEach(o=>o.postUpdate()),this.cameras.forEach(o=>o.update(e)),this.cameras.sort((o,a)=>o.order-a.order),this.drawers.sort((o,a)=>Pe(o.material,a.material))}}function Ge(t,e,n){const o=H(t,e);return new q(t,o,n)}class He{constructor(e){d(this,"gl");d(this,"scene");d(this,"inputSystem");d(this,"standardVertexModel");d(this,"quadMesh");d(this,"toneMap");d(this,"brdfLutMap");d(this,"whiteTexture");d(this,"framebufferWidth");d(this,"framebufferHeight");d(this,"framebuffer");d(this,"take");d(this,"callbackId");const n=new pe([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),o=X.createQuad("quad"),a=Ge(e,o,n),s=new I(e,e.FRAMEBUFFER),c=e.drawingBufferWidth,r=e.drawingBufferHeight,i=new N(e,e.TEXTURE_2D,1,e.RGBA16F,c,r);i.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const l=new N(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,c,r);l.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),L(s,e,h=>{h.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,i,0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,l,0).checkStatus(F=>{if(F!=e.FRAMEBUFFER_COMPLETE)throw new ve(F||e.getError())})});const u=new x(e,e.VERTEX_SHADER,G),f=new x(e,e.FRAGMENT_SHADER,we),v=new p(e,"exposure",n,u,f),E=new M(v,{name:"toneMap"}),A=new x(e,e.FRAGMENT_SHADER,_e),y=new p(e,"integrateBRDF",n,u,A),R=new M(y),m=new N(e,e.TEXTURE_2D,1,e.RGBA8,32,32),w=new Uint8Array(32*32*4);for(let h=0;h<w.length;++h)w[h]=255;m.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,w).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST),E.setUniformValues({exposure:1.5,hdrBuffer:i});const b=new Te(e,{cube:!1,width:256,height:256,colorInternalFormat0:e.RGBA16F});L(b,e,h=>{e.viewport(0,0,b.width,b.height),e.clear(e.COLOR_BUFFER_BIT),R.use(e),a.draw(e,0)}),this.gl=e,this.scene=new Ie,this.inputSystem=new ce,this.take=0,this.standardVertexModel=n,this.quadMesh=a,this.toneMap=E,this.framebufferWidth=c,this.framebufferHeight=r,this.framebuffer=s,this.callbackId=0,this.brdfLutMap=b.colorTextures[0],this.whiteTexture=m}requestRender(){this.callbackId===0&&(this.callbackId=requestAnimationFrame(e=>{this.scene.update(++this.take,0),this.render(),this.callbackId=0}))}render(){const e=this.gl,n=this.scene.drawers,o=(s,c,r)=>{const i=s.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),l=s.prepare(i.aspectRatio);e.viewport(i.x,i.y,i.w,i.h);for(let u=c;u<r;++u)if(n[u].layer&s.cullMask){const f=n[u].material;f.setUniformValues({flipNormal:!1},!0),n[u].draw(e,l),f.doubleSided&&(e.cullFace(e.FRONT),f.setUniformValues({flipNormal:!0},!0),n[u].draw(e,l),e.cullFace(e.BACK))}};e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.enable(e.CULL_FACE),e.cullFace(e.BACK);const a=[];for(let s=0;s<10;++s)a[s]=0;for(const s of n)a[s.material.queue]++;for(let s=1;s<a.length;++s)a[s]+=a[s-1];a.unshift(0),console.assert(a[10]===n.length),L(this.framebuffer,e,s=>{e.clearBufferfv(e.COLOR,0,[.05,.05,.05,1]),e.clearBufferfv(e.DEPTH,0,[1]);let c=a[3],r=a[4];if(c<r)for(const i of this.scene.cameras)o(i,c,r);c=a[4],r=a[5];for(const i of this.scene.cameras)o(i,c,r);if(c=a[7],r=a[8],c<r){e.disable(e.DEPTH_TEST);for(const i of this.scene.cameras)o(i,c,r);e.enable(e.DEPTH_TEST)}}),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.toneMap.use(e),this.quadMesh.draw(e,0),this.inputSystem.reset()}}function T(t,e){return t.push(e),e}function B(t){return t instanceof Error?t:new Error(String(t))}async function qe(t,e,n){const o=n.scene,a=T(o.nodes,new k(null,"center"));a.trs.rotation.setEuler([0,180,0]);const s=T(o.nodes,new k(a,"camera"));s.trs.translation[2]=4,a.addComponent(new le(a,s,n.inputSystem,1,5));const c=new be(Me.deg(45),.1,1e3);T(o.cameras,new Ee(s,0,c));const r=H(t,X.createBackdrop("backdrop"));new q(t,r,n.standardVertexModel);const i=S(t,Se),l=_(t,Ne),u=new p(t,"skybox",n.standardVertexModel,i,l),f=new M(u,{name:"ocean",queue:4});S(t,G);const v=S(t,Ve);_(t,Ae);const E=_(t,ge),A=_(t,Be),y=new p(t,"pbr",n.standardVertexModel,v,A);new p(t,"pbrDepthPeeling",n.standardVertexModel,v,E);const R=await e.loadImageBitmapCube(["/skybox/ocean/right.jpg","/skybox/ocean/left.jpg","/skybox/ocean/top.jpg","/skybox/ocean/bottom.jpg","/skybox/ocean/front.jpg","/skybox/ocean/back.jpg"]),m=new N(t,t.TEXTURE_CUBE_MAP,11,t.SRGB8_ALPHA8,1024,1024);m.bind(t).subImageCube(0,0,0,t.RGBA,t.UNSIGNED_BYTE,R).parameteri(t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR).parameteri(t.TEXTURE_MAG_FILTER,t.LINEAR).generateMipmap(),R.forEach(ee=>ee.close()),f.setUniformValues({skybox:m});const w=S(t,ye),b=_(t,Ce),h=new p(t,"irradiance",n.standardVertexModel,w,b),F=new M(h,{uniforms:{envMap:m}}),V=new I(t,t.FRAMEBUFFER),O=xe(t,128,F,n.quadMesh,V),W=new x(t,t.VERTEX_SHADER,Re),z=new x(t,t.FRAGMENT_SHADER,Fe),j=new p(t,"prefiltered",n.standardVertexModel,W,z),Y=new M(j,{uniforms:{envMap:m}}),g=6,$=De(t,g,3,Y,n.quadMesh,V);f.setUniformValues({skybox:m,offset:[0,0,1]}),o.drawers.push(new de(t,n.quadMesh,f));const K=T(o.materials,new M(y,{name:"standard",queue:3,quiet:!0,uniforms:{baseColorMap:n.whiteTexture,brdfLutMap:n.brdfLutMap,irradianceEnvMap:O,maxLevel:g,prefilteredEnvMap:$,baseColorValue:[0,0,0,1],occulsionFactor:1,roughnessFactor:.5,metallicFactor:0,metallicRoughnessMap:n.whiteTexture,occlusionMap:n.whiteTexture,ior:Ue.glass}})),C=T(o.nodes,new k(null,"gltf"));ue(C.trs.translation,0,-.4,0);const Q=new URL("/DragonAttenuation/DragonAttenuation.gltf",window.location.toString()),J=await e.loadGltf(Q.href,!0),Z=new Oe(n,C,K);return fe(J,Z),{animator:C.components.find(Xe)}}function Xe(t){return t instanceof me}class Oe extends he{constructor(n,o,a){super(n.gl,a.program,o,n.gl.STATIC_DRAW);d(this,"scene");d(this,"standardMaterial");this.scene=n.scene,this.standardMaterial=a}finish(){this.scene.nodes=this.scene.nodes.concat(this.nodes),this.scene.materials=this.scene.materials.concat(this.ourMaterials),super.finish()}addMaterial(n){const o=super.addMaterial(n),a=this.ourMaterials[o];return a.doubleSided=!!n.doubleSided,o}createMaterial(){return this.standardMaterial.clone()}linkNodeMesh(n,o,a,s){super.linkNodeMesh(n,o,a,s);let c;a!==void 0?c=this.ourMaterials[a]:c=this.standardMaterial.clone();const r=new P(this.gl,this.nodes[n],this.meshes[o],c);this.scene.drawers.push(r)}}function We(t){switch(t){case"range":return Number;case"color":return e=>Le(ke(e));default:return e=>0}}try{let t=function(r){r.preventDefault(),a.inputSystem.scroll(r.deltaY),a.requestRender()};const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");ae(e,1024);const n=re(e),o=new oe,a=new He(n),s=new se(r=>{switch(r.touchDrags.length){case 1:{const i=r.touchDrags[0];a.inputSystem.drag(i.delta[0],i.delta[1]);break}case 2:{const i=r.touchDrags[0],l=r.touchDrags[1],u=D(i.currentPos,i.delta),f=D(l.currentPos,l.delta),v=U(D(u,f)),E=U(D(i.currentPos,l.currentPos));a.inputSystem.scroll(v-E);break}}a.requestRender()}),c=new ie(r=>{a.inputSystem.drag(r.delta[0],r.delta[1]),a.requestRender()});e.addEventListener("wheel",t,{passive:!1}),e.addEventListener("mousedown",r=>c.mouseDown(r)),document.addEventListener("mousemove",r=>c.mouseMove(r)),document.addEventListener("mouseup",r=>c.mouseUp(r)),e.addEventListener("touchstart",r=>s.touchStart(r)),document.addEventListener("touchend",r=>s.touchEnd(r)),document.addEventListener("touchmove",r=>s.touchMove(r)),async function(){try{await qe(n,o,a);const r=Array.from(document.querySelectorAll(".inspector input")),i=a.scene.drawers.find(l=>{var u;return l instanceof P&&((u=l.node)==null?void 0:u.name)==="Dragon"});for(const l of r){const u=We(l.type);l.addEventListener("input",f=>{i.material.setUniformValues({[l.id]:u(l.value)}),a.requestRender()}),i.material.setUniformValues({[l.id]:u(l.value)})}a.requestRender()}catch(r){console.error(B(r))}}()}catch(t){const e=document.body,n=B(t).message,o=document.createElement("pre");o.classList.add("error"),o.append(n),e.prepend(o)}

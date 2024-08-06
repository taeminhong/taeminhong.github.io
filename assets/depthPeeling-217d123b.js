var fe=Object.defineProperty;var ue=(t,e,r)=>e in t?fe(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var c=(t,e,r)=>(ue(t,typeof e!="symbol"?e+"":e,r),r);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{r as he,i as me,A as pe,T as Ee,x as A,y as z,M as ve,F as I,b as R,u as w,S as C,f as Y,P as p,a as E,z as D,I as Te,N,c as K,d as O,D as S,e as be,B as _e,j as g,G as Z,V as we,k as Re,C as W,l as Q,q as Me,s as xe,t as H,v as Pe,w as De}from"./fullscreen-quad-8f42921c.js";import{e as Ce,i as ye,R as Fe,f as Ae,g as Se,h as Ne,j as Le,s as Be,a as Ue,p as Ve,b as ke,c as ge,d as He}from"./prefiltered-env-map-20191d79.js";import{l as Ie}from"./gltf-loader-e69350d8.js";var Oe=`#version 300 es

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

uniform sampler2D depthPeelReference;
uniform float depthBias;
uniform vec2 depthPeelScreenSize;
uniform sampler2D normalMap;
uniform sampler2D baseColorMap;
uniform vec4 baseColorValue;
uniform bool flipNormalGreen;
uniform bool flipNormal;
uniform float normalMapStrength;
uniform float metallic;
uniform float roughness;
uniform samplerCube prefilteredEnvMap;
uniform samplerCube irradianceEnvMap;
uniform sampler2D brdfLutMap;
uniform float maxLevel;
uniform mat4 inverseView;
uniform mat4 inverseProj;

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

float unprojectZ(mat4 inverseProj, vec3 fragCoord)
{
    vec4 v = inverseProj * vec4(fragCoord * 2.0 - 1.0, 1);
    return v.z / v.w;
}

void main()
{
    float depth = texture(depthPeelReference, gl_FragCoord.xy / depthPeelScreenSize).r;
    float z = unprojectZ(inverseProj, gl_FragCoord.xyz);
    float ref = unprojectZ(inverseProj, vec3(gl_FragCoord.xy, depth));
    if (z + depthBias >= ref)
        discard;

    vec3 normal = normalize(v_normal);
    mat3 TBN = cotangentFrame(normal, v_position, v_texCoord);
    vec3 rgbNormal = normalize(texture(normalMap, v_texCoord).rgb * 2.0 - 1.0);
    if (flipNormalGreen)
        rgbNormal.g = -rgbNormal.g;
    vec3 perturbedNormal = TBN * rgbNormal;

    normal = normalize(mix(normal, perturbedNormal, normalMapStrength));
    if (flipNormal)
        normal = -normal;
    vec4 baseColor = texture(baseColorMap, v_texCoord) * baseColorValue;
    float r = max(0.01, roughness);

    float occlusion = 1.0;
    vec3 position = v_position;
    vec3 view = -normalize(position);
    float NoV = saturate(dot(normal, view));
    vec2 dfg = texture(brdfLutMap, vec2(NoV, r)).rg;
    vec3 light = (inverseView * vec4(reflect(-view, normal), 0)).xyz;
    float lod = r * maxLevel;
    vec3 sampledColor = textureLod(prefilteredEnvMap, light, lod).rgb;
    vec3 f0 = F0(baseColor.rgb, metallic);

    vec3 normalWorld = (inverseView * vec4(normal, 0)).xyz;
    vec3 diffuseIrradiance = texture(irradianceEnvMap, normalWorld).rgb;

    vec3 Fs = sampledColor * (f0 * dfg.x + vec3(dfg.y));
    vec3 Fd = diffuseColor(baseColor.rgb, metallic) * diffuseIrradiance;
    vec3 Kd = clamp(1.0 - FresnelSchlickRoughness(f0, NoV, r), 0.8, 1.0);
    f_color.rgb = (Fs + Fd * Kd) * occlusion;
    f_color.a = baseColor.a;
}`,Ge=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D layer0;
uniform sampler2D layer1;
uniform sampler2D layer2;
uniform sampler2D layer3;

vec4 blendBackward(vec4 front, vec4 back)
{
    return vec4(
        front.rgb + front.a * back.a * back.rgb,
        front.a * (1.0 - back.a)
    );
}

void main()
{
    vec4 color0 = texture(layer0, v_texCoord);
    vec4 color1 = texture(layer1, v_texCoord);
    vec4 color2 = texture(layer2, v_texCoord);
    vec4 color3 = texture(layer3, v_texCoord);

    vec4 merge = blendBackward(vec4(0, 0, 0, 1), color0);
    merge = blendBackward(merge, color1);
    merge = blendBackward(merge, color2);
    merge = blendBackward(merge, color3);

    f_color = merge;
}`;function Xe(t,e,r){const n=Pe(De(),e);t.setUniformValues({model:e,inverseTranspose:n,view:r.view,proj:r.proj,viewPos:r.position,viewPosition:r.position,inverseView:r.inverseView,inverseProj:r.inverseProj},!0)}function je(t,e,r,n,a){Xe(a,r,n),a.use(t);for(let i=0;i<e.subMeshes.length;++i)e.draw(t,i)}class q{constructor(e,r,n,a,i=1){c(this,"mesh");c(this,"material");c(this,"node");c(this,"layer");this.node=r,this.mesh=n,this.material=a,this.layer=i}draw(e,r){je(e,this.mesh,this.node.globalMatrix,r,this.material)}}class ze{constructor(){c(this,"nodes");c(this,"cameras");c(this,"drawers");c(this,"materials");c(this,"indirectLightMaterial");this.nodes=[],this.drawers=[],this.cameras=[],this.materials=[]}update(e,r){this.nodes.forEach(n=>n.preUpdate(r)),this.nodes.forEach(n=>n.update(e)),this.cameras.forEach(n=>n.update(e)),this.cameras.sort((n,a)=>n.order-a.order),this.drawers.sort((n,a)=>n.material.queue-a.material.queue)}}function We(t,e,r){const n=K(t,e);return new O(t,n,r)}class qe{constructor(e,r,n,a){c(this,"binder");c(this,"colorBuffers");c(this,"depthBuffers");const i=r.bind(e);i.texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,a[1],0),e.clearBufferfv(e.DEPTH,0,[0]),this.binder=i,this.colorBuffers=n,this.depthBuffers=a}unbind(){this.binder.unbind()}layer(e){if(e<0||e>=this.colorBuffers.length)throw new RangeError(`invalid layer index [0, ${this.colorBuffers.length}): ${e}`);const r=this.binder.gl;return this.binder.texture2D(r.COLOR_ATTACHMENT0,r.TEXTURE_2D,this.colorBuffers[e],0).texture2D(r.DEPTH_ATTACHMENT,r.TEXTURE_2D,this.depthBuffers[e%2],0),this.depthBuffers[(e+1)%2]}}class $e{constructor(e,r,n,a,i){c(this,"width");c(this,"height");c(this,"framebuffer");c(this,"colorBuffers");c(this,"depthBuffers");c(this,"material");if(r<1)throw new RangeError(`There must be at least one layer in DepthPeeler, but given ${r}`);const s=[];for(let d=0;d<2;++d){const f=new R(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,n,a);f.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),s.push(f)}const o=[];for(let d=0;d<r;++d){const f=new R(e,e.TEXTURE_2D,1,e.RGBA8,n,a);f.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),o.push(f)}const l=new I(e,e.FRAMEBUFFER);w(l,e,d=>{d.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o[0],0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,s[0],0).drawBuffers(e.COLOR_ATTACHMENT0).checkStatus(f=>{if(f!=e.FRAMEBUFFER_COMPLETE)throw new Z(e,f||e.getError())})}),i.setUniformValues({layer0:o[0],layer1:o[1],layer2:o[2],layer3:o[3]}),this.framebuffer=l,this.depthBuffers=s,this.colorBuffers=o,this.width=n,this.height=a,this.material=i}bind(e){return new qe(e,this.framebuffer,this.colorBuffers,this.depthBuffers)}blend(e,r){this.material.use(e),r.draw(e,0)}get length(){return this.colorBuffers.length}}class Ye{constructor(e){c(this,"gl");c(this,"scene");c(this,"inputSystem");c(this,"standardVertexModel");c(this,"quadMesh");c(this,"toneMap");c(this,"brdfLutMap");c(this,"whiteTexture");c(this,"framebufferWidth");c(this,"framebufferHeight");c(this,"depthPeeler");c(this,"framebuffer");c(this,"take");c(this,"callbackId");const r=new we([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),n=Q.createQuad("quad"),a=We(e,n,r),i=new I(e,e.FRAMEBUFFER),s=e.drawingBufferWidth,o=e.drawingBufferHeight,l=new R(e,e.TEXTURE_2D,1,e.RGBA16F,s,o);l.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const d=new R(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,s,o);d.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),w(i,e,h=>{h.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,l,0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,d,0).checkStatus(x=>{if(x!=e.FRAMEBUFFER_COMPLETE)throw new Z(e,x||e.getError())})});const f=new C(e,e.VERTEX_SHADER,Y),v=new C(e,e.FRAGMENT_SHADER,Ce),u=new p(e,"exposure",r,f,v),b=new E(e,u,{name:"toneMap"}),y=new C(e,e.FRAGMENT_SHADER,ye),L=new p(e,"integrateBRDF",r,f,y),B=new E(e,L),F=new R(e,e.TEXTURE_2D,1,e.RGBA8,32,32),M=new Uint8Array(32*32*4);for(let h=0;h<M.length;++h)M[h]=255;F.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,M).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST),b.setUniformValues({exposure:1.5,hdrBuffer:l});const T=new Fe(e,{cube:!1,width:256,height:256,colorInternalFormat0:e.RGBA16F});w(T,e,h=>{e.viewport(0,0,T.width,T.height),e.clear(e.COLOR_BUFFER_BIT),B.use(e),a.draw(e,0)});const _=D(e,Ge),U=new p(e,"merge",r,f,_),V=new E(e,U),k=new $e(e,4,s,o,V);this.gl=e,this.scene=new ze,this.inputSystem=new Te,this.take=0,this.standardVertexModel=r,this.quadMesh=a,this.toneMap=b,this.framebufferWidth=s,this.framebufferHeight=o,this.framebuffer=i,this.callbackId=0,this.brdfLutMap=T.colorTextures[0],this.whiteTexture=F,this.depthPeeler=k}requestRender(){this.callbackId===0&&(this.callbackId=requestAnimationFrame(e=>{this.scene.update(++this.take,0),this.render(),this.callbackId=0}))}render(){const e=this.gl,r=this.scene.drawers;let n=0,a=0;e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.enable(e.CULL_FACE),e.cullFace(e.BACK),w(this.framebuffer,e,i=>{n=P(r,a,s=>s.material.queue>=3,r.length),a=P(r,n,s=>s.material.queue>5,r.length),e.clearBufferfv(e.COLOR,0,[.05,.05,.05,1]),e.clearBufferfv(e.DEPTH,0,[1]);for(const s of this.scene.cameras){const o=s.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),l=s.prepare(o.aspectRatio);e.viewport(o.x,o.y,o.w,o.h);for(let d=n;d<a;++d)r[d].layer&s.cullMask&&r[d].draw(e,l)}if(n=a,a=P(r,n,s=>s.material.queue>6,r.length),a>n){e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE),e.enable(e.BLEND);for(const s of this.scene.cameras){const o=s.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),l=s.prepare(o.aspectRatio);e.viewport(o.x,o.y,o.w,o.h);for(let d=n;d<a;++d)r[d].layer&s.cullMask&&r[d].draw(e,l)}e.disable(e.BLEND)}}),n=P(r,a,i=>i.material.queue===7,r.length),a=P(r,n,i=>i.material.queue>7,r.length),n<a&&(w(this.depthPeeler,e,i=>{for(let s=0;s<this.depthPeeler.length;++s){const o=i.layer(s),l=[this.depthPeeler.width,this.depthPeeler.height];e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.DEPTH,0,[1]);for(const d of this.scene.cameras){const f=d.viewport(this.depthPeeler.width,this.depthPeeler.height).map(Math.round),v=d.prepare(f.aspectRatio);e.viewport(f.x,f.y,f.w,f.h);for(let u=n;u<a;++u)r[u].layer&d.cullMask&&(r[u].material.setUniformValues({depthPeelReference:o,depthPeelScreenSize:l,depthBias:1e-4},!0),r[u].draw(e,v),r[u].material.setUniformValues({depthPeelReference:null},!0))}}}),w(this.framebuffer,e,i=>{e.viewport(0,0,this.framebufferWidth,this.framebufferHeight),e.disable(e.DEPTH_TEST),e.blendFuncSeparate(e.ONE,e.SRC_ALPHA,e.ZERO,e.ONE),e.enable(e.BLEND),this.depthPeeler.blend(e,this.quadMesh),e.disable(e.BLEND),e.enable(e.DEPTH_TEST)})),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.toneMap.use(e),this.quadMesh.draw(e,0),this.inputSystem.reset()}}function P(t,e,r,n=-1){for(let a=e;a<t.length;++a)if(r(t[a],a,t))return a;return n}function m(t,e){return t.push(e),e}class Ke{constructor(e,r,n){c(this,"rotator");c(this,"translator");c(this,"inputSystem");this.rotator=e,this.translator=r,this.inputSystem=n}preUpdate(e,r){const a=this.rotator.trs.rotation;a[0]-=this.inputSystem.dragDelta[1]*.5,a[1]-=this.inputSystem.dragDelta[0]*.5;const i=.05,s=this.translator.trs.translation;s[2]=Re(s[2]+this.inputSystem.scrollDelta*i,1,5)}}function $(t){return t instanceof Error?t:new Error(String(t))}async function Ze(t,e,r){const n=r.scene,a=m(n.nodes,new N(null,"center")),i=m(n.nodes,new N(a,"camera"));i.trs.translation[2]=3,a.addComponent(new Ke(a,i,r.inputSystem));const s=new Me(xe.deg(45),.1,1e3),o=m(n.cameras,new W(i,0,s));o.normalizedViewportRect.w=.5,o.cullMask^=4;const l=m(n.cameras,new W(i,0,s));l.normalizedViewportRect.w=.5,l.normalizedViewportRect.x=.5,l.cullMask^=2;const d=K(t,Q.createBackdrop("backdrop"));new O(t,d,r.standardVertexModel);const f=S(t,Be),v=D(t,Ue),u=new p(t,"skybox",r.standardVertexModel,f,v),b=new E(t,u,{name:"ocean",queue:5});S(t,Y);const y=S(t,Ve),L=D(t,ke),B=D(t,Oe),F=new p(t,"pbr",r.standardVertexModel,y,L),M=new p(t,"pbrDepthPeeling",r.standardVertexModel,y,B),T=await e.loadImageBitmapCube(["/skybox/ocean/right.jpg","/skybox/ocean/left.jpg","/skybox/ocean/top.jpg","/skybox/ocean/bottom.jpg","/skybox/ocean/front.jpg","/skybox/ocean/back.jpg"]),_=new R(t,t.TEXTURE_CUBE_MAP,11,t.SRGB8_ALPHA8,1024,1024);_.bind(t).subImageCube(0,0,0,t.RGBA,t.UNSIGNED_BYTE,T).parameteri(t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR).parameteri(t.TEXTURE_MAG_FILTER,t.LINEAR).generateMipmap(),T.forEach(le=>le.close()),b.setUniformValues({skybox:_});const U=S(t,ge),V=D(t,He),k=new p(t,"irradiance",r.standardVertexModel,U,V),h=new E(t,k,{uniforms:{envMap:_}}),x=new I(t,t.FRAMEBUFFER),J=Ae(t,128,h,r.quadMesh,x),ee=new C(t,t.VERTEX_SHADER,Se),re=new C(t,t.FRAGMENT_SHADER,Ne),te=new p(t,"prefiltered",r.standardVertexModel,ee,re),ne=new E(t,te,{uniforms:{envMap:_}}),G=6,ae=Le(t,G,3,ne,r.quadMesh,x),X={baseColorMap:r.whiteTexture,brdfLutMap:r.brdfLutMap,irradianceEnvMap:J,maxLevel:G,prefilteredEnvMap:ae,baseColorValue:[0,0,0,1]},oe=m(n.materials,new E(t,F,{name:"standard",queue:6,quiet:!0,uniforms:X})),se=m(n.materials,new E(t,M,{name:"depthPeeling",queue:7,quiet:!0,uniforms:X})),j=m(n.nodes,new N(null,"sphere"));j.trs.scale=be(20,20,20);const ie=new URL("/ToyCar.gltf",window.location.toString()),ce=await e.loadGltf(ie.href),de=new Je(r,j,t.STATIC_DRAW,oe,se);Ie(ce,de)}function Qe(t){const e=2*(t[3]*t[0]+t[1]*t[2]),r=1-2*(t[0]*t[0]+t[1]*t[1]),n=H(Math.atan2(e,r)),a=Math.sqrt(1+2*(t[3]*t[1]-t[0]*t[2])),i=Math.sqrt(1-2*(t[3]*t[1]-t[0]*t[2])),s=H(2*Math.atan2(a,i)-Math.PI/2),o=2*(t[3]*t[2]+t[0]*t[1]),l=1-2*(t[1]*t[1]+t[2]*t[2]),d=H(Math.atan2(o,l));return[n,s,d]}class Je{constructor(e,r,n,a,i){c(this,"renderer");c(this,"materials");c(this,"standardMaterial");c(this,"usage");c(this,"root");const s=new Map;s.set("transparentFabric",a.clone({uniforms:{roughness:1,baseColorValue:[1,0,0,.7]}})),s.set("transparentToyCar",a.clone({uniforms:{roughness:0,baseColorValue:[0,1,0,.5]}})),s.set("transparentGlass",a.clone({uniforms:{roughness:0,baseColorValue:[0,0,1,.3]}})),s.set("depthPeelingFabric",i.clone({uniforms:{roughness:1,baseColorValue:[1,0,0,.7]}})),s.set("depthPeelingToyCar",i.clone({uniforms:{roughness:0,baseColorValue:[0,1,0,.5]}})),s.set("depthPeelingGlass",i.clone({uniforms:{roughness:0,baseColorValue:[0,0,1,.3]}}));for(const o of s.values())e.scene.materials.push(o);this.renderer=e,this.standardMaterial=a,this.materials=s,this.root=r,this.usage=n}addBufferObject(e,r){const n=new _e(this.renderer.gl,e);return n.bind(this.renderer.gl).data(r,this.usage),n}addNode(e){return m(this.renderer.scene.nodes,new N(this.root,e))}setParentNode(e,r){e.parent=r}setScale(e,r){g(e.trs.scale,r)}setRotation(e,r){g(e.trs.rotation,Qe(r))}setTranslation(e,r){g(e.trs.translation,r)}addMesh(e,r,n,a){const i={name:e,attributes:n,drawMode:r,indices:a};return new O(this.renderer.gl,i,this.renderer.standardVertexModel)}linkNodeMesh(e,r){const n=this.renderer.gl,a=r.geometry.name,i=this.materials.get("transparent"+a)??this.standardMaterial,s=this.materials.get("depthPeeling"+a)??this.standardMaterial;this.renderer.scene.drawers.push(new q(n,e,r,i,2)),this.renderer.scene.drawers.push(new q(n,e,r,s,4))}}try{let t=function(o){o.preventDefault(),a.inputSystem.scroll(o.deltaY),a.requestRender()};const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");he(e,1024);const r=me(e),n=new pe,a=new Ye(r),i=new Ee(o=>{switch(o.touchDrags.length){case 1:{const l=o.touchDrags[0];a.inputSystem.drag(l.delta[0],l.delta[1]);break}case 2:{const l=o.touchDrags[0],d=o.touchDrags[1],f=A(l.currentPos,l.delta),v=A(d.currentPos,d.delta),u=z(A(f,v)),b=z(A(l.currentPos,d.currentPos));a.inputSystem.scroll(u-b);break}}a.requestRender()}),s=new ve(o=>{a.inputSystem.drag(o.delta[0],o.delta[1]),a.requestRender()});e.addEventListener("wheel",t,{passive:!1}),e.addEventListener("mousedown",o=>s.mouseDown(o)),document.addEventListener("mousemove",o=>s.mouseMove(o)),document.addEventListener("mouseup",o=>s.mouseUp(o)),e.addEventListener("touchstart",o=>i.touchStart(o)),document.addEventListener("touchend",o=>i.touchEnd(o)),document.addEventListener("touchmove",o=>i.touchMove(o)),async function(){try{await Ze(r,n,a),a.requestRender()}catch(o){console.error($(o))}}()}catch(t){const e=document.body,r=$(t).message,n=document.createElement("pre");n.classList.add("error"),n.append(r),e.prepend(n)}
